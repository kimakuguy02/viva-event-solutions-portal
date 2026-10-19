import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EnterpriseErpProvider } from './context/EnterpriseErpContext';
import { ProjectDataProvider } from './context/ProjectDataContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { RoleSwitcherBar } from './components/layout/RoleSwitcherBar';
import { BrandCharterModal } from './components/common/BrandCharterModal';
import { ThemeStudioModal } from './components/common/ThemeStudioModal';
import { AdminLoginModal } from './components/common/AdminLoginModal';
import { EnterpriseLoginScreen } from './components/common/EnterpriseLoginScreen';
import { OfflineBanner } from './components/common/OfflineBanner';
import { EnterpriseErpView } from './components/enterprise/EnterpriseErpView';

// Client Components
import { ClientPortal } from './components/client/ClientPortal';
import { ClientAuthModal } from './components/common/ClientAuthModal';

// Visitor Components
import { HeroSection } from './components/visitor/HeroSection';
import { WelcomeAboutSection } from './components/visitor/WelcomeAboutSection';
import { VisionPillars } from './components/visitor/VisionPillars';
import { DepartmentsCatalog } from './components/visitor/DepartmentsCatalog';
import { PartnerCollegesView } from './components/visitor/PartnerCollegesView';
import { InteractiveQuoteForm } from './components/visitor/InteractiveQuoteForm';
import { VirtualEventHub } from './components/visitor/VirtualEventHub';
import { EquipmentShowcase } from './components/visitor/EquipmentShowcase';
import { OnlineTicketingModule } from './components/visitor/OnlineTicketingModule';
import { VotingPollsModule } from './components/visitor/VotingPollsModule';
import { OfficialAnnouncementsModule } from './components/visitor/OfficialAnnouncementsModule';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminContentEditor } from './components/admin/AdminContentEditor';
import { OrganizationalStructureManager } from './components/admin/OrganizationalStructureManager';
import { MenuManager } from './components/admin/MenuManager';
import { ModuleManager } from './components/admin/ModuleManager';
import { CmsAdvancedEditor } from './components/admin/CmsAdvancedEditor';
import { ProjectManager } from './components/admin/ProjectManager';
import { QuotesManager } from './components/admin/QuotesManager';
import { EquipmentInventory } from './components/admin/EquipmentInventory';
import { PartnerEcosystem } from './components/admin/PartnerEcosystem';
import { TechArchitectureViewer } from './components/admin/TechArchitectureViewer';
import { VisitorRadarViewer } from './components/admin/VisitorRadarViewer';
import { RolesAndUsersManager } from './components/admin/RolesAndUsersManager';
import { PlatformSettingsManager } from './components/admin/PlatformSettingsManager';
import { SuperAdminHub } from './components/admin/SuperAdminHub';
import { VisualEditOverlayModal } from './components/common/VisualEditOverlayModal';
import { ClientRegistrationModal } from './components/common/ClientRegistrationModal';
import { EventReservationModal } from './components/common/EventReservationModal';
import { NotFound404 } from './components/common/NotFound404';
import { RequireRole } from './components/auth/RequireRole';
import { usePageMeta } from './hooks/usePageMeta';
import { useProjectData } from './context/ProjectDataContext';

import {
  Compass,
  FileText,
  Truck,
  Users,
  Code2,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Palette,
  Edit3,
  X,
  Layers,
  Megaphone,
  Ticket,
  Vote,
  Activity,
  Calendar,
  UserPlus,
  Building2,
  Boxes,
  ArrowRightLeft,
  Settings
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, isAdmin, isStaffWorker, isSimulatingVisitor, isAdminGeneral, isSuperAdmin, staffPortal, setStaffPortal } = useAuth();
  const { activePalette, themeMode } = useTheme();
  const {
    directionsOrg,
    updateDirectionsOrg,
    dynamicMenus,
    updateDynamicMenus,
    dynamicModules,
    updateDynamicModules,
    cmsSections,
    updateCmsSections
  } = useProjectData();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isBrandCharterOpen, setIsBrandCharterOpen] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [selectedDeptForQuote, setSelectedDeptForQuote] = useState<number | null>(null);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isClientAuthModalOpen, setIsClientAuthModalOpen] = useState(false);
  const [isClientRegisterModalOpen, setIsClientRegisterModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  React.useEffect(() => {
    const checkSecretRoute = () => {
      if (window.location.hash === '#auth/admin-access' || window.location.pathname.includes('/auth/admin-access')) {
        setIsAdminLoginModalOpen(true);
      }
    };
    checkSecretRoute();
    window.addEventListener('hashchange', checkSecretRoute);
    return () => window.removeEventListener('hashchange', checkSecretRoute);
  }, []);

  const handleOpenQuote = (deptId?: number) => {
    if (deptId) setSelectedDeptForQuote(deptId);
    setIsQuoteModalOpen(true);
  };

  // Enterprise ERP Portal pour tout le personnel certifié.
  // Bascule ERP ⇄ back-office : simple choix d'affichage, la session Supabase
  // reste active. Sans elle, « Super Administration » déconnectait et le
  // back-office devenait inutilisable depuis un compte staff.
  const canOpenBackOffice = isStaffWorker && (isAdminGeneral || isSuperAdmin);
  const isErpPortal = isStaffWorker && !(canOpenBackOffice && staffPortal === 'cms');

  // Determine if admin navigation bar should be visible
  const showAdminPortal = isAdmin && !isSimulatingVisitor;
  const showClientPortal = currentUser.role === 'client' && !isSimulatingVisitor;

  // SEO réel : titre + meta description par onglet. Appelée avant tout return :
  // placée sous le branchement ERP, elle faisait varier le nombre de hooks d'un
  // rendu à l'autre et React détruisait l'arbre entier dès la connexion d'un
  // membre du personnel (écran noir, portail interne_injoignable).
  usePageMeta(isErpPortal ? 'erp' : (showAdminPortal || showClientPortal ? 'home' : currentTab));

  if (isErpPortal) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <OfflineBanner />
        <EnterpriseErpView />
      </div>
    );
  }

  const isLight = themeMode === 'light';

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 relative selection:bg-amber-400 selection:text-slate-950"
      style={{
        backgroundColor: activePalette.colors.bgMain,
        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
      }}
    >
      <OfflineBanner />
      {/* Floating Role Switcher Bar (Visible for Administrators & Operational Control) */}
      <RoleSwitcherBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* Main Navbar with Brand Charter & Theme Studio Integration */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQuoteModal={() => handleOpenQuote()}
        onOpenBrandCharter={() => setIsBrandCharterOpen(true)}
        onOpenThemeStudio={() => setIsThemeStudioOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onOpenClientAuth={() => setIsClientAuthModalOpen(true)}
        onOpenClientRegister={() => setIsClientRegisterModalOpen(true)}
        onOpenReservation={() => setIsReservationModalOpen(true)}
        onOpenWelcomeAbout={() => {
          setCurrentTab('welcome-about');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Admin Secondary Sub-Navbar if in Admin Portal */}
      {showAdminPortal && (
        <div
          className="border-b sticky top-16 z-30 shadow-xl transition-colors"
          style={{
            backgroundColor: activePalette.colors.bgSubtle,
            borderColor: activePalette.colors.border
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2.5 overflow-x-auto gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ color: activePalette.colors.accent }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activePalette.colors.accent }}></span>
                <span className="uppercase tracking-wider">Console Back-Office :</span>
              </div>

              {canOpenBackOffice && (
                <button
                  onClick={() => setStaffPortal('erp')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer shrink-0"
                  style={{
                    backgroundColor: activePalette.colors.primary,
                    borderColor: activePalette.colors.borderGlow,
                    color: '#FFFFFF'
                  }}
                  title="Revenir au portail interne (ERP) sans quitter la session"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Portail interne (ERP)</span>
                </button>
              )}

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'admin-dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
                  { id: 'admin-structure', label: 'Structure Org.', icon: Building2 },
                  { id: 'admin-users', label: 'Rôles & RBAC', icon: Users },
                  { id: 'admin-menus', label: 'Gestion Menus', icon: Layers },
                  { id: 'admin-modules', label: 'Modules ERP', icon: Boxes },
                  { id: 'admin-cms', label: 'CMS & Contenus', icon: Edit3 },
                  { id: 'admin-settings', label: 'Configuration Plateforme', icon: Settings },
                  { id: 'admin-visitors', label: 'Radar Visiteurs & Leads', icon: Activity },
                  { id: 'admin-projects', label: 'Projets & Sommets', icon: Compass },
                  { id: 'admin-quotes', label: 'Guichet Devis', icon: FileText },
                  { id: 'admin-equipment', label: 'Parc Matériel', icon: Truck },
                  { id: 'admin-partners', label: '7 Collèges Partenaires', icon: ShieldCheck },
                  { id: 'admin-architecture', label: 'Architecture & Schémas', icon: Code2 }
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id || (currentTab === 'home' && item.id === 'admin-dashboard');
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      style={{
                        backgroundColor: isActive ? activePalette.colors.primary : 'transparent',
                        color: isActive ? '#FFFFFF' : (isLight ? '#334155' : '#CBD5E1')
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setIsThemeStudioOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer"
                  style={{
                    backgroundColor: `${activePalette.colors.accent}20`,
                    borderColor: activePalette.colors.borderGlow,
                    color: isLight ? activePalette.colors.primaryDark : activePalette.colors.accent
                  }}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Couleurs de Marque</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dynamic View Content */}
      <main className="flex-grow">
        <VisualEditOverlayModal />
        {currentTab === 'super-admin' ? (
          /* ================= SUPER ADMINISTRATION ================= */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <RequireRole roles={['admin', 'admin_general']} fallbackTab={() => setCurrentTab('home')}>
              <SuperAdminHub onNavigateTab={setCurrentTab} />
            </RequireRole>
          </div>
        ) : showClientPortal ? (
          /* ================= ESPACE CLIENT ================= */
          <ClientPortal onOpenQuoteModal={() => handleOpenQuote()} />
        ) : showAdminPortal ? (
          /* ================= BACK-OFFICE / ADMIN VIEWS ================= */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            {(currentTab === 'admin-dashboard' || currentTab === 'home') && (
              <AdminDashboard
                setCurrentTab={setCurrentTab}
                onOpenNewProject={() => setCurrentTab('admin-projects')}
              />
            )}
            {currentTab === 'admin-structure' && (
              <OrganizationalStructureManager
                directions={directionsOrg}
                onUpdateDirections={updateDirectionsOrg}
              />
            )}
            {currentTab === 'admin-users' && <RolesAndUsersManager />}
            {currentTab === 'admin-menus' && (
              <MenuManager
                menus={dynamicMenus}
                onUpdateMenus={updateDynamicMenus}
              />
            )}
            {currentTab === 'admin-modules' && (
              <ModuleManager
                modules={dynamicModules}
                onUpdateModules={updateDynamicModules}
              />
            )}
            {currentTab === 'admin-cms' && (
              <CmsAdvancedEditor
                cmsSections={cmsSections}
                onUpdateCmsSections={updateCmsSections}
              />
            )}
            {currentTab === 'admin-settings' && <PlatformSettingsManager />}
            {currentTab === 'admin-visitors' && <VisitorRadarViewer />}
            {currentTab === 'admin-projects' && <ProjectManager />}
            {currentTab === 'admin-quotes' && <QuotesManager />}
            {currentTab === 'admin-equipment' && <EquipmentInventory />}
            {currentTab === 'admin-partners' && <PartnerEcosystem />}
            {currentTab === 'admin-architecture' && <TechArchitectureViewer />}
          </div>
        ) : (
          /* ================= FRONT-OFFICE / VISITOR VIEWS ================= */
          <div>
            {currentTab === 'home' && (
              <div className="space-y-12 pb-16">
                <HeroSection
                  onOpenQuoteModal={() => handleOpenQuote()}
                  onOpenReservation={() => setIsReservationModalOpen(true)}
                  onOpenClientRegister={() => setIsClientRegisterModalOpen(true)}
                  onExploreDepartments={() => {
                    setCurrentTab('departments');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenWelcomeAbout={() => {
                    const el = document.getElementById('welcome-about-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      setCurrentTab('welcome-about');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onExplorePartners={() => {
                    setCurrentTab('partners');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenBrandCharter={() => setIsBrandCharterOpen(true)}
                  onOpenThemeStudio={() => setIsThemeStudioOpen(true)}
                />

                {/* PRÉSENTATION OFFICIELLE DE LA STRUCTURE - VIVA EVENT SOLUTIONS */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <WelcomeAboutSection
                    onExplore15Poles={() => {
                      setCurrentTab('departments');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onOpenQuote={() => handleOpenQuote()}
                  />
                </div>

                {/* Quick Navigation Gateway Cards (Style SaaS Épuré & Haute Définition) */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                  <div>
                    <div className="text-center mb-10 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#4A6CF7] bg-blue-50 px-3.5 py-1.5 rounded-full inline-block">
                        Navigation Directe • Guichet Unique
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Accédez instantanément à nos départements et expertises
                      </h3>
                      <p className="text-sm text-[#6B7280] max-w-xl mx-auto">
                        Solutions clés en main pour vos rassemblements d'envergure en RDC et Afrique Centrale.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div
                        onClick={() => {
                          setCurrentTab('departments');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group"
                      >
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 bg-blue-50 text-[#4A6CF7] group-hover:scale-105 transition-transform">
                          <Layers className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#4A6CF7] transition-colors">
                          Nos 15 Pôles Spécialisés
                        </h4>
                        <p className="text-xs sm:text-sm text-[#6B7280] mb-5 leading-relaxed">
                          De la scénographie 3D aux groupes électrogènes et régies satellite, découvrez nos 15 expertises intégrées.
                        </p>
                        <span className="text-xs font-semibold flex items-center gap-1 text-[#4A6CF7] group-hover:translate-x-1 transition-transform">
                          Explorer les 15 pôles →
                        </span>
                      </div>

                      <div
                        onClick={() => {
                          setCurrentTab('equipment');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group"
                      >
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 bg-blue-50 text-[#4A6CF7] group-hover:scale-105 transition-transform">
                          <Truck className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#4A6CF7] transition-colors">
                          Parc Matériel Lourd (3 200 kVA)
                        </h4>
                        <p className="text-xs sm:text-sm text-[#6B7280] mb-5 leading-relaxed">
                          Inventaire certifié de nos équipements lourds en propre : Line Array, écrans LED 4K et énergie autonome.
                        </p>
                        <span className="text-xs font-semibold flex items-center gap-1 text-[#4A6CF7] group-hover:translate-x-1 transition-transform">
                          Consulter le parc lourd →
                        </span>
                      </div>

                      <div
                        onClick={() => {
                          setCurrentTab('quote-simulator');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group"
                      >
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 bg-blue-50 text-[#4A6CF7] group-hover:scale-105 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#4A6CF7] transition-colors">
                          Demande de Devis Officiel
                        </h4>
                        <p className="text-xs sm:text-sm text-[#6B7280] mb-5 leading-relaxed">
                          Soumettez votre cahier des charges et spécifiez vos exigences pour recevoir votre pro-forma sous 24h.
                        </p>
                        <span className="text-xs font-semibold flex items-center gap-1 text-[#4A6CF7] group-hover:translate-x-1 transition-transform">
                          Simuler un devis pro-forma →
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Services: Announcements, Ticketing, Online Voting (Clean White Style) */}
                  <div className="bg-slate-50/70 p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-200/70 pb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-pulse"></span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#4A6CF7]">
                            Guichet Interactif & Événements en Direct
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          Actualités, Billetterie & Participation
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setCurrentTab('announcements');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Megaphone className="w-4 h-4 text-[#4A6CF7]" />
                          <span>Annonces</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentTab('ticketing');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-5 py-2.5 rounded-full bg-[#4A6CF7] hover:bg-[#3B5CE6] text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Billetterie</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div
                        onClick={() => {
                          setCurrentTab('announcements');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-7 rounded-3xl border border-slate-100 hover:border-blue-100 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 shadow-sm group space-y-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#4A6CF7] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-[#4A6CF7] bg-blue-50 px-2 py-0.5 rounded-full">Officiel</span>
                            <span className="text-[11px] text-[#6B7280]">Mis à jour</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-[#4A6CF7] transition-colors">
                            Annonces & Notes Officielles
                          </h4>
                          <p className="text-xs text-[#6B7280] leading-relaxed">
                            Notes d'organisation, protocoles d'accès VIP et communiqués de la direction générale.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#4A6CF7]">
                          <span>Consulter le flux</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setCurrentTab('ticketing');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-7 rounded-3xl border border-slate-100 hover:border-blue-100 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 shadow-sm group space-y-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#4A6CF7] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Guichet</span>
                            <span className="text-[11px] text-emerald-600 font-semibold">Actif</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-[#4A6CF7] transition-colors">
                            Billetterie en Ligne
                          </h4>
                          <p className="text-xs text-[#6B7280] leading-relaxed">
                            Commandez vos pass d'accès (VIP, Standard, Gala) avec délivrance instantanée de QR Code sécurisé.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#4A6CF7]">
                          <span>Accéder au guichet</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setCurrentTab('voting');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-7 rounded-3xl border border-slate-100 hover:border-blue-100 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 shadow-sm group space-y-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-50 text-[#8B5CF6] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Vote className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-[#8B5CF6] bg-purple-50 px-2 py-0.5 rounded-full">Direct</span>
                            <span className="text-[11px] text-[#8B5CF6] font-semibold">Sondages</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-[#8B5CF6] transition-colors">
                            Vote & Sondages Stratégiques
                          </h4>
                          <p className="text-xs text-[#6B7280] leading-relaxed">
                            Donnez votre avis et participez aux consultations en direct lors des sommets et conférences.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#8B5CF6]">
                          <span>Participer au vote</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'welcome-about' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <WelcomeAboutSection
                  onExplore15Poles={() => {
                    setCurrentTab('departments');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenQuote={() => handleOpenQuote()}
                />
              </div>
            )}

            {currentTab === 'departments' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DepartmentsCatalog onSelectDepartmentForQuote={id => handleOpenQuote(id)} />
              </div>
            )}

            {currentTab === 'partners' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PartnerCollegesView />
              </div>
            )}

            {currentTab === 'equipment' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EquipmentShowcase onOpenQuoteWithEquipment={() => handleOpenQuote()} />
              </div>
            )}

            {currentTab === 'live-hub' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <VirtualEventHub />
              </div>
            )}

            {currentTab === 'announcements' && (
              <OfficialAnnouncementsModule />
            )}

            {currentTab === 'ticketing' && (
              <OnlineTicketingModule />
            )}

            {currentTab === 'voting' && (
              <VotingPollsModule />
            )}

            {currentTab === 'quote-simulator' && (
              <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                  <span className="text-xs font-bold font-mono uppercase" style={{ color: activePalette.colors.accent }}>
                    Guichet Unique Multiservices
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
                    Demande de Devis Officiel & Ingénierie Budgétaire
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Soumettez votre cahier des charges officiel et recevez votre devis détaillé en USD sous 24h ouvrées.
                  </p>
                </div>
                <InteractiveQuoteForm />
              </div>
            )}

            {/* 404 Error fallback: If non-admin attempts to access admin-* routes or unknown views */}
            {(currentTab.startsWith('admin-') ||
              !['home', 'welcome-about', 'departments', 'partners', 'equipment', 'live-hub', 'quote-simulator', 'announcements', 'ticketing', 'voting'].includes(currentTab)) && (
              <NotFound404 onGoHome={() => setCurrentTab('home')} />
            )}
          </div>
        )}
      </main>

      {/* Floating Quick Theme Studio Button (Locked for Admins only) */}
      {isAdmin && !isSimulatingVisitor && (
        <button
          onClick={() => setIsThemeStudioOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl shadow-2xl border flex items-center gap-2 font-bold text-xs cursor-pointer transition-all hover:scale-110 group"
          style={{
            backgroundColor: activePalette.colors.bgSurface,
            borderColor: activePalette.colors.borderGlow,
            color: isLight ? activePalette.colors.primaryDark : activePalette.colors.accent,
            boxShadow: `0 10px 30px ${activePalette.colors.borderGlow}`
          }}
          title="Ouvrir le Studio de Couleurs & Thèmes"
        >
          <Palette className="w-5 h-5 animate-bounce" />
          <span className="hidden md:inline font-black">Couleurs & Thème ({activePalette.name.split('&')[0]})</span>
        </button>
      )}

      {/* Quote Simulator Popup Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
          <div className="relative max-w-4xl w-full my-auto max-h-[94vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsQuoteModalOpen(false);
                setSelectedDeptForQuote(null);
              }}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <InteractiveQuoteForm
              initialDeptId={selectedDeptForQuote}
              onClose={() => {
                setIsQuoteModalOpen(false);
                setSelectedDeptForQuote(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Brand Charter & 3D Infographics Modal */}
      <BrandCharterModal
        isOpen={isBrandCharterOpen}
        onClose={() => setIsBrandCharterOpen(false)}
      />

      {/* Live Brand Theme Studio Modal */}
      <ThemeStudioModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
      />

      {/* Secure Enterprise Login Modal */}
      {isAdminLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <button
              onClick={() => setIsAdminLoginModalOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <EnterpriseLoginScreen
              onSuccess={() => setIsAdminLoginModalOpen(false)}
              onContinueAsVisitor={() => setIsAdminLoginModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Client Authentication (Login) Modal */}
      <ClientAuthModal
        isOpen={isClientAuthModalOpen}
        onClose={() => setIsClientAuthModalOpen(false)}
        onSuccess={() => setCurrentTab('home')}
      />

      {/* Client Dedicated Registration & Identification Modal (Fenêtre Création Compte Client) */}
      <ClientRegistrationModal
        isOpen={isClientRegisterModalOpen}
        onClose={() => setIsClientRegisterModalOpen(false)}
        onOpenReservation={() => {
          setIsClientRegisterModalOpen(false);
          setIsReservationModalOpen(true);
        }}
        onSuccess={() => setCurrentTab('home')}
      />

      {/* Advance Event Reservation Modal (Fenêtre Réservation Événementielle Avant le Jour J) */}
      <EventReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onSuccess={() => {
          // Keep open or let user close via confirmation
        }}
      />

      {/* Footer */}
      <Footer
        onSelectTab={tabId => {
          if (tabId === 'brand-charter') {
            setIsBrandCharterOpen(true);
          } else if (tabId === 'theme-studio') {
            setIsThemeStudioOpen(true);
          } else {
            setCurrentTab(tabId);
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EnterpriseErpProvider>
          <ProjectDataProvider>
            <MainAppContent />
          </ProjectDataProvider>
        </EnterpriseErpProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
