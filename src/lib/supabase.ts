import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ProbeRealtimeEvent, CollaboratorPresence } from '../types/collaboration';

// Safe environment credential resolution
export const resolveSupabaseConfig = () => {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('probe_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('probe_supabase_anon_key') : null;

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

  // Use provided credentials or valid public demo credentials for realtime websocket transport
  const supabaseUrl = envUrl || 'https://xuvbglgacdtpmsqchcce.supabase.co';
  const supabaseAnonKey = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dmJnbGdhY2R0cG1zcWNoY2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4Mzg4MDAsImV4cCI6MjAyNTQxNDgwMH0.demo-placeholder-token';

  return { supabaseUrl, supabaseAnonKey, isConfigured: Boolean(envUrl && envKey), isCustom: Boolean(localUrl && localKey) };
};

export const setCustomSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('probe_supabase_url', url.trim());
      localStorage.setItem('probe_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('probe_supabase_url');
      localStorage.removeItem('probe_supabase_anon_key');
    }
    // Reset instance so next call uses new client
    supabaseInstance = null;
  }
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig();
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
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

/**
 * Creates and manages a dynamic Supabase Realtime channel:
 * investigation:{investigationId}
 * 
 * Uses:
 * - Broadcast for live investigation events
 * - Presence for lightweight collaborator presence
 * - Local BroadcastChannel bridge for instant zero-latency multi-window sync
 */
export const joinInvestigationRoom = (
  investigationId: string,
  userPresence: CollaboratorPresence,
  handlers: RoomConnectionHandlers
): InvestigationRoomChannel => {
  const client = getSupabaseClient();
  const channelName = `investigation:${investigationId}`;
  const localBcName = `probe_bc_investigation_${investigationId}`;

  handlers.onStatusChange?.('CONNECTING');

  // 1. Cross-window BroadcastChannel for instant local tab-to-tab synchronization
  let localBc: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      localBc = new BroadcastChannel(localBcName);
      localBc.onmessage = (msg) => {
        if (msg.data?.type === 'probe_event' && msg.data?.payload) {
          handlers.onEvent(msg.data.payload as ProbeRealtimeEvent);
        } else if (msg.data?.type === 'probe_presence_ping') {
          // Send response to peer
          localBc?.postMessage({
            type: 'probe_presence_pong',
            presence: userPresence
          });
        }
      };
      // Announce presence locally
      localBc.postMessage({
        type: 'probe_presence_ping',
        presence: userPresence
      });
    } catch (e) {
      console.warn('[Probe Realtime] BroadcastChannel init fallback', e);
    }
  }

  // 2. Dynamic Supabase Realtime channel
  const channel: RealtimeChannel = client.channel(channelName, {
    config: {
      broadcast: { ack: false, self: false },
      presence: { key: userPresence.id },
    },
  });

  // Track received event IDs to prevent duplicate processing (idempotency)
  const processedEventIds = new Set<string>();

  const handleIncomingProbeEvent = (event: ProbeRealtimeEvent) => {
    // Generate unique ID based on payload
    const eventId = 'id' in event.payload ? (event.payload as any).id : `${event.type}_${Date.now()}`;
    if (eventId && processedEventIds.has(eventId)) {
      return;
    }
    if (eventId) {
      processedEventIds.add(eventId);
      if (processedEventIds.size > 2000) {
        // Keep set size reasonable
        const first = processedEventIds.values().next().value;
        if (first) processedEventIds.delete(first);
      }
    }
    handlers.onEvent(event);
  };

  channel
    .on('broadcast', { event: 'probe_event' }, ({ payload }) => {
      if (payload) {
        handleIncomingProbeEvent(payload as ProbeRealtimeEvent);
      }
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const list: CollaboratorPresence[] = [];
      Object.values(state).forEach((presences) => {
        (presences as any[]).forEach((p) => {
          if (p && p.id) {
            list.push({
              id: p.id,
              name: p.name || 'Collaborator',
              color: p.color || '#3B82F6',
              joinedAt: p.joinedAt || Date.now(),
              activeNodeId: p.activeNodeId || null
            });
          }
        });
      });
      // Deduplicate presence by user ID
      const unique = Array.from(new Map(list.map((item) => [item.id, item])).values());
      handlers.onPresenceSync(unique);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      // Refresh presence state on new joins
      const state = channel.presenceState();
      const list: CollaboratorPresence[] = [];
      Object.values(state).forEach((presences) => {
        (presences as any[]).forEach((p) => {
          if (p && p.id) {
            list.push({
              id: p.id,
              name: p.name || 'Collaborator',
              color: p.color || '#3B82F6',
              joinedAt: p.joinedAt || Date.now(),
              activeNodeId: p.activeNodeId || null
            });
          }
        });
      });
      const unique = Array.from(new Map(list.map((item) => [item.id, item])).values());
      handlers.onPresenceSync(unique);
    })
    .on('presence', { event: 'leave' }, () => {
      const state = channel.presenceState();
      const list: CollaboratorPresence[] = [];
      Object.values(state).forEach((presences) => {
        (presences as any[]).forEach((p) => {
          if (p && p.id) {
            list.push({
              id: p.id,
              name: p.name || 'Collaborator',
              color: p.color || '#3B82F6',
              joinedAt: p.joinedAt || Date.now(),
              activeNodeId: p.activeNodeId || null
            });
          }
        });
      });
      const unique = Array.from(new Map(list.map((item) => [item.id, item])).values());
      handlers.onPresenceSync(unique);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        handlers.onStatusChange?.('CONNECTED');
        try {
          await channel.track(userPresence);
        } catch (e) {
          console.warn('[Probe Realtime] Track presence error', e);
        }
      } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
        handlers.onStatusChange?.('DISCONNECTED');
      } else if (status === 'CHANNEL_ERROR') {
        handlers.onStatusChange?.('ERROR');
      }
    });

  return {
    sendEvent: async (event: ProbeRealtimeEvent) => {
      // 1. Broadcast over Supabase channel
      try {
        await channel.send({
          type: 'broadcast',
          event: 'probe_event',
          payload: event,
        });
      } catch (err) {
        console.warn('[Probe Realtime] Supabase broadcast failed, relying on peer bridge', err);
      }

      // 2. Also send over local BroadcastChannel for zero-latency multi-tab sync
      try {
        localBc?.postMessage({
          type: 'probe_event',
          payload: event
        });
      } catch (err) {
        // ignore
      }
    },

    updatePresenceNode: async (nodeId: string | null) => {
      try {
        await channel.track({
          ...userPresence,
          activeNodeId: nodeId
        });
      } catch (err) {
        // ignore
      }
    },

    leave: async () => {
      try {
        localBc?.close();
      } catch (e) {
        // ignore
      }
      try {
        await channel.unsubscribe();
      } catch (e) {
        // ignore
      }
    }
  };
};
