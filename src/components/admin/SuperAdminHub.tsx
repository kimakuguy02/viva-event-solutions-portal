import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { useTheme } from '../../context/ThemeContext';
import { GlobalSiteEditor } from './GlobalSiteEditor';
import { MenuManager } from './MenuManager';
import { ModuleManager } from './ModuleManager';
import { DynamicFormsManager } from './DynamicFormsManager';
import { MediaManager } from './MediaManager';
import { OrganizationalStructureManager } from './OrganizationalStructureManager';
import { RolesAndUsersManager } from './RolesAndUsersManager';
import { RolesPermissionsManager } from './RolesPermissionsManager';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { WorkflowBuilder } from './WorkflowBuilder';
import { AuditCenter } from './AuditCenter';
import { SecurityCenter } from './SecurityCenter';
import { GeminiCopilot } from './GeminiCopilot';
import { MenuTreeBuilder } from './MenuTreeBuilder';
import { ModuleCatalog } from './ModuleCatalog';
import { ModuleMenuPermissionMatrix, RoleOrgModuleMatrix } from './PlatformMatrices';
import { PlatformPreview } from './PlatformPreview';
import { FeatureFlagManager } from './FeatureFlagManager';
import { PlatformSettingsManager } from './PlatformSettingsManager';
import { CmsAdvancedEditor } from './CmsAdvancedEditor';
import { TechArchitectureViewer } from './TechArchitectureViewer';
import {
  ShieldAlert,
  LayoutDashboard,
  Edit3,
  FileText,
  Layers,
  Boxes,
  ClipboardList,
  Image,
  Camera,
  Youtube,
  Building2,
  Users,
  KeyRound,
  Settings,
  Palette,
  ToggleLeft,
  Sparkles,
  History,
  Lock,
  Database,
  ArrowRight,
  Activity,
  Network,
} from 'lucide-react';

interface SuperAdminHubProps {
  initialSubTab?: string;
  onNavigateTab?: (tab: string) => void;
}

type SubTab =
  | 'overview'
  | 'site-editor'
  | 'pages-contents'
  | 'menus-nav'
  | 'modules'
  | 'forms'
  | 'workflows'
  | 'media'
  | 'photos'
  | 'videos-yt'
  | 'organigramme'
  | 'users'
  | 'roles-perms'
  | 'config'
  | 'branding'
  | 'features'
  | 'gemini-ai'
  | 'audit-history'
  | 'security'
  | 'platform'
  | 'firebase-state';

export const SuperAdminHub: React.FC<SuperAdminHubProps> = ({
  initialSubTab = 'overview',
  onNavigateTab,
}) => {
  const { currentUser, isSuperAdmin } = useAuth();
  const {
    dynamicMenus,
    updateDynamicMenus,
    dynamicModules,
    updateDynamicModules,
    directionsOrg,
    updateDirectionsOrg,
    cmsSections,
    updateCmsSections,
    isVisualEditMode,
    setVisualEditMode,
  } = useProjectData();
  const { themeMode, activePalette } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    (initialSubTab as SubTab) || 'overview'
  );

  const subMenus = useMemo(
    () => [
      { id: 'overview' as SubTab, number: '01', label: "Vue d'ensemble", icon: LayoutDashboard },
      { id: 'site-editor' as SubTab, number: '02', label: 'Éditeur global du site', icon: Edit3, highlight: true },
      { id: 'pages-contents' as SubTab, number: '03', label: 'Pages & contenus', icon: FileText },
      { id: 'menus-nav' as SubTab, number: '04', label: 'Menus & navigation', icon: Layers },
      { id: 'modules' as SubTab, number: '05', label: 'Modules', icon: Boxes },
      { id: 'forms' as SubTab, number: '06', label: 'Formulaires', icon: ClipboardList },
      { id: 'workflows' as SubTab, number: '07', label: 'Workflows', icon: Activity },
      { id: 'media' as SubTab, number: '08', label: 'Médias', icon: Image },
      { id: 'photos' as SubTab, number: '09', label: 'Photos & réalisations', icon: Camera },
      { id: 'videos-yt' as SubTab, number: '10', label: 'Vidéos & YouTube', icon: Youtube },
      { id: 'organigramme' as SubTab, number: '11', label: 'Organigramme', icon: Building2 },
      { id: 'users' as SubTab, number: '12', label: 'Utilisateurs', icon: Users },
      { id: 'roles-perms' as SubTab, number: '13', label: 'Rôles & permissions', icon: KeyRound },
      { id: 'config' as SubTab, number: '14', label: 'Configuration', icon: Settings },
      { id: 'branding' as SubTab, number: '15', label: 'Apparence & branding', icon: Palette },
      { id: 'features' as SubTab, number: '16', label: 'Fonctionnalités', icon: ToggleLeft },
      { id: 'gemini-ai' as SubTab, number: '17', label: 'Assistant Gemini', icon: Sparkles },
      { id: 'audit-history' as SubTab, number: '18', label: 'Historique & audit', icon: History },
      { id: 'security' as SubTab, number: '19', label: 'Sécurité', icon: Lock },
      { id: 'platform' as SubTab, number: '20', label: 'Labo plateforme', icon: Network },
      { id: 'firebase-state' as SubTab, number: '21', label: 'Firebase / état du système', icon: Database },
    ],
    []
  );

  const navigate = (tab: SubTab) => setActiveSubTab(tab);

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-rose-500/40 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">Accès réservé au SUPER_ADMIN</h3>
          <p className="text-xs text-slate-300">
            Cette console est strictement réservée au Super Administrateur.
          </p>
          <button
            onClick={() => onNavigateTab?.('home')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
          >
            Retourner au portail
          </button>
        </div>
      </div>
    );
  }

  const systemCounts = [
    { label: 'CMS', value: cmsSections.length },
    { label: 'Menus', value: dynamicMenus.length },
    { label: 'Modules', value: dynamicModules.length },
    { label: 'Directions', value: directionsOrg.length },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/60 p-6 sm:p-8 border-2 border-amber-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Habilitation SUPER_ADMIN
            </span>
            <span className="text-xs text-amber-400 font-mono font-bold">
              {currentUser?.email || 'Compte administrateur'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ⚙️ SUPER ADMINISTRATION
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Console centrale de gouvernance de VIVA EVENT SOLUTIONS. Gérez le contenu,
            les menus, modules, formulaires, médias, organisation, utilisateurs et sécurité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setVisualEditMode(!isVisualEditMode)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg border ${
              isVisualEditMode
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/30'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            {isVisualEditMode ? 'Mode visuel actif' : 'Modifier le site'}
          </button>

          <button
            onClick={() => navigate('site-editor')}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg"
          >
            <Edit3 className="w-4 h-4" />
            Éditeur global
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-1.5 shadow-xl sticky top-24 max-h-[85vh] overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 mb-2 flex items-center justify-between">
            <span>20 Sous-menus</span>
            <span className="text-amber-400">Super Admin</span>
          </div>

          {subMenus.map((menu) => {
            const Icon = menu.icon;
            const isActive = activeSubTab === menu.id;

            return (
              <button
                key={menu.id}
                onClick={() => navigate(menu.id)}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group text-left ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : menu.highlight
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-[10px] font-mono ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {menu.number}
                  </span>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span className="truncate">{menu.label}</span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
              </button>
            );
          })}
        </aside>

        <main className="lg:col-span-9 space-y-6">
          {activeSubTab === 'overview' && <SuperAdminDashboard onNavigate={navigate} />}

          {activeSubTab === 'site-editor' && <GlobalSiteEditor />}

          {activeSubTab === 'pages-contents' && (
            <CmsAdvancedEditor cmsSections={cmsSections} onUpdateCmsSections={updateCmsSections} />
          )}

          {activeSubTab === 'menus-nav' && (
            <div className="space-y-4">
              <MenuManager menus={dynamicMenus} onUpdateMenus={updateDynamicMenus} />
              <MenuTreeBuilder menus={dynamicMenus} onUpdateMenus={updateDynamicMenus} />
            </div>
          )}

          {activeSubTab === 'modules' && (
            <ModuleCatalog menus={dynamicMenus} modules={dynamicModules} onUpdateModules={updateDynamicModules} />
          )}

          {activeSubTab === 'forms' && <DynamicFormsManager />}

          {activeSubTab === 'workflows' && <WorkflowBuilder />}

          {activeSubTab === 'media' && <MediaManager />}
          {activeSubTab === 'photos' && <MediaManager />}
          {activeSubTab === 'videos-yt' && <MediaManager />}

          {activeSubTab === 'organigramme' && (
            <OrganizationalStructureManager
              directions={directionsOrg}
              onUpdateDirections={updateDirectionsOrg}
            />
          )}

          {(activeSubTab === 'users') && <RolesAndUsersManager />}

          {activeSubTab === 'roles-perms' && <RolesPermissionsManager />}

          {(activeSubTab === 'config' || activeSubTab === 'branding') && <PlatformSettingsManager />}

          {activeSubTab === 'features' && <FeatureFlagManager />}

          {activeSubTab === 'platform' && (
            <div className="space-y-4">
              <PlatformPreview menus={dynamicMenus} modules={dynamicModules} />
              <ModuleMenuPermissionMatrix menus={dynamicMenus} modules={dynamicModules} />
              <RoleOrgModuleMatrix />
            </div>
          )}

          {activeSubTab === 'gemini-ai' && <GeminiCopilot />}

          {activeSubTab === 'audit-history' && <AuditCenter />}

          {activeSubTab === 'security' && <SecurityCenter />}

          {activeSubTab === 'firebase-state' && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-black text-white">Firebase / état du système</h3>
                    <p className="text-xs text-slate-400">
                      Les indicateurs ci-dessous reflètent uniquement les données disponibles
                      dans le contexte React. Aucun état réseau n'est inventé.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {systemCounts.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="text-xl font-black text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <TechArchitectureViewer />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
