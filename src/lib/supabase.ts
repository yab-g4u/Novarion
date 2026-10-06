import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ProbeRealtimeEvent, CollaboratorPresence } from '../types/collaboration';

/**
 * Sanitizes a Supabase project URL so accidental path suffixes in deployment env vars
 * (e.g. `https://your-project.supabase.co/rest/v1/`) never cause `@supabase/supabase-js`
 * to request `/rest/v1/rest/v1` (404) or `/rest/v1/realtime/v1` (404).
 */
export const sanitizeSupabaseProjectUrl = (rawUrl: string): string => {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  const stripped = trimmed
    .replace(/\/+(rest|realtime|auth|storage|functions)\/v1(\/.*)?$/i, '')
    .replace(/\/+$/, '');
  try {
    const parsed = new URL(stripped);
    return parsed.origin;
  } catch {
    return stripped;
  }
};

export const resolveSupabaseConfig = () => {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

  const rawEnvUrl =
    metaEnv?.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' &&
      (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
    '';

  const rawEnvKey =
    metaEnv?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    metaEnv?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' &&
      (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env?.VITE_SUPABASE_ANON_KEY ||
        process.env?.SUPABASE_PUBLISHABLE_KEY ||
        process.env?.SUPABASE_ANON_KEY)) ||
    '';

  const cleanedEnvUrl = sanitizeSupabaseProjectUrl(rawEnvUrl);
  const cleanedEnvKey = rawEnvKey.trim();

  // Read strictly from environment variables; use inert placeholder if not configured in .env
  const supabaseUrl = cleanedEnvUrl || 'https://placeholder.supabase.co';
  const supabasePublishableKey = cleanedEnvKey || 'sb_publishable_unconfigured';

  const isConfigured = Boolean(
    cleanedEnvUrl &&
    cleanedEnvKey &&
    !cleanedEnvUrl.includes('placeholder.supabase.co') &&
    cleanedEnvKey !== 'sb_publishable_unconfigured'
  );

  return {
    supabaseUrl,
    supabasePublishableKey,
    supabaseAnonKey: supabasePublishableKey,
    rawEnvUrl,
    wasUrlSanitized: Boolean(rawEnvUrl && cleanedEnvUrl !== rawEnvUrl.replace(/\/+$/, '')),
    isConfigured,
  };
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const { supabaseUrl, supabasePublishableKey } = resolveSupabaseConfig();
    supabaseInstance = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  subscribers: Map<string, { user: CollaboratorPresence; handlers: RoomConnectionHandlers }>;
  processedEventIds: Set<string>;
}

const activeRoomPool = new Map<string, MultiplexedRoomEntry>();

const computeMergedPresences = (entry: MultiplexedRoomEntry): CollaboratorPresence[] => {
  const map = new Map<string, CollaboratorPresence>();
  for (const sub of entry.subscribers.values()) {
    map.set(sub.user.id, sub.user);
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
    // ignore if channel not yet subscribed
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
 * Joins the Supabase Realtime channel: `investigation:<investigationId>`
 */
export const joinInvestigationRoom = (
  investigationId: string,
  userPresence: CollaboratorPresence,
  handlers: RoomConnectionHandlers
): InvestigationRoomChannel => {
  const cleanId = investigationId.trim();
  const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let entry = activeRoomPool.get(cleanId);

  if (!entry) {
    const client = getSupabaseClient();
    const channelName = `investigation:${cleanId}`;

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
      status: 'CONNECTING',
      subscribers: new Map(),
      processedEventIds: new Set(),
    };

    activeRoomPool.set(cleanId, entry);
    const currentEntry = entry;

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
          notifyAllStatus(currentEntry, 'DISCONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          notifyAllStatus(currentEntry, 'ERROR');
        }
      });
  }

  entry.subscribers.set(subscriberId, { user: userPresence, handlers });
  handlers.onStatusChange?.(entry.status);
  notifyAllPresence(entry);

  const currentEntry = entry;

  return {
    sendEvent: async (event: ProbeRealtimeEvent) => {
      dispatchEventToSubscribers(currentEntry, event, subscriberId);
      try {
        await currentEntry.channel.send({
          type: 'broadcast',
          event: 'probe_event',
          payload: event,
        });
      } catch {
        // ignore transient websocket send errors
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
