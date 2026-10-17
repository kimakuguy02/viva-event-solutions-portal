import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Eye, LogOut, Check, Sparkles, LayoutDashboard } from 'lucide-react';

interface RoleSwitcherBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAdminLogin?: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ currentTab, setCurrentTab, onOpenAdminLogin }) => {
  const { currentUser, isAdmin, toggleVisitorMode, logout, toastMessage, dismissToast } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Un visiteur anonyme ne doit jamais voir la barre d'administration :
  // sans ce garde, le libellé « Session Admin Active » et l'accès au back-office
  // s'affichaient pour tout le monde, connecté ou non.
  if (!isAdmin) {
    return (
      <>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 animate-fadeIn">
            <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 border border-amber-300">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
              <button
                onClick={dismissToast}
                className="ml-2 text-slate-900 hover:text-white p-0.5 rounded cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-fadeIn">
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 border border-amber-300">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
            <button
              onClick={dismissToast}
              className="ml-2 text-slate-900 hover:text-white p-0.5 rounded cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Sleek Top Admin Bar (Only when Admin is authenticated) */}
      <div className="bg-slate-950 border-b border-amber-500/30 text-slate-200 text-xs py-1.5 px-4 sm:px-8 z-50 relative flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold text-[10px] tracking-wider uppercase">
            <Shield className="w-3 h-3" />
            <span>Session Admin Active</span>
          </div>

          <span className="text-slate-400 hidden sm:inline text-[11px]">
            {currentUser.name} <span className="text-slate-600">•</span> {currentUser.organization || 'Direction Générale'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Back-Office Dashboard quick link */}
          <button
            onClick={() => setCurrentTab('admin-dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab.startsWith('admin-')
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Console Back-Office</span>
          </button>

          {/* Toggle Public Front-Office Preview */}
          <button
            onClick={toggleVisitorMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Aperçu du site public tel que vu par les clients"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Aperçu Visiteur Public</span>
          </button>

          {/* Rôle courant (affichage seul — aucune élévation possible ici) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono cursor-pointer"
              title="Rôle courant (lecture seule)"
            >
              <Shield className="w-3 h-3 text-slate-400" />
              <span>{currentUser.role}</span>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Rôle vérifié par le serveur :
                </div>
                <div className="w-full text-left px-2 py-1.5 rounded-lg text-slate-200 flex items-center justify-between">
                  <span>🛡️ {currentUser.role}</span>
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="px-2 py-1 text-[10px] text-slate-500">
                  Les rôles sont attribués par l'administrateur. Aucun changement de rôle depuis cette barre.
                </p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={() => {
              logout();
              setCurrentTab('home');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
            title="Déconnexion de la session administrative"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};
