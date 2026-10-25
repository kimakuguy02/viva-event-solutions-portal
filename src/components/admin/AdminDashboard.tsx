import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { RolesManagerModal } from './RolesManagerModal';
import { useAuditEvents } from '../../hooks/useAuditEvents';
import {
  Compass,
  FileText,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  ShieldAlert,
  Terminal,
  Activity,
  Building2,
  Boxes,
  Edit3,
  Settings,
  CalendarDays,
  PartyPopper,
  BarChart3
} from 'lucide-react';

interface AdminDashboardProps {
  setCurrentTab: (tab: string) => void;
  onOpenNewProject: () => void;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_LABELS: Record<string, string> = {
  conception: 'Conception',
  retroplanning: 'Rétroplanning',
  en_cours: 'En cours',
  cloture: 'Clôturé',
  archive: 'Archivé'
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentTab, onOpenNewProject }) => {
  const { currentUser, isAdminGeneral, isSuperAdmin } = useAuth();
  const { projects, quotes, equipment } = useProjectData();
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  // Journal d'audit serveur (Supabase `audit_logs`, RLS) — jamais un cache local.
  const { events: auditLogs, source: auditSource } = useAuditEvents(100);

  const totalBudgetUSD = projects.reduce((acc, p) => acc + p.budgetUSD, 0);
  const pendingQuotesCount = quotes.filter(q => q.status === 'submitted' || q.status === 'under_review').length;
  const activeProjectsCount = projects.filter(p => p.status === 'en_cours' || p.status === 'retroplanning').length;
  const totalEquipment = equipment.reduce((acc, e) => acc + e.quantityTotal, 0);
  const availableEquipmentRatio = totalEquipment > 0
    ? Math.round((equipment.reduce((acc, e) => acc + e.quantityAvailable, 0) / totalEquipment) * 100)
    : 0;

  // Charge par mois calculée sur les vrais projets chargés (12 derniers mois glissants).
  const monthlyLoad = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; count: number; budget: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: MONTH_LABELS[date.getMonth()],
        count: 0,
        budget: 0
      });
    }
    const index = new Map(buckets.map((bucket, i) => [bucket.key, i]));
    projects.forEach(project => {
      if (!project.startDate) return;
      const date = new Date(project.startDate);
      if (Number.isNaN(date.getTime())) return;
      const position = index.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (position === undefined) return;
      buckets[position].count += 1;
      buckets[position].budget += project.budgetUSD;
    });
    return buckets;
  }, [projects]);

  const maxMonthlyCount = Math.max(1, ...monthlyLoad.map(m => m.count));
  const hasMonthlyData = monthlyLoad.some(m => m.count > 0);

  const recentEvents = useMemo(() => {
    return [...projects]
      .filter(project => project.status !== 'archive')
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      .slice(0, 4);
  }, [projects]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach(project => counts.set(project.status, (counts.get(project.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      count
    }));
  }, [projects]);

  return (
    <div className="space-y-8 pb-10">
      {/* Bandeau exécutif */}
      <div
        className="relative overflow-hidden p-6 sm:p-8 rounded-[var(--viva-radius-card)] border"
        style={{
          backgroundColor: 'var(--viva-bg-surface)',
          borderColor: 'var(--viva-border)',
          boxShadow: 'var(--viva-card-shadow)'
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl opacity-60"
          style={{ background: 'var(--viva-accent-gradient)' }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="px-2.5 py-0.5 rounded-full font-bold text-[11px]"
                style={{ backgroundColor: 'var(--viva-muted-surface)', color: 'var(--viva-primary)' }}
              >
                {currentUser.role.toUpperCase()}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--viva-text-muted)' }}>Kinshasa • Sécurité RLS active</span>
            </div>
            <h2 className="viva-heading text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--viva-text-main)' }}>
              Bonjour, {currentUser.name.split(' ')[0]} 👋
            </h2>
            <p className="text-xs sm:text-sm mt-1 max-w-2xl" style={{ color: 'var(--viva-text-muted)' }}>
              Projets, devis et parc technique — statistiques calculées à partir des données réellement chargées.
            </p>
          </div>

          <div className="relative flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewProject}
              className="viva-btn-primary px-4 py-2.5 text-xs sm:text-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Nouveau projet</span>
            </button>
            <button
              onClick={() => setCurrentTab('admin-quotes')}
              className="viva-btn-ghost px-4 py-2.5 text-xs sm:text-sm"
              style={{ color: 'var(--viva-text-main)' }}
            >
              <FileText className="w-4 h-4" />
              <span>Devis à traiter ({pendingQuotesCount})</span>
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setCurrentTab('super-admin')}
                className="viva-btn-ghost px-4 py-2.5 text-xs sm:text-sm"
                style={{ color: 'var(--viva-text-main)' }}
              >
                <Shield className="w-4 h-4" />
                <span>Super administration</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Projets & sommets', value: String(activeProjectsCount), icon: Compass, hint: 'En phase opérationnelle', tone: 'var(--viva-primary)', soft: 'rgba(139, 92, 246, 0.12)' },
          { label: 'Volume budgétaire', value: `$${totalBudgetUSD.toLocaleString()}`, icon: DollarSign, hint: 'Devise USD contractée', tone: 'var(--viva-accent)', soft: 'rgba(255, 94, 94, 0.12)' },
          { label: 'Guichet devis', value: String(pendingQuotesCount), icon: FileText, hint: 'Dossiers à chiffrer', tone: 'var(--viva-tertiary)', soft: 'rgba(59, 130, 246, 0.12)' },
          { label: 'Parc technique', value: `${availableEquipmentRatio}%`, icon: Truck, hint: 'Équipements disponibles', tone: '#10B981', soft: 'rgba(16, 185, 129, 0.12)' }
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="viva-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--viva-text-muted)' }}>
                  {kpi.label}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: kpi.soft, color: kpi.tone }}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="viva-heading text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--viva-text-main)' }}>
                {kpi.value}
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--viva-text-muted)' }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: kpi.tone }} />
                <span>{kpi.hint}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphique + répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 viva-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="viva-heading text-base font-bold flex items-center gap-2" style={{ color: 'var(--viva-text-main)' }}>
                <BarChart3 className="w-4 h-4" style={{ color: 'var(--viva-primary)' }} />
                Charge événementielle — 12 derniers mois
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--viva-text-muted)' }}>
                Nombre de projets dont la date de début tombe dans le mois.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--viva-muted-surface)', color: 'var(--viva-text-muted)' }}>
              {projects.length} projet(s) chargé(s)
            </span>
          </div>

          {hasMonthlyData ? (
            <div>
              <div className="flex items-end gap-1.5 sm:gap-2.5 h-44" role="img" aria-label="Histogramme du nombre de projets par mois">
                {monthlyLoad.map(month => {
                  const height = Math.max(4, Math.round((month.count / maxMonthlyCount) * 100));
                  return (
                    <div key={month.key} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 group">
                      <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--viva-text-main)' }}>
                        {month.count}
                      </span>
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${height}%`,
                          background: month.count > 0 ? 'var(--viva-accent-gradient)' : 'var(--viva-border)',
                          minHeight: month.count > 0 ? 8 : 3
                        }}
                        title={`${month.label} : ${month.count} projet(s) — $${month.budget.toLocaleString()}`}
                      />
                      <span className="text-[9px] sm:text-[10px] truncate w-full text-center" style={{ color: 'var(--viva-text-muted)' }}>
                        {month.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px]" style={{ color: 'var(--viva-text-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--viva-accent-gradient)' }} />
                  Projets démarrés
                </span>
                <span>Survolez une barre pour voir le budget associé.</span>
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center gap-2 rounded-2xl" style={{ backgroundColor: 'var(--viva-muted-surface)' }}>
              <BarChart3 className="w-7 h-7" style={{ color: 'var(--viva-text-muted)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--viva-text-main)' }}>Aucune donnée de charge sur 12 mois</p>
              <p className="text-[11px] max-w-xs" style={{ color: 'var(--viva-text-muted)' }}>
                Le graphique s'alimente dès que des projets avec date de début sont enregistrés. Aucune valeur n'est simulée.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 viva-card p-5 sm:p-6 space-y-4">
          <h3 className="viva-heading text-base font-bold flex items-center gap-2" style={{ color: 'var(--viva-text-main)' }}>
            <Layers className="w-4 h-4" style={{ color: 'var(--viva-accent)' }} />
            Répartition par statut
          </h3>
          {statusBreakdown.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'var(--viva-text-muted)' }}>Aucun projet chargé.</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(entry => {
                const percent = Math.round((entry.count / Math.max(1, projects.length)) * 100);
                return (
                  <div key={entry.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold" style={{ color: 'var(--viva-text-main)' }}>{entry.label}</span>
                      <span style={{ color: 'var(--viva-text-muted)' }}>{entry.count} · {percent}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--viva-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: 'var(--viva-accent-gradient)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isAdminGeneral && (
            <button
              onClick={() => setIsRolesModalOpen(true)}
              className="viva-btn-ghost w-full py-2 text-xs"
              style={{ color: 'var(--viva-text-main)' }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rôles & équipes</span>
            </button>
          )}
        </div>
      </div>

      {/* Événements récents + devis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 viva-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--viva-border)' }}>
            <h3 className="viva-heading text-base font-bold flex items-center gap-2" style={{ color: 'var(--viva-text-main)' }}>
              <PartyPopper className="w-4 h-4" style={{ color: 'var(--viva-accent)' }} />
              Événements récents
            </h3>
            <button
              onClick={() => setCurrentTab('admin-projects')}
              className="text-xs font-bold flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--viva-primary)' }}
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentEvents.length === 0 ? (
            <p className="text-xs italic py-4 text-center" style={{ color: 'var(--viva-text-muted)' }}>
              Aucun projet enregistré. Créez un projet pour alimenter cette liste.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map(project => (
                <div
                  key={project.id}
                  className="p-4 rounded-2xl border space-y-2"
                  style={{ borderColor: 'var(--viva-border)', backgroundColor: 'var(--viva-muted-surface)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--viva-primary)' }}>{project.code}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'var(--viva-bg-surface)', color: 'var(--viva-text-muted)' }}>
                      {STATUS_LABELS[project.status] ?? project.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold line-clamp-1" style={{ color: 'var(--viva-text-main)' }}>{project.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--viva-text-muted)' }}>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{project.startDate || 'Date à définir'}</span>
                    <span className="flex items-center gap-1"><Compass className="w-3 h-3" />{project.location || 'Lieu à définir'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span style={{ color: 'var(--viva-text-muted)' }}>Avancement {project.progressPercent}%</span>
                    <span className="font-bold" style={{ color: 'var(--viva-text-main)' }}>${project.budgetUSD.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--viva-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${project.progressPercent}%`, background: 'var(--viva-accent-gradient)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 viva-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--viva-border)' }}>
            <h3 className="viva-heading text-base font-bold flex items-center gap-2" style={{ color: 'var(--viva-text-main)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--viva-tertiary)' }} />
              Dernières demandes de devis
            </h3>
            <button
              onClick={() => setCurrentTab('admin-quotes')}
              className="text-xs font-bold flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--viva-primary)' }}
            >
              <span>Gérer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {quotes.length === 0 ? (
            <p className="text-xs italic py-4 text-center" style={{ color: 'var(--viva-text-muted)' }}>
              Aucune demande de devis enregistrée.
            </p>
          ) : (
            <div className="space-y-2.5">
              {quotes.slice(0, 3).map(quote => (
                <div
                  key={quote.id}
                  className="p-3.5 rounded-2xl border space-y-1.5"
                  style={{ borderColor: 'var(--viva-border)', backgroundColor: 'var(--viva-muted-surface)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--viva-primary)' }}>{quote.referenceNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'var(--viva-bg-surface)', color: 'var(--viva-text-muted)' }}>
                      {quote.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold line-clamp-1" style={{ color: 'var(--viva-text-main)' }}>{quote.eventName}</h4>
                  <p className="text-[11px]" style={{ color: 'var(--viva-text-muted)' }}>
                    {quote.clientName}{quote.clientOrganization ? ` · ${quote.clientOrganization}` : ''}
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t" style={{ borderColor: 'var(--viva-border)', color: 'var(--viva-text-muted)' }}>
                    <span>{quote.estimatedAttendees} invités</span>
                    <span className="font-bold" style={{ color: 'var(--viva-text-main)' }}>${quote.estimatedBudgetUSD.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Centre de contrôle */}
      <div className="space-y-3">
        <div>
          <h3 className="viva-heading text-base font-bold flex items-center gap-2" style={{ color: 'var(--viva-text-main)' }}>
            <Shield className="w-4 h-4" style={{ color: 'var(--viva-primary)' }} />
            Centre de contrôle administratif
          </h3>
          <p className="text-xs" style={{ color: 'var(--viva-text-muted)' }}>
            Gouvernance, collaborateurs, éditorial et modules opérationnels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { tab: 'admin-structure', icon: Building2, title: 'Structure organisationnelle', text: 'Directions, sous-directions et missions statutaires.', tone: 'var(--viva-primary)' },
            { tab: 'admin-users', icon: Users, title: 'Utilisateurs & RBAC', text: 'Annuaire des collaborateurs, permissions et suspensions.', tone: 'var(--viva-tertiary)' },
            { tab: 'admin-menus', icon: Layers, title: 'Gestion des menus', text: 'Ordonnancement des routes et visibilité par rôle.', tone: '#10B981' },
            { tab: 'admin-modules', icon: Boxes, title: 'Modules ERP', text: 'Activation à chaud des briques opérationnelles.', tone: 'var(--viva-accent)' },
            { tab: 'admin-cms', icon: Edit3, title: 'CMS & édition', text: 'Contenus officiels, pôles, valeurs et versioning.', tone: '#F59E0B' },
            { tab: 'admin-settings', icon: Settings, title: 'Configuration', text: 'Coordonnées, devises et commutateurs de fonctionnalités.', tone: '#0891B2' }
          ].map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.tab}
                onClick={() => setCurrentTab(card.tab)}
                className="viva-card viva-card-hover p-5 text-left group"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: 'var(--viva-muted-surface)', color: card.tone }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold flex items-center justify-between gap-2" style={{ color: 'var(--viva-text-main)' }}>
                  <span>{card.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                </h4>
                <p className="text-xs mt-1" style={{ color: 'var(--viva-text-muted)' }}>{card.text}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Journal d'audit */}
      <div className="viva-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--viva-border)' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: '#10B981' }} />
            <h3 className="viva-heading text-base font-bold" style={{ color: 'var(--viva-text-main)' }}>
              Journal d'audit & sécurité
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--viva-muted-surface)', color: 'var(--viva-text-muted)' }}>
            {auditLogs.length} événement(s) • source : {auditSource}
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs italic py-4 text-center" style={{ color: 'var(--viva-text-muted)' }}>
            Aucun journal d'audit accessible pour cette session.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ color: 'var(--viva-text-muted)' }}>
                <tr className="font-mono uppercase text-[10px]">
                  <th className="py-2 pr-3">Horodatage</th>
                  <th className="py-2 pr-3">Utilisateur</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Ressource</th>
                  <th className="py-2">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--viva-border)' }}>
                {auditLogs.slice(0, 8).map(log => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-3 font-mono text-[11px]" style={{ color: 'var(--viva-text-muted)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : 'N/A'}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold" style={{ color: 'var(--viva-text-main)' }}>{log.actorEmail}</td>
                    <td className="py-2.5 pr-3" style={{ color: 'var(--viva-primary)' }}>{log.action}</td>
                    <td className="py-2.5 pr-3" style={{ color: 'var(--viva-text-muted)' }}>{log.resource}</td>
                    <td className="py-2.5" style={{ color: 'var(--viva-text-muted)' }}>{log.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isAdminGeneral && auditLogs.length > 0 && (
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--viva-text-muted)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
            <span>Journaux append-only lus directement depuis la source serveur.</span>
          </div>
        )}
      </div>

      <RolesManagerModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
      />
    </div>
  );
};
