import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  Boxes,
  Edit3,
  Settings,
  Activity,
  Compass,
  FileText,
  Truck,
  ShieldCheck,
  Code2,
  Shield,
  ArrowRightLeft,
  Palette,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ADMIN_NAV_GROUPS: { title: string; items: AdminNavItem[] }[] = [
  {
    title: 'Pilotage',
    items: [
      { id: 'admin-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'admin-projects', label: 'Projets & sommets', icon: Compass },
      { id: 'admin-quotes', label: 'Guichet devis', icon: FileText },
      { id: 'admin-visitors', label: 'Radar visiteurs', icon: Activity }
    ]
  },
  {
    title: 'Organisation',
    items: [
      { id: 'admin-structure', label: 'Structure organisationnelle', icon: Building2 },
      { id: 'admin-users', label: 'Rôles & RBAC', icon: Users },
      { id: 'admin-partners', label: 'Collèges partenaires', icon: ShieldCheck },
      { id: 'admin-equipment', label: 'Parc matériel', icon: Truck }
    ]
  },
  {
    title: 'Plateforme',
    items: [
      { id: 'admin-menus', label: 'Menus & navigation', icon: Layers },
      { id: 'admin-modules', label: 'Modules ERP', icon: Boxes },
      { id: 'admin-cms', label: 'CMS & contenus', icon: Edit3 },
      { id: 'admin-settings', label: 'Configuration', icon: Settings },
      { id: 'admin-architecture', label: 'Architecture & schémas', icon: Code2 }
    ]
  }
];

interface AdminNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isSuperAdmin: boolean;
  canOpenBackOffice: boolean;
  onBackToErp: () => void;
  onOpenThemeStudio: () => void;
  onClose?: () => void;
}

const AdminNav: React.FC<AdminNavProps> = ({
  currentTab,
  setCurrentTab,
  isSuperAdmin,
  canOpenBackOffice,
  onBackToErp,
  onOpenThemeStudio,
  onClose
}) => {
  const go = (tab: string) => {
    setCurrentTab(tab);
    onClose?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // La maquette Viva Moderne utilise une barre latérale anthracite.
  const darkSidebar = useTheme().displayStyle === 'moderne';
  const mutedColor = darkSidebar ? 'rgba(255,255,255,0.62)' : 'var(--viva-text-muted)';
  const mainColor = darkSidebar ? '#FFFFFF' : 'var(--viva-text-main)';

  const isActive = (id: string) => currentTab === id || (currentTab === 'home' && id === 'admin-dashboard');

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--viva-accent)' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: mutedColor }}>
            Console Back-Office
          </span>
        </div>
        <p className="text-xs font-semibold" style={{ color: mainColor }}>
          VIVA Event Solutions
        </p>
      </div>

      {isSuperAdmin && (
        <div className="px-3 pb-3">
          <button
            onClick={() => go('super-admin')}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer"
            style={{
              background: 'var(--viva-accent-gradient)',
              color: '#FFFFFF',
              borderRadius: 'calc(var(--viva-radius-card) / 2)'
            }}
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Super administration</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <nav aria-label="Navigation back-office" className="flex-1 overflow-y-auto px-2 pb-3 space-y-5">
        {ADMIN_NAV_GROUPS.map(group => (
          <div key={group.title}>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: mutedColor }}>
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`viva-sidebar-link ${active ? 'viva-sidebar-link-active' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="px-2 py-3 border-t space-y-1.5"
        style={{ borderColor: darkSidebar ? 'rgba(255,255,255,0.12)' : 'var(--viva-border)' }}
      >
        {canOpenBackOffice && (
          <button onClick={onBackToErp} className="viva-sidebar-link">
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span>Portail interne (ERP)</span>
          </button>
        )}
        <button onClick={onOpenThemeStudio} className="viva-sidebar-link">
          <Palette className="w-4 h-4 shrink-0" />
          <span>Couleurs de marque</span>
        </button>
      </div>
    </div>
  );
};

interface AdminShellProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isSuperAdmin: boolean;
  canOpenBackOffice: boolean;
  onBackToErp: () => void;
  onOpenThemeStudio: () => void;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  currentTab,
  setCurrentTab,
  isSuperAdmin,
  canOpenBackOffice,
  onBackToErp,
  onOpenThemeStudio,
  children
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  const navProps = { currentTab, setCurrentTab, isSuperAdmin, canOpenBackOffice, onBackToErp, onOpenThemeStudio };

  return (
    <div className="flex-1 flex w-full max-w-[1700px] mx-auto">
      <aside
        className="hidden lg:flex w-64 shrink-0 viva-sidebar sticky top-[72px] self-start h-[calc(100vh-72px)]"
        aria-label="Barre latérale d'administration"
      >
        <AdminNav {...navProps} />
      </aside>

      <div className="flex-1 min-w-0">
        {/* Barre mobile avec tiroir */}
        <div
          className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--viva-border)', backgroundColor: 'var(--viva-bg-surface)' }}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--viva-text-muted)' }}>
              Console Back-Office
            </div>
            <div className="text-sm font-bold truncate" style={{ color: 'var(--viva-text-main)' }}>
              {ADMIN_NAV_GROUPS.flatMap(g => g.items).find(i => i.id === currentTab)?.label
                ?? (currentTab === 'super-admin' ? 'Super administration' : 'Tableau de bord')}
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="viva-btn-ghost px-3 py-2 text-xs shrink-0"
            style={{ color: 'var(--viva-text-main)' }}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-16">{children}</div>
      </div>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu back-office">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div
            className="relative w-72 max-w-[85vw] h-full viva-sidebar flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-end p-2 border-b" style={{ borderColor: 'var(--viva-border)' }}>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg"
                style={{ color: 'var(--viva-text-muted)' }}
                aria-label="Fermer le menu back-office"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminNav {...navProps} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
