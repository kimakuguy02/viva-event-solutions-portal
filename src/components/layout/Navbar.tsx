import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VivaLogo } from '../common/VivaLogo';
import { GlobalSearch } from '../common/GlobalSearch';
import { NotificationCenter } from '../common/NotificationCenter';
import { StyleSwitcher } from '../common/StyleSwitcher';
import {
  Menu,
  X,
  Shield,
  Layers,
  Calculator,
  Compass,
  LayoutDashboard,
  Sun,
  Moon,
  Sparkles,
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
  Calendar,
  Search,
  ChevronDown,
  Radio,
  Truck,
  Users,
  PartyPopper,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  onSearch?: (query: string) => void;
}

const PRIMARY_LINKS = [
  { id: 'home', label: 'Accueil', icon: Compass },
  { id: 'events', label: 'Événements', icon: PartyPopper },
  { id: 'departments', label: '15 Pôles', icon: Layers },
  { id: 'partners', label: 'Partenaires', icon: Users },
  { id: 'equipment', label: 'Parc Matériel', icon: Truck },
  { id: 'live-hub', label: 'Hub Live', icon: Radio }
];

const SECONDARY_LINKS = [
  { id: 'welcome-about', label: 'Présentation Officielle', icon: Sparkles },
  { id: 'announcements', label: 'Annonces', icon: Megaphone },
  { id: 'ticketing', label: 'Billetterie', icon: Ticket },
  { id: 'voting', label: 'Vote & Sondages', icon: Vote }
];

const CATEGORY_CHIPS = [
  { id: 'events', label: 'Tous les événements', icon: PartyPopper },
  { id: 'departments', label: 'Sommets & Conférences', icon: Layers },
  { id: 'equipment', label: 'Production technique', icon: Truck },
  { id: 'partners', label: 'Réceptions & Galas', icon: Users },
  { id: 'live-hub', label: 'Diffusion live', icon: Radio },
  { id: 'quote-simulator', label: 'Devis sur mesure', icon: Calculator }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQuoteModal,
  onOpenBrandCharter,
  onOpenAdminLogin,
  onOpenClientAuth,
  onOpenClientRegister,
  onOpenReservation,
  onSearch
}) => {
  const { isAdmin, isSuperAdmin, isSimulatingVisitor, currentUser, logout } = useAuth();
  const showMemberTools = currentUser.role !== 'visitor' && !isSimulatingVisitor;
  const { themeMode, toggleThemeMode, activePalette } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (onSearch) onSearch(query);
    else handleNavClick('events');
    setMobileMenuOpen(false);
  };

  const isActive = (tab: string) => currentTab === tab || (tab === 'home' && currentTab === 'home');
  const searchField = (compact: boolean) => (
    <form onSubmit={handleSearchSubmit} className={`relative ${compact ? 'w-full' : 'w-44 xl:w-56'}`} role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--viva-text-muted)' }} />
      <input
        type="search"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Rechercher un événement…"
        aria-label="Rechercher un événement, un pôle ou un service"
        className="viva-input pl-9 pr-3 py-1.5 text-xs"
      />
    </form>
  );

  return (
    <header className="sticky top-0 z-40 viva-nav">
      {/* Barre principale */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-3">
          <button
            onClick={() => handleNavClick(isAdmin ? 'admin-dashboard' : 'home')}
            className="cursor-pointer flex items-center shrink-0"
            aria-label="Retour à l'accueil VIVA Event Solutions"
          >
            <span className="sm:hidden"><VivaLogo size="sm" variant="horizontal" /></span>
            <span className="hidden sm:block"><VivaLogo size="md" variant="horizontal" /></span>
          </button>

          {/* Navigation desktop */}
          <nav aria-label="Menu principal" className="hidden lg:flex items-center gap-0.5 text-xs font-semibold">
            {!isAdmin ? (
              <>
                {PRIMARY_LINKS.map(link => {
                  const active = isActive(link.id);
                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavClick(link.id)}
                      aria-current={active ? 'page' : undefined}
                      className="px-3.5 py-2 rounded-full transition-colors whitespace-nowrap cursor-pointer text-[13px]"
                      style={{
                        backgroundColor: active ? 'var(--viva-primary)' : 'transparent',
                        color: active ? 'var(--viva-on-primary)' : 'var(--viva-text-main)',
                        fontWeight: active ? 700 : 600
                      }}
                    >
                      <span>{link.label}</span>
                    </button>
                  );
                })}

                <div className="relative">
                  <button
                    onClick={() => setMoreOpen(v => !v)}
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    className="px-3 py-1.5 rounded-full transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer hover:bg-[var(--viva-muted-surface)]"
                    style={{
                      color: SECONDARY_LINKS.some(l => l.id === currentTab) ? 'var(--viva-primary)' : 'var(--viva-text-main)'
                    }}
                  >
                    <span>Plus</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full mt-2 w-60 rounded-2xl border p-2 z-50"
                      style={{
                        backgroundColor: 'var(--viva-bg-surface)',
                        borderColor: 'var(--viva-border)',
                        boxShadow: 'var(--viva-card-shadow)'
                      }}
                    >
                      {SECONDARY_LINKS.map(link => {
                        const Icon = link.icon;
                        return (
                          <button
                            key={link.id}
                            role="menuitem"
                            onClick={() => handleNavClick(link.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--viva-muted-surface)] cursor-pointer"
                            style={{ color: 'var(--viva-text-main)' }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: 'var(--viva-primary)' }} />
                            <span>{link.label}</span>
                          </button>
                        );
                      })}
                      <div className="my-1 border-t" style={{ borderColor: 'var(--viva-border)' }} />
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          onOpenQuoteModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--viva-muted-surface)] cursor-pointer"
                        style={{ color: 'var(--viva-text-main)' }}
                      >
                        <Calculator className="w-3.5 h-3.5" style={{ color: 'var(--viva-accent)' }} />
                        <span>Devis</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="px-3.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: currentTab.startsWith('admin') ? 'var(--viva-primary)' : 'transparent',
                    color: currentTab.startsWith('admin') ? 'var(--viva-on-primary)' : 'var(--viva-text-main)'
                  }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Console Back-Office</span>
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleNavClick('super-admin')}
                    className="px-3.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                    style={{
                      background: 'var(--viva-accent-gradient)',
                      color: '#FFFFFF'
                    }}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Super Administration</span>
                  </button>
                )}
              </div>
            )}
          </nav>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {!isAdmin && searchField(false)}

            {showMemberTools && (
              <>
                <GlobalSearch />
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(v => !v)}
                    title="Notifications"
                    aria-label="Notifications"
                    className="p-2 rounded-full transition-colors hover:bg-[var(--viva-muted-surface)] cursor-pointer"
                    style={{ color: 'var(--viva-text-muted)' }}
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  {notifOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-[22rem] max-h-[26rem] overflow-y-auto rounded-2xl border p-4 z-50"
                      style={{
                        backgroundColor: 'var(--viva-bg-surface)',
                        borderColor: 'var(--viva-border)',
                        boxShadow: 'var(--viva-card-shadow)'
                      }}
                    >
                      <NotificationCenter compact />
                    </div>
                  )}
                </div>
              </>
            )}

            <StyleSwitcher />

            <button
              onClick={toggleThemeMode}
              title={themeMode === 'dark' ? 'Passer en style clair' : 'Passer en style sombre'}
              aria-label={themeMode === 'dark' ? 'Activer le style clair' : 'Activer le style sombre'}
              className="p-2 rounded-full border transition-colors hover:bg-[var(--viva-muted-surface)] cursor-pointer"
              style={{ borderColor: 'var(--viva-border)', color: 'var(--viva-text-muted)' }}
            >
              {themeMode === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {!isAdmin ? (
              currentUser.role === 'client' && !isSimulatingVisitor ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--viva-muted-surface)', color: 'var(--viva-text-main)' }}>
                    <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--viva-primary)' }} />
                    <span className="truncate max-w-[110px]">{currentUser.name}</span>
                  </span>
                  <button onClick={onOpenReservation} className="viva-btn-accent px-4 py-2 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Réserver</span>
                  </button>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 rounded-full transition-colors hover:bg-[var(--viva-muted-surface)] cursor-pointer"
                    style={{ color: 'var(--viva-text-muted)' }}
                    title="Déconnexion"
                    aria-label="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-nav-connexion-login"
                    onClick={onOpenClientAuth}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-[var(--viva-muted-surface)] cursor-pointer"
                    style={{ color: 'var(--viva-text-main)' }}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Connexion</span>
                  </button>
                  <button
                    id="btn-nav-reserver"
                    onClick={onOpenReservation}
                    className="viva-btn-accent px-4 py-2 text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Réserver un événement</span>
                  </button>
                </div>
              )
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--viva-muted-surface)', color: 'var(--viva-primary)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--viva-primary)' }} />
                Console active
              </span>
            )}
          </div>

          {/* Actions mobile */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenReservation}
              className="viva-btn-accent px-3 py-1.5 text-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Réserver</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl transition-colors hover:bg-[var(--viva-muted-surface)] cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
              aria-expanded={mobileMenuOpen}
              style={{ color: 'var(--viva-text-main)' }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Catégories : navigation secondaire visible sur tous les écrans */}
      {!isAdmin && (
        <div className="border-t border-b" style={{ borderColor: 'var(--viva-border)' }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <nav aria-label="Catégories d'événements" className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1" style={{ color: 'var(--viva-text-muted)' }}>
                Explorer
              </span>
              {CATEGORY_CHIPS.map(chip => {
                const Icon = chip.icon;
                const active = currentTab === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => handleNavClick(chip.id)}
                    className="viva-chip whitespace-nowrap shrink-0 cursor-pointer"
                    style={active ? {
                      backgroundColor: 'var(--viva-primary)',
                      borderColor: 'var(--viva-primary)',
                      color: 'var(--viva-on-primary)'
                    } : undefined}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t px-4 pt-3 pb-6 space-y-3 shadow-xl max-h-[75vh] overflow-y-auto"
          style={{ backgroundColor: 'var(--viva-bg-surface)', borderColor: 'var(--viva-border)' }}
        >
          {!isAdmin && searchField(true)}

          {!isAdmin && (
            <div className="p-3 rounded-2xl border space-y-2" style={{ backgroundColor: 'var(--viva-muted-surface)', borderColor: 'var(--viva-border)' }}>
              {currentUser.role !== 'client' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenClientAuth?.(); }}
                    className="viva-btn-ghost py-2 px-3 text-xs"
                    style={{ color: 'var(--viva-text-main)' }}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Connexion</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenClientRegister?.(); }}
                    className="viva-btn-ghost py-2 px-3 text-xs"
                    style={{ color: 'var(--viva-text-main)' }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Créer un compte</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold truncate max-w-[190px]" style={{ color: 'var(--viva-text-main)' }}>{currentUser.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleNavClick('home'); }}
                      className="flex items-center gap-1 font-semibold"
                      style={{ color: 'var(--viva-primary)' }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Espace client</span>
                    </button>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-1 font-semibold text-rose-500"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sortir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-0.5">
            {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map(link => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 hover:bg-[var(--viva-muted-surface)]"
                  style={{ color: currentTab === link.id ? 'var(--viva-primary)' : 'var(--viva-text-main)' }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenQuoteModal(); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 hover:bg-[var(--viva-muted-surface)]"
              style={{ color: 'var(--viva-text-main)' }}
            >
              <Calculator className="w-4 h-4" style={{ color: 'var(--viva-accent)' }} />
              <span>Devis</span>
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAdminLogin?.(); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5"
              style={{ color: 'var(--viva-text-muted)' }}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Accès Console d'Administration</span>
            </button>
          </div>

          <StyleSwitcher variant="inline" className="border-t pt-3" />

          <button
            onClick={() => { setMobileMenuOpen(false); onOpenBrandCharter?.(); }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ color: 'var(--viva-text-muted)' }}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Charte graphique & écosystème</span>
          </button>
        </div>
      )}
    </header>
  );
};
