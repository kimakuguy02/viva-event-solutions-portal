import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { VIVA_COMPANY_INFO, DEPARTMENTS_DATA } from '../../data/vivaData';
import { ResetDatabaseModal } from './ResetDatabaseModal';
import { RolesManagerModal } from './RolesManagerModal';
import { useAuditEvents } from '../../hooks/useAuditEvents';
import {
  LayoutDashboard,
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
  Sparkles,
  RotateCcw,
  ShieldAlert,
  Terminal,
  UserCheck,
  Lock,
  Activity,
  Building2,
  Boxes,
  Edit3,
  Sliders,
  Settings
} from 'lucide-react';

interface AdminDashboardProps {
  setCurrentTab: (tab: string) => void;
  onOpenNewProject: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentTab, onOpenNewProject }) => {
  const { currentUser, isAdminGeneral, isSuperAdmin } = useAuth();
  const { projects, quotes, equipment, partners } = useProjectData();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  // Journal d'audit serveur (Supabase `audit_logs`, RLS) — jamais un cache local.
  const { events: auditLogs, source: auditSource } = useAuditEvents(100);

  // Calculated Stats
  const totalBudgetUSD = projects.reduce((acc, p) => acc + p.budgetUSD, 0);
  const pendingQuotesCount = quotes.filter(q => q.status === 'submitted' || q.status === 'under_review').length;
  const activeProjectsCount = projects.filter(p => p.status === 'en_cours' || p.status === 'retroplanning').length;
  const availableEquipmentRatio = Math.round(
    (equipment.reduce((acc, e) => acc + e.quantityAvailable, 0) /
      equipment.reduce((acc, e) => acc + e.quantityTotal, 0)) * 100
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              ⚡ Direction Générale & God Mode ({currentUser.role.toUpperCase()})
            </span>
            <span className="text-xs text-slate-400">Kinshasa / Gombe • Sécurité RLS Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Tableau de Bord Exécutif • VIVA EVENT
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Supervision en temps réel des sommets d'État, du guichet unique de devis, des 14 départements opérationnels et des 7 collèges de prestataires d'élite.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenNewProject}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Nouveau Projet / Sommet</span>
          </button>

          <button
            onClick={() => setCurrentTab('admin-quotes')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Traiter les Devis ({pendingQuotesCount})</span>
          </button>

          <button
            onClick={() => setCurrentTab('admin-visitors')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 cursor-pointer"
            title="Consulter les visiteurs détectés, réactions et identification"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Radar Visiteurs & Prospects</span>
          </button>

          {/* SUPER ADMINISTRATION button: Visible ONLY to SUPER_ADMIN */}
          {isSuperAdmin && (
            <button
              onClick={() => setCurrentTab('super-admin')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 cursor-pointer transform hover:scale-105 transition-all"
              title="Accéder au Centre de Contrôle Super Administration"
            >
              <span>👑 SUPER ADMINISTRATION</span>
            </button>
          )}

          {/* GESTION DES RÔLES & UTILISATEURS button: Visible ONLY to admin_general */}
          {isAdminGeneral && (
            <button
              onClick={() => setIsRolesModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs sm:text-sm border border-blue-500/40 flex items-center gap-2 cursor-pointer shadow-lg"
              title="Gestion des rôles, permissions et utilisateurs (God Mode)"
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Gestion des Rôles & Équipes</span>
            </button>
          )}

          {/* RESET DATABASE button: Visible ONLY to admin_general */}
          {isAdminGeneral && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs sm:text-sm border border-rose-500/40 flex items-center gap-2 cursor-pointer shadow-lg"
              title="Réinitialisation sécurisée de la base de données (God Mode)"
            >
              <RotateCcw className="w-4 h-4 animate-spin-slow" />
              <span>Réinitialiser la Base (RESET DATABASE)</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Projets Actifs */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projets & Sommets</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{activeProjectsCount}</div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>En phase opérationnelle / rétroplanning</span>
            </div>
          </div>
        </div>

        {/* 2. Budget Engagé */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume Budgétaire</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">${totalBudgetUSD.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Devise USD contractée RDC</span>
            </div>
          </div>
        </div>

        {/* 3. Devis en Attente */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guichet Devis</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{pendingQuotesCount}</div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Dossiers à chiffrer sous 24h</span>
            </div>
          </div>
        </div>

        {/* 4. Disponibilité Parc Lourd */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parc Technique</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{availableEquipmentRatio}%</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Équipements prêts au déploiement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Center Core Management Modules (CMS + ERP + RBAC + Platform Config) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Centre de Contrôle Administratif VIVA EVENT SOLUTIONS</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilotage centralisé de la gouvernance, des collaborateurs, de l'éditorial et des modules opérationnels.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Structure Organisationnelle */}
          <div
            onClick={() => setCurrentTab('admin-structure')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors flex items-center justify-between">
              <span>Structure Organisationnelle</span>
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              9 Directions générales, 36 sous-directions, attributions de responsabilités et missions statutaires.
            </p>
          </div>

          {/* Card 2: Rôles & Utilisateurs (RBAC) */}
          <div
            onClick={() => setCurrentTab('admin-users')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
              <span>Utilisateurs & RBAC</span>
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Annuaire des collaborateurs, matrice des 17 permissions système, création de comptes et suspensions.
            </p>
          </div>

          {/* Card 3: Menus & Navigation */}
          <div
            onClick={() => setCurrentTab('admin-menus')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
              <span>Gestion des Menus</span>
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Ordonnancement des routes du portail, règles de visibilité selon les rôles (public, client, staff, admin).
            </p>
          </div>

          {/* Card 4: Modules ERP */}
          <div
            onClick={() => setCurrentTab('admin-modules')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors flex items-center justify-between">
              <span>Modules ERP & Briques</span>
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Activation et désactivation à chaud des modules ERP (Devis, Parc, Live, Sûreté, Facturation).
            </p>
          </div>

          {/* Card 5: CMS & Contenus */}
          <div
            onClick={() => setCurrentTab('admin-cms')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-850 cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Edit3 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors flex items-center justify-between">
              <span>CMS & Édition Textuelle</span>
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Message officiel de bienvenue, 15 pôles d'ingénierie, valeurs, slogans avec versioning et rollback.
            </p>
          </div>

          {/* Card 6: Paramètres Plateforme */}
          <div
            onClick={() => setCurrentTab('admin-settings')}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-300 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors flex items-center justify-between">
              <span>Configuration Platform</span>
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Coordonnées institutionnelles, devises USD/CDF, chartes graphiques et commutateurs de fonctionnalités.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Logs Section (God Mode Only) */}
      {isAdminGeneral && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Journaux d'Audit & Sécurité (Table `audit_logs`)
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs">
              {auditLogs.length} événements • source : {auditSource}
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucun journal d'audit enregistré pour le moment.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">{log.action}</span>
                    <span className="text-slate-300">{log.actorEmail}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>{log.resource}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Grid: Projects list & Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column : Active Projects */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Projets & Sommets en Cours
              </h3>
            </div>
            <button
              onClick={() => setCurrentTab('admin-projects')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {projects.slice(0, 3).map(proj => (
              <div key={proj.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">{proj.code}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    {proj.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">{proj.title}</h4>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Avancement Rétroplanning</span>
                    <span className="text-white font-bold">{proj.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      style={{ width: `${proj.progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Lieu : {proj.location}</span>
                  <span className="font-bold text-white">${proj.budgetUSD.toLocaleString()} USD</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column : Incoming Quotes to Review */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Dernières Demandes de Devis
              </h3>
            </div>
            <button
              onClick={() => setCurrentTab('admin-quotes')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <span>Gérer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {quotes.slice(0, 3).map(quote => (
              <div key={quote.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400">{quote.referenceNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                    {quote.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{quote.eventName}</h4>
                <p className="text-[11px] text-slate-400">
                  Client : <strong className="text-slate-200">{quote.clientName}</strong> ({quote.clientOrganization})
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>{quote.estimatedAttendees} Invités</span>
                  <span className="font-bold text-amber-400">${quote.estimatedBudgetUSD.toLocaleString()} USD</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Logs Real-Time Security Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Journal d'Audit & Sécurité en Temps Réel (Audit Logs)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Horodatage UTC+1 (Kinshasa) • source : {auditSource}
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            Aucun log d'événement d'administration enregistré pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Action Exécutée</th>
                  <th className="p-3">Ressource</th>
                  <th className="p-3">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px] bg-slate-950/20">
                {auditLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : 'N/A'}</td>
                    <td className="p-3 text-amber-300 font-bold">{log.actorEmail}</td>
                    <td className="p-3 text-white font-sans font-bold">{log.action}</td>
                    <td className="p-3 text-emerald-400">{log.resource}</td>
                    <td className="p-3 text-slate-400">{log.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Database Confirmation Modal */}
      <ResetDatabaseModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* Roles & Permissions Management Modal (God Mode) */}
      <RolesManagerModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
      />
    </div>
  );
};
