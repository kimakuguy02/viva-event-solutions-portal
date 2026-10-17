import React, { useEffect, useState } from 'react';
import { AdminCard, AdminSearch, AdminEmpty, StatusPill, AdminLoading, AdminError } from './AdminUI';
import { platformSession, usePlatformSession } from '../../services/platformSession';
import { getSetting, upsertSetting, logSettingsAudit, SETTING_KEYS, type FeatureFlags } from '../../services/supabase/settingsService';
import { ToggleLeft, ToggleRight, Calendar } from 'lucide-react';

/* Feature Flags — état on/off RÉEL via app_settings (settingsService) ;
   métadonnées (env, cible, dates) en SESSION via platformSession (R2-08).
   Jamais d'état inventé : sans Supabase, lecture impossible = message explicite. */

const FLAG_DEFS: { code: keyof FeatureFlags; name: string; description: string }[] = [
  { code: 'quotesEnabled', name: 'Devis', description: 'Guichet de demande de devis public et suivi.' },
  { code: 'liveHubEnabled', name: 'Hub Live', description: 'Événements hybrides, streaming et Q&A.' },
  { code: 'ticketingEnabled', name: 'Billetterie', description: 'Vente et contrôle des billets.' },
  { code: 'votingEnabled', name: 'Votes & sondages', description: 'Consultations et votes en direct.' },
  { code: 'clientPortalEnabled', name: 'Portail client', description: 'Espace personnel des clients.' },
  { code: 'visitorRadarEnabled', name: 'Radar visiteurs', description: 'Suivi des visites et leads.' },
  { code: 'maintenanceMode', name: 'Maintenance', description: 'Bascule le portail en mode maintenance.' },
];

export const FeatureFlagManager: React.FC = () => {
  usePlatformSession();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSetting<FeatureFlags>(SETTING_KEYS.features, {
        quotesEnabled: true, liveHubEnabled: true, ticketingEnabled: true, votingEnabled: true,
        clientPortalEnabled: true, visitorRadarEnabled: true, maintenanceMode: false,
      });
      setFlags(res.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (code: keyof FeatureFlags) => {
    if (!flags) return;
    const updated = { ...flags, [code]: !flags[code] };
    setSaving(code);
    try {
      await upsertSetting(SETTING_KEYS.features, updated);
      const confirmed = await getSetting<FeatureFlags>(SETTING_KEYS.features, updated);
      setFlags(confirmed.value);
      await logSettingsAudit('FEATURE_FLAG_TOGGLED', SETTING_KEYS.features, { key: code, value: confirmed.value[code] });
    } catch (e) {
      setFlags({ ...flags });
      setError(`Échec : ${e instanceof Error ? e.message : String(e)}. Valeur précédente conservée.`);
    } finally {
      setSaving(null);
    }
  };

  const shown = FLAG_DEFS.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.code.includes(search));

  return (
    <AdminCard
      title="Feature flags"
      subtitle="On/off persisté (Supabase). Environnement, cible et dates en session (R2-08)."
      action={<AdminSearch value={search} onChange={setSearch} placeholder="Rechercher…" />}
    >
      {loading ? (
        <AdminLoading label="Chargement des flags…" />
      ) : error && !flags ? (
        <AdminError message={error} onRetry={load} />
      ) : !flags ? (
        <AdminEmpty hint="Flags inaccessibles." />
      ) : (
        <div className="space-y-3">
          {error && <AdminError message={error} />}
          {shown.map((f) => {
            const on = flags[f.code];
            const meta = platformSession.flagMetaOf(f.code);
            return (
              <div key={f.code} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{f.name} <span className="font-mono text-[10px] text-slate-500">{f.code}</span></div>
                    <div className="text-[11px] text-slate-400">{f.description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill active={on} activeLabel="Activé" inactiveLabel="Désactivé" />
                    <button
                      onClick={() => toggle(f.code)}
                      disabled={saving === f.code}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                      title={on ? 'Désactiver (persisté)' : 'Activer (persisté)'}
                    >
                      {on ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <label className="text-slate-400">Environnement
                    <select value={meta.env} onChange={(e) => platformSession.setFlagMeta(f.code, { env: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white">
                      <option value="production">production</option><option value="staging">staging</option><option value="dev">dev</option>
                    </select>
                  </label>
                  <label className="text-slate-400">Cible
                    <select value={meta.target} onChange={(e) => platformSession.setFlagMeta(f.code, { target: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white">
                      <option value="tous">tous</option><option value="staff">staff</option><option value="clients">clients</option><option value="roles">rôles… (R2-08)</option>
                    </select>
                  </label>
                  <label className="text-slate-400">Début
                    <input type="date" value={meta.startsAt ?? ''} onChange={(e) => platformSession.setFlagMeta(f.code, { startsAt: e.target.value || undefined })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white" />
                  </label>
                  <label className="text-slate-400">Fin
                    <input type="date" value={meta.endsAt ?? ''} onChange={(e) => platformSession.setFlagMeta(f.code, { endsAt: e.target.value || undefined })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white" />
                  </label>
                </div>
                <p className="text-[10px] text-slate-600 flex items-center gap-1"><Calendar className="w-3 h-3" /> Impact : {on ? 'fonctionnalité visible selon l’audience' : 'fonctionnalité masquée partout'} — métadonnées non persistées (R2-08).</p>
              </div>
            );
          })}
          {shown.length === 0 && <AdminEmpty hint="Aucun flag ne correspond." />}
        </div>
      )}
    </AdminCard>
  );
};
