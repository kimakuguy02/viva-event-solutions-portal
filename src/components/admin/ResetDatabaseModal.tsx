import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { logAuditEvent } from '../../services/firebase';
import { AlertTriangle, ShieldAlert, X, Check, Database } from 'lucide-react';

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* P0 Wave 1 — RESET NEUTRALISÉ :
 * - Plus d'appel à /api/admin/reset-database (endpoint inexistant).
 * - Plus de 'Bearer admin_general_token' ni de header 'x-user-role' (confiance client).
 * - Plus d'OTP fictif (jamais vérifié).
 * - Confirmation tapée "RESET VIVA" + SUPER_ADMIN (rôle DB) requis.
 * - SCOPE STRICT : réécrit les valeurs par défaut Firestore + vide le cache local.
 *   Ne touche JAMAIS à Supabase/PostgreSQL. Ne purge aucune table distante. */
export const ResetDatabaseModal: React.FC<ResetDatabaseModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { resetToDefaults } = useProjectData();

  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-black text-white">Accès Refusé — SUPER_ADMIN requis</h3>
          <p className="text-xs text-slate-300">
            La réinitialisation est strictement réservée au Super Administrateur (rôle vérifié côté serveur).
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== 'RESET VIVA') {
      setError("Veuillez taper exactement 'RESET VIVA' pour confirmer.");
      return;
    }
    setError(null);
    setIsRunning(true);
    try {
      window.sessionStorage.setItem('viva_reset_armed', 'RESET VIVA');
      resetToDefaults();

      logAuditEvent({
        action: 'DATABASE_RESET_LOCAL_DEFAULTS',
        resource: 'database',
        resourceId: 'local-firestore-defaults',
        userEmail: currentUser.email,
        details: 'Réinitialisation locale (Firestore + cache) vers les valeurs par défaut. Supabase non touché.',
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setConfirmText('');
        onClose();
        window.location.reload();
      }, 2000);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">
              SUPER_ADMIN • Portée locale uniquement
            </span>
            <h3 className="text-xl font-black text-white">Restaurer les valeurs par défaut locales</h3>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center space-y-2">
            <Check className="w-10 h-10 mx-auto text-emerald-400" />
            <h4 className="font-black text-base">Valeurs locales restaurées.</h4>
            <p className="text-xs">Firestore + cache local réinitialisés. Supabase/PostgreSQL non touchés.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Portée : Firestore + cache navigateur. AUCUNE donnée Supabase ne sera modifiée.</span>
                </p>
                <p>Utilisez cette fonction uniquement pour restaurer une démo locale. Il n'existe pas de restauration distante automatique.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Tapez <code className="text-rose-400 font-mono">RESET VIVA</code> pour confirmer *
                </label>
                <input
                  type="text"
                  required
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="RESET VIVA"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-center tracking-widest text-base focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isRunning}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all mt-4 disabled:opacity-50"
              >
                {isRunning ? 'Exécution…' : 'Restaurer les valeurs par défaut locales'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
