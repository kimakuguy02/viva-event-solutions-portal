import React, { useState } from 'react';
import { useAuth, OFFICIAL_VIVA_WORKERS } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { ErpDashboard } from './ErpDashboard';
import { AccountingModule } from './AccountingModule';
import { CrmModule } from './CrmModule';
import { ProjectsTasksModule } from './ProjectsTasksModule';
import { AssetsInventoryModule } from './AssetsInventoryModule';
import { HumanResourcesModule } from './HumanResourcesModule';
import { GovernanceSecurityModule } from './GovernanceSecurityModule';
import { StaffMessagingModule } from './StaffMessagingModule';
import { AccountCenterModule } from './AccountCenterModule';
import { PurchasesModule } from './PurchasesModule';
import { RbacAccessDeniedView } from './RbacAccessDeniedView';
import { canUserAccessModule, ErpModuleId, ERP_RBAC_PERMISSIONS } from '../../utils/rbac';
import { AdminLoginModal } from '../common/AdminLoginModal';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  CheckSquare,
  Truck,
  Briefcase,
  ShieldCheck,
  Building2,
  ChevronDown,
  LogOut,
  UserCheck,
  Sparkles,
  Database,
  ArrowRightLeft,
  Lock,
  ShieldAlert,
  MessageSquare,
  Bell,
  KeyRound,
  ShoppingCart
} from 'lucide-react';

export const EnterpriseErpView: React.FC = () => {
  const {
    currentUser,
    logoutToVisitor,
    isDg,
    isDaf,
    isAdminRh,
    isChefEquipe,
    isCommercial
  } = useAuth();

  const { isOnline, transactions } = useEnterpriseErp();

  // Tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isWorkerSwitcherOpen, setIsWorkerSwitcherOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Double signature pending count for badge
  const pendingDoubleSigs = transactions.filter(
    t => t.requiresDoubleSignature && t.validationStatus !== 'valide'
  ).length;

  const tabs: Array<{
    id: string;
    label: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    {
      id: 'accounting',
      label: 'Comptabilité & Trésorerie',
      icon: DollarSign,
      badge: pendingDoubleSigs > 0 ? `${pendingDoubleSigs} OTP` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black'
    },
    { id: 'crm', label: 'Clients & CRM', icon: Users },
    { id: 'projects-tasks', label: 'Projets & Tâches', icon: CheckSquare },
    { id: 'assets-loans', label: 'Actifs & Prêts Matériel', icon: Truck },
    { id: 'purchases', label: 'Achats & Commandes', icon: ShoppingCart },
    { id: 'human-resources', label: 'Ressources Humaines', icon: Briefcase },
    { id: 'messaging', label: 'Messagerie Interne', icon: MessageSquare, badge: 'Nouveau', badgeColor: 'bg-blue-500 text-white font-bold' },
    { id: 'account-center', label: 'Mon Compte & Notifs', icon: UserCheck },
    { id: 'governance', label: 'Gouvernance & Sécurité', icon: ShieldCheck }
  ];

  // RBAC verification for currently selected tab (Messaging and Account Center are allowed for all staff workers)
  const isCurrentTabAllowed = activeTab === 'messaging' || activeTab === 'account-center' || canUserAccessModule(currentUser.role, activeTab as ErpModuleId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Enterprise Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400 font-black text-lg font-mono">
              V
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>VIVA EVENT SOLUTIONS</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  ERP SARLU
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Système Équilibré de Gestion d'Entreprise • Kinshasa RDC
            </p>
          </div>
        </div>

        {/* Worker Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Fast Worker Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsWorkerSwitcherOpen(!isWorkerSwitcherOpen)}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs flex items-center gap-2 text-white font-bold cursor-pointer transition-all shadow"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    OFFICIAL_VIVA_WORKERS.find(w => w.role === currentUser.role)?.avatarColor || '#F59E0B'
                }}
              />
              <span className="hidden sm:inline line-clamp-1 max-w-[180px]">
                {currentUser.name}
              </span>
              <span className="sm:hidden">Profil</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isWorkerSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-scale-in space-y-3">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{currentUser.name}</h4>
                    <p className="text-[10px] text-amber-400 font-mono">{currentUser.jobTitle || currentUser.role}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400">Identifiant :</span>
                    <span className="font-mono text-slate-200 truncate max-w-[160px]">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400">Statut de sécurité :</span>
                    <span className="font-mono text-emerald-400 font-bold">Vérifié Serveur (RBAC)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsWorkerSwitcherOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Changer de Compte (Connexion Sécurisée)</span>
                  </button>
                  <button
                    onClick={() => {
                      logoutToVisitor();
                      setIsWorkerSwitcherOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-rose-500/30"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Fermer la session (Déconnexion)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Switch to Super Administration if Super Admin */}
          {(currentUser.role === 'admin_general' || currentUser.email === 'misterk1502@gmail.com' || currentUser.email === 'direction.generale@viva-eventsolutions.cd') && (
            <button
              onClick={() => {
                logoutToVisitor();
                // We can set session or trigger super admin tab
              }}
              className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
              title="Accéder à l'espace Super Administration"
            >
              <span>⚙️ Super Administration</span>
            </button>
          )}

          {/* Quick Switch to Public Portal & Presentation */}
          <button
            onClick={logoutToVisitor}
            className="px-3 py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow"
            title="Consulter le portail public et la présentation officielle"
          >
            <span>Portail Public & Présentation</span>
            <span className="text-[11px]">→</span>
          </button>

          {/* Logout / Switch to Visitor */}
          <button
            onClick={logoutToVisitor}
            title="Quitter la session travailleur"
            className="p-2 rounded-2xl bg-slate-800/60 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer border border-slate-800"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Tab Navigation Bar */}
      <nav className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-2 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const canAccess = tab.id === 'messaging' || tab.id === 'account-center' || canUserAccessModule(currentUser.role, tab.id as ErpModuleId);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? canAccess
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black'
                    : canAccess
                    ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    : 'bg-slate-950/60 text-slate-500 hover:text-slate-400 border border-slate-800/50 opacity-75'
                }`}
              >
                <Icon className={`w-4 h-4 ${
                  isActive 
                    ? canAccess ? 'text-slate-950' : 'text-rose-400' 
                    : canAccess ? 'text-slate-400' : 'text-slate-600'
                }`} />
                <span>{tab.label}</span>

                {!canAccess && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
                    <Lock className="w-2.5 h-2.5 text-rose-400" />
                    <span>Restreint</span>
                  </span>
                )}

                {tab.badge && canAccess && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] uppercase ${tab.badgeColor || 'bg-amber-400 text-slate-950'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Tab Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {!isCurrentTabAllowed ? (
          <RbacAccessDeniedView
            moduleId={activeTab as ErpModuleId}
            onNavigateToAllowedTab={(tabId) => setActiveTab(tabId)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && <ErpDashboard setActiveTab={setActiveTab} />}
            {activeTab === 'accounting' && <AccountingModule />}
            {activeTab === 'crm' && <CrmModule />}
            {activeTab === 'projects-tasks' && <ProjectsTasksModule />}
            {activeTab === 'assets-loans' && <AssetsInventoryModule />}
            {activeTab === 'purchases' && <PurchasesModule />}
            {activeTab === 'human-resources' && <HumanResourcesModule />}
            {activeTab === 'messaging' && <StaffMessagingModule />}
            {activeTab === 'account-center' && <AccountCenterModule onNavigateTab={(tab) => setActiveTab(tab)} />}
            {activeTab === 'governance' && <GovernanceSecurityModule />}
          </>
        )}
      </main>

      <AdminLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
