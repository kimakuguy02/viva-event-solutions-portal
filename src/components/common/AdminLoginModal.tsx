import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Shield, Lock, Mail, KeyRound, X, Check, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithServer, loginWithGoogle } = useAuth();
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';

  const [email, setEmail] = useState('direction.generale@viva-eventsolutions.cd');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockTimer > 0) {
      timer = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockTimer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !password || !email) return;
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginWithServer(email.trim(), password);

      if (result.success) {
        setIsLoading(false);
        setPassword('');
        setError(null);
        setAttempts(0);
        onClose();
      } else {
        setIsLoading(false);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3 || result.error?.includes('verrouillé') || result.error?.includes('bloqué')) {
          setIsLocked(true);
          setLockTimer(15 * 60);
          setError(result.error || "Trop de tentatives erronées. Accès temporairement verrouillé pendant 15 minutes.");
        } else {
          setError(result.error || `Identifiants non reconnus (${newAttempts}/3 tentatives).`);
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Erreur de connexion avec le serveur central.");
    }
  };

  const handleFillEmail = (officialEmail: string) => {
    setEmail(officialEmail);
    setError(null);
  };

  const formatLockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative max-w-md w-full rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
        style={{
          backgroundColor: activePalette.colors.bgSurface,
          borderColor: activePalette.colors.border
        }}
      >
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-white">
                Console d'Administration
              </h3>
              <p className="text-xs text-slate-400">
                Authentification Centralisée Serveur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLocked && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3 animate-pulse">
            <Clock className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-bold">Accès Verrouillé pour des raisons de sécurité</p>
              <p className="mt-1 text-[11px]">
                3 tentatives consécutives échouées. Réessayez dans <span className="font-mono font-bold text-white">{formatLockTime(lockTimer)}</span>.
              </p>
            </div>
          </div>
        )}

        {error && !isLocked && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Identifiant Officiel (Email)</span>
              <button
                type="button"
                onClick={() => handleFillEmail('direction.generale@viva-eventsolutions.cd')}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                Remplir DG
              </button>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLocked || isLoading}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
                placeholder="nom@viva-eventsolutions.cd"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked || isLoading}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50 font-mono"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLocked || isLoading || !password}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Vérification Serveur...
              </span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Connexion Sécurisée</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest absolute">ou</span>
        </div>

        <button
          type="button"
          onClick={async () => {
            setIsLoading(true);
            const res = await loginWithGoogle();
            setIsLoading(false);
            if (res.success) onClose();
            else setError(res.error || "Erreur de connexion Google.");
          }}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow hover:border-slate-500"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continuer avec Google (Firebase Auth)</span>
        </button>

        {/* Security badges */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hachage PBKDF2 & Token Signé
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Rate Limiter : 3 tentatives
          </span>
        </div>
      </div>
    </div>
  );
};
