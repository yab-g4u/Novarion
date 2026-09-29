import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ProbeRealtimeEvent, CollaboratorPresence } from '../types/collaboration';

// Safe environment credential resolution
export const resolveSupabaseConfig = () => {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

  const localUrl =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined'
      ? localStorage.getItem('probe_supabase_url')
      : null;
  const localKey =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined'
      ? localStorage.getItem('probe_supabase_anon_key')
      : null;

  const envUrl =
    localUrl ||
    metaEnv?.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
    '';

  const envKey =
    localKey ||
    metaEnv?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
    '';

  const supabaseUrl = envUrl || 'https://xuvbglgacdtpmsqchcce.supabase.co';
  const supabaseAnonKey =
    envKey ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dmJnbGdhY2R0cG1zcWNoY2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4Mzg4MDAsImV4cCI6MjAyNTQxNDgwMH0.demo-placeholder-token';

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: Boolean(envUrl && envKey),
    isCustom: Boolean(localUrl && localKey),
  };
};

export const setCustomSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    if (url && key) {
      localStorage.setItem('probe_supabase_url', url.trim());
      localStorage.setItem('probe_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('probe_supabase_url');
      localStorage.removeItem('probe_supabase_anon_key');
    }
    supabaseInstance = null;
  }
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig();
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 25,
        },
      },
    });
  }
  return supabaseInstance;
};

export interface RoomConnectionHandlers {
  onEvent: (event: ProbeRealtimeEvent) => void;
  onPresenceSync: (presences: CollaboratorPresence[]) => void;
  onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR') => void;
}

export interface InvestigationRoomChannel {
  sendEvent: (event: ProbeRealtimeEvent) => Promise<void>;
  updatePresenceNode: (nodeId: string | null) => Promise<void>;
  leave: () => Promise<void>;
}

interface MultiplexedRoomEntry {
  investigationId: string;
  channelName: string;
  channel: RealtimeChannel;
  localBc: BroadcastChannel | null;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  subscribers: Map<string, { user: CollaboratorPresence; handlers: RoomConnectionHandlers }>;
  peerPresences: Map<string, CollaboratorPresence>;
  processedEventIds: Set<string>;
}

const activeRoomPool = new Map<string, MultiplexedRoomEntry>();

const computeMergedPresences = (entry: MultiplexedRoomEntry): CollaboratorPresence[] => {
  const map = new Map<string, CollaboratorPresence>();
  for (const sub of entry.subscribers.values()) {
    map.set(sub.user.id, sub.user);
  }
  for (const [id, p] of entry.peerPresences.entries()) {
    map.set(id, p);
  }
  try {
    const state = entry.channel.presenceState();
    Object.values(state).forEach((presences) => {
      (presences as any[]).forEach((p) => {
        if (p && p.id) {
          map.set(p.id, {
            id: p.id,
            name: p.name || 'Collaborator',
            color: p.color || '#0F52BA',
            joinedAt: p.joinedAt || Date.now(),
            activeNodeId: p.activeNodeId || null,
          });
        }
      });
    });
  } catch {
    // ignore if channel not ready
  }
  return Array.from(map.values());
};

const notifyAllPresence = (entry: MultiplexedRoomEntry) => {
  const list = computeMergedPresences(entry);
  for (const sub of entry.subscribers.values()) {
    sub.handlers.onPresenceSync(list);
  }
};

const notifyAllStatus = (
  entry: MultiplexedRoomEntry,
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
) => {
  entry.status = status;
  for (const sub of entry.subscribers.values()) {
    sub.handlers.onStatusChange?.(status);
  }
};

const dispatchEventToSubscribers = (
  entry: MultiplexedRoomEntry,
  event: ProbeRealtimeEvent,
  excludeSubscriberId?: string
) => {
  const payloadObj = event.payload as any;
  const eventId =
    payloadObj?.id ||
    (event.type === 'test_status_changed'
      ? `tsc_${payloadObj?.testId}_${payloadObj?.status}_${payloadObj?.timestamp}`
      : event.type === 'evidence_challenged'
      ? `ech_${payloadObj?.nodeId}_${payloadObj?.challenged}_${payloadObj?.timestamp}`
      : null);

  if (eventId) {
    if (entry.processedEventIds.has(eventId)) {
      return;
    }
    entry.processedEventIds.add(eventId);
    if (entry.processedEventIds.size > 2000) {
      const first = entry.processedEventIds.values().next().value;
      if (first) entry.processedEventIds.delete(first);
    }
  }

  for (const [subId, sub] of entry.subscribers.entries()) {
    if (excludeSubscriberId && subId === excludeSubscriberId) continue;
    sub.handlers.onEvent(event);
  }
};

/**
 * Joins or attaches to the multiplexed Supabase Realtime channel:
 * `investigation:{investigationId}`
 *
 * Uses:
 * - Supabase Realtime Broadcast (`probe_event`)
 * - Supabase Realtime Presence (`sync`, `join`, `leave`)
 * - Local BroadcastChannel bridge (`probe_bc_investigation_{investigationId}`) for instant cross-tab sync
 */
export const joinInvestigationRoom = (
  investigationId: string,
  userPresence: CollaboratorPresence,
  handlers: RoomConnectionHandlers
): InvestigationRoomChannel => {
  const cleanId = (investigationId || 'T4fTpH').trim();
  const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let entry = activeRoomPool.get(cleanId);

  if (!entry) {
    const client = getSupabaseClient();
    const channelName = `investigation:${cleanId}`;
    const localBcName = `probe_bc_investigation_${cleanId}`;

    let localBc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        localBc = new BroadcastChannel(localBcName);
      } catch {
        localBc = null;
      }
    }

    // Use public Broadcast/Presence channel (private: false) so anonymous/shared link recipients never hit a 403
    const channel: RealtimeChannel = client.channel(channelName, {
      config: {
        private: false,
        broadcast: { ack: false, self: false },
        presence: { key: userPresence.id },
      },
    });

    entry = {
      investigationId: cleanId,
      channelName,
      channel,
      localBc,
      status: 'CONNECTING',
      subscribers: new Map(),
      peerPresences: new Map(),
      processedEventIds: new Set(),
    };

    activeRoomPool.set(cleanId, entry);

    const currentEntry = entry;

    if (localBc) {
      localBc.onmessage = (msg) => {
        const data = msg.data;
        if (!data) return;
        if (data.type === 'probe_event' && data.payload) {
          dispatchEventToSubscribers(currentEntry, data.payload as ProbeRealtimeEvent);
        } else if (data.type === 'probe_presence_ping' && data.presence) {
          currentEntry.peerPresences.set(data.presence.id, data.presence);
          notifyAllPresence(currentEntry);
          const firstSub = currentEntry.subscribers.values().next().value;
          if (firstSub) {
            try {
              localBc?.postMessage({
                type: 'probe_presence_pong',
                presence: firstSub.user,
              });
            } catch {
              // ignore
            }
          }
        } else if (data.type === 'probe_presence_pong' && data.presence) {
          currentEntry.peerPresences.set(data.presence.id, data.presence);
          notifyAllPresence(currentEntry);
        } else if (data.type === 'probe_presence_leave' && data.userId) {
          currentEntry.peerPresences.delete(data.userId);
          notifyAllPresence(currentEntry);
        }
      };
    }

    channel
      .on('broadcast', { event: 'probe_event' }, ({ payload }) => {
        if (payload) {
          dispatchEventToSubscribers(currentEntry, payload as ProbeRealtimeEvent);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        notifyAllPresence(currentEntry);
      })
      .on('presence', { event: 'join' }, () => {
        notifyAllPresence(currentEntry);
      })
      .on('presence', { event: 'leave' }, () => {
        notifyAllPresence(currentEntry);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          notifyAllStatus(currentEntry, 'CONNECTED');
          try {
            await channel.track(userPresence);
          } catch {
            // ignore track errors
          }
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          // If BroadcastChannel is active locally, keep peer collaboration working smoothly
          notifyAllStatus(currentEntry, localBc ? 'CONNECTED' : 'DISCONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          notifyAllStatus(currentEntry, localBc ? 'CONNECTED' : 'ERROR');
        }
      });
  }

  // Register this subscriber
  entry.subscribers.set(subscriberId, { user: userPresence, handlers });
  handlers.onStatusChange?.(entry.status);
  notifyAllPresence(entry);

  // Announce presence on local BroadcastChannel
  try {
    entry.localBc?.postMessage({
      type: 'probe_presence_ping',
      presence: userPresence,
    });
    if (entry.status === 'CONNECTING' && entry.localBc) {
      // Mark connected immediately for local/hybrid sync while Supabase websocket handshakes
      notifyAllStatus(entry, 'CONNECTED');
    }
  } catch {
    // ignore
  }

  const currentEntry = entry;

  return {
    sendEvent: async (event: ProbeRealtimeEvent) => {
      // 1. Dispatch to other subscribers in the same browser tab immediately
      dispatchEventToSubscribers(currentEntry, event, subscriberId);

      // 2. Broadcast over Supabase Realtime channel
      try {
        if (currentEntry.status === 'CONNECTED') {
          await currentEntry.channel.send({
            type: 'broadcast',
            event: 'probe_event',
            payload: event,
          });
        }
      } catch {
        // Fallback to BroadcastChannel + DB persistence
      }

      // 3. Broadcast over local BroadcastChannel for instant multi-tab sync
      try {
        currentEntry.localBc?.postMessage({
          type: 'probe_event',
          payload: event,
        });
      } catch {
        // ignore
      }
    },

    updatePresenceNode: async (nodeId: string | null) => {
      const sub = currentEntry.subscribers.get(subscriberId);
      if (sub) {
        sub.user = { ...sub.user, activeNodeId: nodeId };
      }
      notifyAllPresence(currentEntry);
      try {
        if (currentEntry.status === 'CONNECTED') {
          await currentEntry.channel.track({
            ...userPresence,
            activeNodeId: nodeId,
          });
        }
      } catch {
        // ignore
      }
    },

    leave: async () => {
      currentEntry.subscribers.delete(subscriberId);
      if (currentEntry.subscribers.size === 0) {
        activeRoomPool.delete(cleanId);
        try {
          currentEntry.localBc?.postMessage({
            type: 'probe_presence_leave',
            userId: userPresence.id,
          });
          currentEntry.localBc?.close();
        } catch {
          // ignore
        }
        try {
          await currentEntry.channel.unsubscribe();
        } catch {
          // ignore
        }
      } else {
        notifyAllPresence(currentEntry);
      }
    },
  };
};
