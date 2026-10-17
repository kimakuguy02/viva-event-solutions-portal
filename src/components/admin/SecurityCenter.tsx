import React, { useMemo } from 'react';
import { AdminCard, AdminEmpty, AdminLoading } from './AdminUI';
import { useAuditEvents } from '../../hooks/useAuditEvents';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, KeyRound, LogOut, AlertTriangle } from 'lucide-react';

/* Centre de sécurité — DERIVÉ UNIQUEMENT de données réelles :
   session AuthContext, événements denied/failure de l'audit réel, changements
   de rôles lus dans l'audit. Aucune statistique inventée : vide = vide. */

export const SecurityCenter: React.FC = () => {
  const { currentUser, authMode, roleCode, userPermissions } = useAuth();
  const { events, loading, source } = useAuditEvents(200);

  const denied = useMemo(() => events.filter((e) => e.result === 'denied' || e.result === 'failure'), [events]);
  const roleChanges = useMemo(
    () => events.filter((e) => /ROLE|PERMISSION|USER_STATUS|PASSWORD/i.test(e.action)),
    [events],
  );

  return (
    <div className="space-y-4">
      <AdminCard title="Session active" subtitle="Données de session réelles (aucune session fantôme affichée).">
        <dl className="text-xs space-y-2">
          <div className="flex justify-between gap-3"><dt className="text-slate-400">Compte</dt><dd className="text-white font-mono truncate">{currentUser.email}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-400">Rôle vérifié (serveur)</dt><dd className="text-amber-400 font-mono font-bold">{roleCode ?? currentUser.role}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-400">Autorité</dt><dd className="text-white font-mono">{authMode}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-400">Permissions chargées</dt><dd className="text-white font-mono">{userPermissions.length}</dd></div>
        </dl>
      </AdminCard>

      <AdminCard
        title="Tentatives refusées / échecs"
        subtitle={`Source réelle : ${source} — accès, validations et logins refusés.`}
        action={<span className="flex items-center gap-1.5 text-xs font-bold text-rose-300"><AlertTriangle className="w-4 h-4" />{denied.length}</span>}
      >
        {loading ? (
          <AdminLoading />
        ) : denied.length === 0 ? (
          <AdminEmpty title="Aucune donnée disponible" hint="Aucun refus enregistré accessible. Les refus futurs apparaîtront ici." />
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {denied.slice(0, 30).map((e) => (
              <div key={e.id} className="p-3 rounded-xl bg-slate-950 border border-rose-500/20 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{e.action}</div>
                  <div className="text-[11px] text-slate-400 truncate">{e.actorEmail} • {e.resource}</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{e.timestamp ? new Date(e.timestamp).toLocaleString('fr-FR') : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Changements de rôles & événements sensibles" subtitle="Filtre sur l'audit réel (rôles, permissions, statuts, mots de passe).">
        {loading ? (
          <AdminLoading />
        ) : roleChanges.length === 0 ? (
          <AdminEmpty title="Aucune donnée disponible" hint="Aucun changement sensible enregistré accessible." />
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {roleChanges.slice(0, 30).map((e) => (
              <div key={e.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{e.action}</div>
                  <div className="text-[11px] text-slate-400 truncate">{e.actorEmail} • {e.timestamp ? new Date(e.timestamp).toLocaleString('fr-FR') : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Paramètres de sécurité" subtitle="État déclaratif — valeurs effectives côté serveur à valider.">        <dl className="text-xs space-y-2">
          <div className="flex justify-between"><dt className="text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> RLS + trigger anti-escalade</dt><dd className="text-slate-500">Distant (migrations 001→011)</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5 text-slate-500" /> Expiration d'inactivité</dt><dd className="text-white font-mono">30 min (appliquée)</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">Verrouillage anti-bruteforce</dt><dd className="text-white font-mono">5 essais / 5 min (modal client)</dd></div>
        </dl>
      </AdminCard>

      <AdminCard title="Risques connus (issus des audits)" subtitle="Dette documentée — affichée comme telle, jamais comme résolue.">
        <div className="space-y-2">
          {([
            { id: 'SEC-06', label: 'Secrets versionnés (.env, hashes JSON, clés Firebase)', severity: 'CRITIQUE', status: 'PENDING' },
            { id: 'SEC-04', label: 'Endpoint /api/sync/push sans autorisation', severity: 'CRITIQUE', status: 'PENDING' },
            { id: 'SEC-05', label: 'XSS stockée possible (CMS sans sanitize, pas de CSP)', severity: 'CRITIQUE', status: 'PENDING' },
            { id: 'R3-1', label: 'Acteur audit forgeable avant trigger 010', severity: 'ÉLEVÉ', status: 'MITIGATED' },
            { id: 'R3-4', label: 'Insert transaction avec statut arbitraire', severity: 'ÉLEVÉ', status: 'MITIGATED' },
            { id: 'SEC-11', label: 'PBKDF2 10k + salt partagé bootstrap', severity: 'ÉLEVÉ', status: 'PENDING' },
            { id: 'SEC-13', label: 'PII de démonstration dans le code', severity: 'ÉLEVÉ', status: 'PENDING' },
            { id: 'P0', label: 'Reset destructif (neutralisé : armement + SUPER_ADMIN)', severity: 'MOYEN', status: 'MITIGATED' },
            { id: 'OTP-DAF', label: 'OTP DAF simulé côté client', severity: 'ÉLEVÉ', status: 'PENDING' },
          ] as const).map(r => (
            <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold text-slate-400">{r.id}</span>
              <span className="text-slate-200 flex-1 min-w-[12rem]">{r.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${r.severity === 'CRITIQUE' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : r.severity === 'ÉLEVÉ' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-slate-500/15 text-slate-300 border-slate-600'}`}>{r.severity}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${r.status === 'MITIGATED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-600'}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
};
