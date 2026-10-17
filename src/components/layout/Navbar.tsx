import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { VivaLogo } from '../common/VivaLogo';
import { GlobalSearch } from '../common/GlobalSearch';
import { NotificationCenter } from '../common/NotificationCenter';
import {
  Menu,
  X,
  Shield,
  Layers,
  FileText,
  Truck,
  Users,
  Radio,
  Calculator,
  Compass,
  PhoneCall,
  LayoutDashboard,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Edit3,
  HeartHandshake,
  LogIn,
  LogOut,
  UserPlus,
  UserCheck,
  Bell,
  ShoppingCart,
  Megaphone,
  Ticket,
  Vote,
  Calendar
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenQuoteModal: () => void;
  onOpenBrandCharter?: () => void;
  onOpenThemeStudio?: () => void;
  onOpenWelcomeAbout?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenClientAuth?: () => void;
  onOpenClientRegister?: () => void;
  onOpenReservation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQuoteModal,
  onOpenBrandCharter,
  onOpenThemeStudio,
  onOpenWelcomeAbout,
  onOpenAdminLogin,
  onOpenClientAuth,
  onOpenClientRegister,
  onOpenReservation
}) => {
const { isAdmin, isSuperAdmin, isSimulatingVisitor, toggleVisitorMode, currentUser, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const showMemberTools = currentUser.role !== 'visitor' && !isSimulatingVisitor;
  const { themeMode, toggleThemeMode, activePalette } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLight = themeMode === 'light';

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-colors duration-200"
    >
      {/* Top Banner Minimalist (Corporate Registry & Direct Phone) */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-1.5 text-[11px] sm:text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-[#4A6CF7] animate-pulse"></span>
            <span className="font-semibold text-slate-800">
              RÉPUBLIQUE DÉMOCRATIQUE DU CONGO & AFRIQUE CENTRALE
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-[#6B7280]">Guichet Unique Ingénierie Événementielle Globale</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="hidden sm:inline font-mono text-[10px] text-slate-400">RCCM: CD/KIN/RCCM/24-B-01492</span>
            <a
              href="tel:+243963216780"
              className="font-semibold flex items-center gap-1.5 text-[#4A6CF7] hover:underline"
            >
              <PhoneCall className="w-3 h-3" />
              <span>+243 963 216 780</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Brand Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18 gap-2">
          {/* Logo gauche */}
          <div
            onClick={() => handleNavClick(isAdmin ? 'admin-dashboard' : 'home')}
            className="cursor-pointer group flex items-center shrink-0"
          >
            {/* Sizing adaptatif : sm sur mobile, md sur écran moyen/grand */}
            <div className="block sm:hidden">
              <VivaLogo size="sm" variant="horizontal" />
            </div>
            <div className="hidden sm:block">
              <VivaLogo size="md" variant="horizontal" />
            </div>
          </div>

          {/* Desktop Navigation Links (Centered, Horizontal on Desktop) */}
          <nav
            aria-label="Menu principal desktop"
            className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold"
          >
            {!isAdmin ? (
              <>
                <button
                  id="nav-link-accueil"
                  onClick={() => handleNavClick('home')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'home'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Accueil & Vision</span>
                </button>

                <button
                  id="nav-link-poles"
                  onClick={() => handleNavClick('departments')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'departments'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Nos 15 Pôles</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    currentTab === 'departments' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#4A6CF7]'
                  }`}>15</span>
                </button>

                <button
                  id="nav-link-materiel"
                  onClick={() => handleNavClick('equipment')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'equipment'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Parc Matériel</span>
                </button>

                <button
                  id="nav-link-partenaires"
                  onClick={() => handleNavClick('partners')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'partners'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Partenaires</span>
                </button>

                <button
                  id="nav-link-presentation"
                  onClick={() => {
                    if (currentTab === 'home') {
                      const el = document.getElementById('welcome-about-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                        return;
                      }
                    }
                    handleNavClick('welcome-about');
                  }}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'welcome-about'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#4A6CF7]" />
                  <span>Présentation Officielle</span>
                </button>

                <button
                  id="nav-link-hub-live"
                  onClick={() => handleNavClick('live-hub')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'live-hub'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>Hub Live</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                </button>

                <button
                  id="nav-link-announcements"
                  onClick={() => handleNavClick('announcements')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'announcements'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Annonces</span>
                </button>

                <button
                  id="nav-link-ticketing"
                  onClick={() => handleNavClick('ticketing')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'ticketing'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Billetterie</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-700">En Ligne</span>
                </button>

                <button
                  id="nav-link-voting"
                  onClick={() => handleNavClick('voting')}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'voting'
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50'
                  }`}
                >
                  <Vote className="w-3.5 h-3.5 text-purple-500" />
                  <span>Vote & Sondages</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'admin-dashboard'
                      ? 'bg-[#4A6CF7] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Console Back-Office</span>
                </button>

                {isSuperAdmin && (
                  <button
                    id="nav-link-super-admin"
                    onClick={() => handleNavClick('super-admin')}
                    className={`px-3.5 py-1.5 rounded-full font-black text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      currentTab === 'super-admin'
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-amber-500/15 text-amber-900 border border-amber-500/40 hover:bg-amber-500/25'
                    }`}
                  >
                    <span>⚙️</span>
                    <span>SUPER ADMINISTRATION</span>
                  </button>
                )}
              </div>
            )}
          </nav>

          {/* Desktop Right Action Controls (Devis, Client, Réserver) */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {showMemberTools && (
              <>
                <GlobalSearch />
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(v => !v)}
                    title="Notifications"
                    className="p-2 rounded-full text-slate-500 hover:text-[#4A6CF7] hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[22rem] max-h-[26rem] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50">
                      <NotificationCenter compact />
                    </div>
                  )}
                </div>
              </>
            )}
            {showMemberTools && (
              <>
                <GlobalSearch />
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(v => !v)}
                    title="Notifications"
                    className="p-2 rounded-full text-slate-500 hover:text-[#4A6CF7] hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[22rem] max-h-[26rem] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50">
                      <NotificationCenter compact />
                    </div>
                  )}
                </div>
              </>
            )}
            {!isAdmin ? (
              <>
                {currentUser.role === 'client' && !isSimulatingVisitor ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNavClick('home')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#4A6CF7]" />
                      <span className="truncate max-w-[120px]">{currentUser.name}</span>
                    </button>

                    <button
                      onClick={onOpenReservation}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#4A6CF7] hover:bg-[#3A5BD9] shadow-sm hover:shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Réserver un Événement</span>
                    </button>

                    <button
                      onClick={() => logout()}
                      className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Déconnexion"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 xl:gap-2">
                    {/* Bouton Simulateur Devis */}
                    <button
                      id="btn-nav-devis-desktop"
                      onClick={onOpenQuoteModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-[#4A6CF7] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5 text-[#4A6CF7]" />
                      <span>Simulateur Devis</span>
                    </button>

                    {/* Connexion / Compte Client */}
                    <button
                      id="btn-nav-connexion-login"
                      onClick={onOpenClientAuth}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-[#4A6CF7] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Connexion</span>
                    </button>

                    {/* Bouton Bleu: Réserver un Événement */}
                    <button
                      id="btn-nav-reserver"
                      onClick={onOpenReservation}
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm text-white bg-[#4A6CF7] hover:bg-[#3A5BD9] shadow-sm hover:shadow-md hover:shadow-blue-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5 whitespace-nowrap"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Réserver un Événement</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                <span className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-pulse"></span>
                <span className="text-xs font-bold text-[#4A6CF7]">Console Admin</span>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Compact CTA + Hamburger Menu Button */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-nav-mobile-reserver"
              onClick={onOpenReservation}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-xs text-white bg-[#4A6CF7] hover:bg-[#3A5BD9] shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Réserver</span>
            </button>

            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Ouvrir le menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Mobile Horizontal Scrollable Pills Strip (Quick thumb navigation on mobile) */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/80 border-b border-slate-200/60">
        <nav
          aria-label="Menu mobile rapide"
          className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5 px-3 text-xs"
        >
          <button
            onClick={() => handleNavClick('home')}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              currentTab === 'home'
                ? 'bg-[#4A6CF7] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#4A6CF7] bg-white border border-slate-200'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Accueil</span>
          </button>

          <button
            onClick={() => handleNavClick('departments')}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              currentTab === 'departments'
                ? 'bg-[#4A6CF7] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#4A6CF7] bg-white border border-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>15 Pôles</span>
            <span className={`text-[9px] px-1 py-0.1 rounded-full font-bold ${
              currentTab === 'departments' ? 'bg-white/25 text-white' : 'bg-blue-100 text-[#4A6CF7]'
            }`}>15</span>
          </button>

          <button
            onClick={() => handleNavClick('equipment')}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              currentTab === 'equipment'
                ? 'bg-[#4A6CF7] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#4A6CF7] bg-white border border-slate-200'
            }`}
          >
            <Truck className="w-3 h-3 text-blue-500" />
            <span>Matériel</span>
          </button>

          <button
            onClick={() => handleNavClick('partners')}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              currentTab === 'partners'
                ? 'bg-[#4A6CF7] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#4A6CF7] bg-white border border-slate-200'
            }`}
          >
            <Users className="w-3 h-3 text-indigo-500" />
            <span>Partenaires</span>
          </button>

          <button
            onClick={() => {
              if (currentTab === 'home') {
                const el = document.getElementById('welcome-about-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  return;
                }
              }
              handleNavClick('welcome-about');
            }}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              currentTab === 'welcome-about'
                ? 'bg-[#4A6CF7] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#4A6CF7] bg-white border border-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#4A6CF7]" />
            <span>Présentation Officielle</span>
          </button>

          <button
            onClick={() => handleNavClick('live-hub')}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              currentTab === 'live-hub'
                ? 'bg-[#4A6CF7] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#4A6CF7] bg-white border border-slate-200'
            }`}
          >
            <Radio className="w-3 h-3 text-rose-500" />
            <span>Hub Live</span>
          </button>

          <button
            onClick={onOpenQuoteModal}
            className="px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 bg-blue-50 text-[#4A6CF7] border border-blue-200 cursor-pointer"
          >
            <Calculator className="w-3 h-3" />
            <span>Devis</span>
          </button>
        </nav>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          {/* Mobile Client & Visitor Authentication Banner */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#4A6CF7]" />
                  <span>Espace Client & Réservations</span>
                </span>
              </div>

              {currentUser.role !== 'client' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenReservation?.();
                    }}
                    className="w-full py-2.5 px-4 rounded-full bg-[#4A6CF7] hover:bg-[#3A5BD9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Réserver un Événement</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenClientAuth?.();
                      }}
                      className="py-2 px-3 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#4A6CF7]" />
                      <span>Connexion</span>
                    </button>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenClientRegister?.();
                      }}
                      className="py-2 px-3 rounded-full bg-white hover:bg-slate-100 text-[#4A6CF7] font-semibold text-xs border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Créer Compte</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold truncate max-w-[200px]">👤 {currentUser.name}</span>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleNavClick('home');
                    }}
                    className="w-full py-2 px-3 rounded-full bg-blue-50 text-[#4A6CF7] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Mon Espace Client</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => handleNavClick('home')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7]"
          >
            Accueil & Vision
          </button>
          <button
            onClick={() => handleNavClick('departments')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#4A6CF7]" />
            <span>Nos 15 Pôles d'Ingénierie</span>
          </button>
          <button
            onClick={() => handleNavClick('equipment')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <Truck className="w-4 h-4 text-blue-500" />
            <span>Parc Matériel Lourd</span>
          </button>
          <button
            onClick={() => handleNavClick('partners')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Partenaires</span>
          </button>
          <button
            onClick={() => handleNavClick('welcome-about')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <HeartHandshake className="w-4 h-4 text-[#8B5CF6]" />
            <span>À Propos & Sûreté</span>
          </button>
          <button
            onClick={() => handleNavClick('live-hub')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <Radio className="w-4 h-4 text-rose-500" />
            <span>Hub Live</span>
          </button>

          <button
            onClick={() => handleNavClick('announcements')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>Annonces & Notes Officielles</span>
          </button>
          <button
            onClick={() => handleNavClick('ticketing')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <Ticket className="w-4 h-4 text-emerald-500" />
            <span>Billetterie en Ligne</span>
          </button>
          <button
            onClick={() => handleNavClick('voting')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#4A6CF7] flex items-center gap-2"
          >
            <Vote className="w-4 h-4 text-purple-500" />
            <span>Vote & Sondages Stratégiques</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAdminLogin?.();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Accès Console d'Administration</span>
          </button>
        </div>
      )}
    </header>
  );
};
