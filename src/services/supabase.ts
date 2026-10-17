// Client Supabase officiel — SOURCE DE VÉRITÉ FUTURE
// ÉTAPE 1 migration : connexion seule, aucune lecture/écriture métier ici.
// Firebase / Express / localStorage restent actifs (migration contrôlée PHASE 1).
// Règle : VITE_* = clés publiques (anon) uniquement. service_role = serveur/Edge jamais frontend.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_CONFIG_ERROR: string | null = !SUPABASE_URL
  ? 'VITE_SUPABASE_URL manquante. Renseigne .env.local (voir .env.example).'
  : !SUPABASE_ANON_KEY
    ? 'VITE_SUPABASE_ANON_KEY manquante. Renseigne .env.local (voir .env.example).'
    : null;

if (SUPABASE_CONFIG_ERROR) {
  console.warn(`[Supabase] ${SUPABASE_CONFIG_ERROR} Le client n'est pas initialisé ; l'app continue sur Firebase/Express.`);
}

// Client unique. Si env absentes, on n'initialise pas pour éviter un faux succès.
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'viva_supabase_auth',
        },
      })
    : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(SUPABASE_CONFIG_ERROR ?? 'Client Supabase non initialisé.');
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
