import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ErpModuleId, ERP_RBAC_PERMISSIONS, canUserAccessModule } from '../../utils/rbac';
import { AdminLoginModal } from '../common/AdminLoginModal';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Users,
  ChevronRight,
  KeyRound
} from 'lucide-react';

interface RbacAccessDeniedViewProps {
  moduleId: ErpModuleId;
  onNavigateToAllowedTab?: (tabId: string) => void;
}

export const RbacAccessDeniedView: React.FC<RbacAccessDeniedViewProps> = ({
  moduleId,
  onNavigateToAllowedTab
}) => {
  const { currentUser } = useAuth();
  const perm = ERP_RBAC_PERMISSIONS[moduleId];
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Find modules allowed for this user
  const allModules: ErpModuleId[] = [
    'dashboard',
    'accounting',
    'crm',
    'projects-tasks',
    'assets-loans',
    'human-resources',
    'governance'
  ];

  const allowedModules = allModules.filter(m => canUserAccessModule(currentUser.role, m));

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="max-w-2xl w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Warning Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Restriction RBAC Active • Habilitation Requise
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Accès au Module Non Autorisé
            </h3>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Module ciblé :</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              {perm?.name || moduleId}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Profil Actif :</span>
            <span className="font-bold text-amber-400">
              {currentUser.name} ({currentUser.jobTitle || currentUser.role})
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-medium block">Motif de la restriction :</span>
            <p className="text-slate-200 leading-relaxed bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
              {perm?.denialReason || "Ce module fait l'objet d'une restriction d'accès basée sur la matrice de sécurité de VIVA EVENT SOLUTIONS SARLU."}
            </p>
          </div>

          <div className="pt-2 text-xs">
            <span className="text-slate-400 font-medium block mb-1.5">Habilitations accréditées requises :</span>
            <div className="flex flex-wrap gap-1.5">
              {perm?.requiredRoleNames.map((rName, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px]"
                >
                  {rName}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Allowed Modules For This Role */}
        <div className="space-y-2 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
            Vos Modules Autorisés en tant que {currentUser.name} :
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allowedModules.map(mId => {
              const mPerm = ERP_RBAC_PERMISSIONS[mId];
              return (
                <button
                  key={mId}
                  onClick={() => onNavigateToAllowedTab && onNavigateToAllowedTab(mId)}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left flex items-center justify-between text-white font-bold transition-all cursor-pointer group shadow"
                >
                  <span className="line-clamp-1">{mPerm.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Re-authenticate with higher authorization */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Changer de Session Authentifiée
            </span>
            <p className="text-[11px] text-slate-300">
              Pour déverrouiller ce module avec un compte habilité, identifiez-vous avec vos identifiants officiels.
            </p>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow flex items-center gap-1.5 transition-all"
          >
            <span>Se Reconnecter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AdminLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
