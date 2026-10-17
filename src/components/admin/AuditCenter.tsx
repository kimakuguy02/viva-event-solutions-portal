import React, { useMemo, useState } from 'react';
import { AdminCard, AdminSearch, AdminEmpty, AdminLoading, AdminError } from './AdminUI';
import { useAuditEvents } from '../../hooks/useAuditEvents';
import type { AuditResult } from '../../types/platformBuilder';

/* Centre d'audit — consomme l'audit RÉEL (hook multi-source). Aucun événement
   fabriqué : vide = vide. Prêt pour l'audit serveur (source 'supabase'). */

const RESULT_LABEL: Record<AuditResult, string> = { success: 'Succès', failure: 'Échec', denied: 'Refusé' };

export const AuditCenter: React.FC = () => {
  const { events, loading, error, source, reload } = useAuditEvents(150);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | AuditResult>('all');
  const [filterModule, setFilterModule] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const modules = useMemo(() => [...new Set(events.map((e) => e.module).filter(Boolean))], [events]);
  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    const matchQ = !q || e.action.toLowerCase().includes(q) || e.actorEmail.toLowerCase().includes(q) || e.resource.toLowerCase().includes(q);
    return matchQ && (filterResult === 'all' || e.result === filterResult) && (filterModule === 'all' || e.module === filterModule);
  });

  return (
    <AdminCard
      title="Centre d'audit"
      subtitle={`Source réelle : ${source} — aucun événement simulé.`}
      action={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} placeholder="Acteur, action, ressource…" />
          <button onClick={() => reload()} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer">
            Actualiser
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'success', 'failure', 'denied'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilterResult(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${filterResult === r ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
          >
            {r === 'all' ? 'Tous' : RESULT_LABEL[r]}
          </button>
        ))}
        <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
          <option value="all">Tous modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-[11px] text-slate-500 ml-auto">{filtered.length} événement(s)</span>
      </div>

      {loading ? (
        <AdminLoading label="Chargement de l'audit…" />
      ) : error ? (
        <AdminError message={error} onRetry={() => reload()} />
      ) : filtered.length === 0 ? (
        <AdminEmpty title="Aucune donnée disponible" hint="Aucun événement accessible avec vos permissions — l'audit serveur se remplira à l'usage." />
      ) : (
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {filtered.map((e) => (
            <div key={e.id} className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="w-full p-3 flex items-start justify-between gap-3 text-left cursor-pointer">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{e.action}</div>
                  <div className="text-[11px] text-slate-400 truncate">{e.actorEmail} • {e.module} • {e.resource}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${e.result === 'success' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}>
                    {RESULT_LABEL[e.result]}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">{e.timestamp ? new Date(e.timestamp).toLocaleString('fr-FR') : '—'}</div>
                </div>
              </button>
              {expanded === e.id && (
                <div className="px-3 pb-3 text-[11px] text-slate-400 space-y-1 border-t border-slate-800/60 pt-2 font-mono">
                  <div>id : {e.id}</div>
                  {e.resourceId && <div>resource_id : {e.resourceId}</div>}
                  <div>source : {e.source}</div>
                  {e.details && <div className="whitespace-pre-wrap break-all">détails : {e.details}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
};
