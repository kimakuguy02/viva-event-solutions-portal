import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/* Garde d'UX (RULE-006/007 : la sécurité réelle est RLS/serveur).
   Masque une zone aux rôles non autorisés ; ne confère aucun droit. */

interface RequireRoleProps {
  roles: string[];
  permissions?: string[];
  fallbackTab?: () => void;
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ roles, permissions = [], fallbackTab, children }) => {
  const { activeRole, isSimulatingVisitor, hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleOk = roles.includes(activeRole);
  const permsOk = permissions.every((p) => hasPermission(p));

  if (isSimulatingVisitor || !roleOk || !permsOk) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-rose-500/40 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">Accès réservé</h3>
          <p className="text-xs text-slate-300">Votre rôle actuel ({activeRole}) ne permet pas d'accéder à cette section.</p>
          {fallbackTab && (
            <button
              onClick={fallbackTab}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
            >
              Retourner au portail
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
