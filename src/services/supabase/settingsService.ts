// Service Paramètres — Wave 1 (app_settings = SSOT)
// Règles : erreurs propagées (jamais de faux succès), pas de fallback silencieux
// vers Firestore/localStorage, relecture PG après écriture, audit après confirmation.
import { supabase, requireSupabase } from '../supabase';

export interface FinanceSettings {
  exchangeRateCDF: number;
  vatRatePercent: number;
  doubleSignatureThresholdUSD: number;
}

export interface FeatureFlags {
  quotesEnabled: boolean;
  liveHubEnabled: boolean;
  ticketingEnabled: boolean;
  votingEnabled: boolean;
  clientPortalEnabled: boolean;
  visitorRadarEnabled: boolean;
  maintenanceMode: boolean;
}

export const SETTING_KEYS = {
  finance: 'finance.defaults',
  features: 'features.defaults',
  contact: 'contact.defaults',
  branding: 'branding.defaults',
} as const;

export function isSupabaseSettingsAvailable(): boolean {
  return supabase !== null;
}

export async function getSetting<T>(key: string, fallback: T): Promise<{ value: T; fromCache: false }> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('app_settings').select('value').eq('key', key).single();
  if (error) throw new Error(`Lecture paramètre '${key}' impossible : ${error.message}`);
  return { value: (data?.value ?? fallback) as T, fromCache: false };
}

export async function upsertSetting(key: string, value: unknown): Promise<void> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise pour modifier les paramètres.');
  const { error } = await sb
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw new Error(`Écriture paramètre '${key}' refusée : ${error.message}`);
  // Relecture de confirmation (la valeur affichée vient du serveur, jamais du draft)
  const { data, error: readError } = await sb.from('app_settings').select('value').eq('key', key).single();
  if (readError || JSON.stringify(data?.value) !== JSON.stringify(value)) {
    throw new Error(`Confirmation de lecture impossible pour '${key}'.`);
  }
}

/** Audit serveur : actor imposé par le trigger 010 (auth.uid) quand appliqué ;
 *  en attendant, actor = id de session courante (jamais un champ libre). */
export async function logSettingsAudit(action: string, resourceId: string, metadata: Record<string, unknown>): Promise<void> {
  const sb = requireSupabase();
  try {
    const { data } = await sb.auth.getUser();
    await sb.from('audit_logs').insert({
      actor_user_id: data.user?.id ?? null,
      action,
      resource: 'app_settings',
      resource_id: resourceId,
      metadata,
      result: 'success',
    });
  } catch (e) {
    console.warn('[settingsService] Audit non bloquant :', e);
  }
}
