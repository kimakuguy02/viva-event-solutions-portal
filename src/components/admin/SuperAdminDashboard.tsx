import React, { useMemo } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { useAuth } from '../../context/AuthContext';
import { AdminCard, AdminEmpty } from './AdminUI';
import { useAuditEvents } from '../../hooks/useAuditEvents';
import { Users, FileText, FolderKanban, ListTodo, ShieldCheck, Database, Radio } from 'lucide-react';

/* Tableau de bord Super Admin — chiffres RÉELS issus des contextes chargés,
   horodatés comme tels. Toute donnée indisponible = état vide explicite,
   jamais de statistique inventée. */

function CountCard({ label, value, detail, icon }: { label: string; value: number | string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-slate-500 truncate">{detail}</div>
      </div>
    </div>
  );
}

export const SuperAdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, authMode, roleCode } = useAuth();
  const {
    cmsSections, dynamicMenus, dynamicModules, dynamicForms, formSubmissions,
    projects, quotes, directionsOrg, mediaItems,
  } = useProjectData();
  const { transactions, tasks, crmClients } = useEnterpriseErp();
  const { events, loading: auditLoading, source: auditSource } = useAuditEvents(8);

  const pendingQuotes = useMemo(() => quotes.filter((q) => q.status === 'submitted' || q.status === 'under_review').length, [quotes]);
  const pendingTx = useMemo(
    () => transactions.filter((t) => t.validationStatus === 'en_attente_manager' || t.validationStatus === 'en_attente_otp_daf').length,
    [transactions],
  );
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'termine').length, [tasks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <CountCard label="Utilisateurs (annuaire local)" value="—" detail="Source serveur à brancher (DATA REQUIREMENT)" icon={<Users className="w-5 h-5" />} />
        <CountCard label="Clients CRM" value={crmClients.length} detail="Contexte ERP chargé" icon={<Users className="w-5 h-5" />} />
        <CountCard label="Projets" value={projects.length} detail="Contexte projets chargé" icon={<FolderKanban className="w-5 h-5" />} />
        <CountCard label="Devis en attente" value={pendingQuotes} detail={`${quotes.length} devis chargés`} icon={<FileText className="w-5 h-5" />} />
        <CountCard label="Tâches ouvertes" value={openTasks} detail={`${tasks.length} tâches chargées`} icon={<ListTodo className="w-5 h-5" />} />
        <CountCard label="Transactions à valider" value={pendingTx} detail={`${transactions.length} écritures chargées`} icon={<ShieldCheck className="w-5 h-5" />} />
        <CountCard label="Sections CMS" value={cmsSections.length} detail={`${dynamicMenus.length} menus • ${dynamicModules.length} modules • ${dynamicForms.length} formulaires`} icon={<Database className="w-5 h-5" />} />
        <CountCard label="Médias / Directions" value={mediaItems.length} detail={`${directionsOrg.length} directions • ${formSubmissions.length} soumissions`} icon={<Radio className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminCard
          title="Activité récente"
          subtitle={auditLoading ? 'Chargement…' : `Source : ${auditSource} — aucune donnée simulée`}
          action={
            <button onClick={() => onNavigate('audit-history')} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer">
              Tout l'audit
            </button>
          }
        >
          {auditLoading ? (
            <p className="text-xs text-slate-500">Chargement des événements…</p>
          ) : events.length === 0 ? (
            <AdminEmpty title="Aucune donnée disponible" hint="Aucun événement d'audit accessible avec vos permissions." />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {events.map((e) => (
                <div key={e.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-400 truncate">{e.action}</div>
                    <div className="text-[11px] text-slate-400 truncate">{e.actorEmail} • {e.resource}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                    {e.timestamp ? new Date(e.timestamp).toLocaleString('fr-FR') : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard title="État système & session" subtitle="Données de session réelles">
          <dl className="text-xs space-y-2">
            <div className="flex justify-between"><dt className="text-slate-400">Compte</dt><dd className="text-white font-mono">{currentUser.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Rôle vérifié</dt><dd className="text-white font-mono">{roleCode ?? currentUser.role}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Autorité d'authentification</dt><dd className="text-white font-mono">{authMode}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Notifications</dt><dd className="text-slate-500">Aucune donnée disponible</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Alertes sécurité</dt><dd className="text-slate-500">Voir Centre de sécurité</dd></div>
          </dl>
        </AdminCard>
      </div>
    </div>
  );
};
