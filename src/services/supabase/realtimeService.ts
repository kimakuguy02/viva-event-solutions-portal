// Supabase Realtime Service — Viva Events
// Permet la synchronisation bidirectionnelle en direct sur les tables métier principales :
// projects, quotes, erp_transactions, clients.
// S'assure du respect du cycle de vie des canaux Supabase et du désabonnement systématique.

import { supabase, isSupabaseConfigured } from '../supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeTable = 'projects' | 'quotes' | 'erp_transactions' | 'clients';

export interface SubscriptionHandle {
  channel: RealtimeChannel | null;
  unsubscribe: () => void;
}

export function subscribeToTableChanges<T extends Record<string, any>>(
  table: RealtimeTable,
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void,
  filter?: string
): SubscriptionHandle {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      channel: null,
      unsubscribe: () => {},
    };
  }

  const channelName = `realtime:${table}:${Math.random().toString(36).slice(2, 9)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: filter || undefined,
      },
      (payload) => {
        onChange(payload as RealtimePostgresChangesPayload<T>);
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.warn(`[Supabase Realtime] Erreur sur le canal ${channelName}:`, err);
      }
    });

  return {
    channel,
    unsubscribe: () => {
      if (supabase && channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    },
  };
}
