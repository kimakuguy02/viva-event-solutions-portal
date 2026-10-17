import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Building,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  LogIn,
  UserPlus,
  ShoppingCart
} from 'lucide-react';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export const ClientAuthModal: React.FC<ClientAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const { signIn, signUp } = useAuth();
  const { activePalette } = useTheme();

  const [isRegister, setIsRegister] = useState(initialMode === 'register');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+243 ');
  const [clientType, setClientType] = useState<'Institution publique' | 'Organisme international' | 'Entreprise ou établissement' | 'ONG et association' | 'Particulier' | 'Autres'>('Entreprise ou établissement');
  const [password, setPassword] = useState('');

  // Security & verification state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegister(initialMode === 'register');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  // Lockout timer if too many failed attempts (15 minutes = 900s)
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

  // Strict email regex
  const isValidEmail = (val: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  };

  // Strict phone regex (international format starting with + and country code, e.g. +243810009988)
  const isValidPhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, '');
    return /^\+[1-9][0-9]{7,14}$/.test(cleaned);
  };

  // Quick Demo Client login helper (données fictives — Phase 1, Bloc 6)
  const handleQuickDemoClient = () => {
    setName('Client Démo (fictif)');
    setEmail('demo@exemple.invalid');
    setPhone('+243 00 000 0000');
    setClientType('Entreprise ou établissement');
    setPassword('client2026!');
    setIsRegister(false);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError(null);
    setSuccessMsg(null);

    if (!isValidEmail(email)) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError('Veuillez renseigner votre nom complet ou raison sociale.');
        return;
      }
      if (!isValidPhone(phone)) {
        setError('Format de téléphone international invalide. Exemple requis : +243 81 000 9988');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit comporter au moins 8 caractères.');
        return;
      }
    } else if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);
    try {
      if (!isRegister) {
        // Connexion réelle : Supabase Auth (repli legacy si distant non déployé)
        const res = await signIn(email, password);
        if (!res.success) {
          const nextAttempts = attempts + 1;
          setAttempts(nextAttempts);
          if (nextAttempts >= 5) {
            setIsLocked(true);
            setLockTimer(5 * 60);
            setError('Trop de tentatives. Accès verrouillé 5 minutes.');
          } else {
            setError(res.error || `Identifiants incorrects (${nextAttempts}/5).`);
          }
          return;
        }
        setAttempts(0);
        onSuccess();
        onClose();
        setPassword('');
        return;
      }

      // Inscription réelle : rôle CLIENT imposé par la base (trigger), jamais choisi.
      const res = await signUp({ email, password, name: name.trim(), phone, organization: name.trim() });
      if (!res.success) {
        setError(res.error || "Échec de la création du compte.");
        return;
      }
      if (res.needsConfirmation) {
        setSuccessMsg('📧 Compte créé. Cliquez sur le lien de confirmation envoyé à votre adresse email, puis connectez-vous.');
        setIsRegister(false);
      } else {
        onSuccess();
        onClose();
      }
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative max-w-lg w-full rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-5 overflow-hidden"
        style={{
          backgroundColor: activePalette.colors.bgSurface,
          borderColor: activePalette.colors.border
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              VIVA EVENT SOLUTIONS SARLU
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              • Chiffrement & Espace Sécurisé
            </span>
          </div>

          <h2 className="text-2xl font-black text-white flex items-center gap-2 pt-1">
            {isRegister ? (
              <>
                <UserPlus className="w-6 h-6 text-amber-400" />
                <span>Créer un Compte Client</span>
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6 text-amber-400" />
                <span>Connexion Espace Client</span>
              </>
            )}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            {isRegister
              ? "Créez votre compte en 1 minute pour commander du matériel lourd (3 200 kVA), réserver nos 15 pôles de services et suivre vos devis."
              : "Connectez-vous pour passer vos commandes, suivre vos devis et gérer vos événements en temps réel."}
          </p>
        </div>

        {/* Highlighted Banner for Ordering via Account */}
        {(
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/10 border border-amber-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block">Commandes & Réservations en ligne</span>
              <span className="text-slate-300 text-[11px]">
                {isRegister
                  ? "Créer votre compte vous permet de réserver nos équipements sans intermédiaire."
                  : "Votre compte client centralise tous vos bons de commande et devis officiels."}
              </span>
            </div>
          </div>
        )}

        {/* Dual Mode Switcher Tabs: Connexion / Login VS Créer un Compte */}
        {(
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isRegister
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Se Connecter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isRegister
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Créer un Compte</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {isLocked ? (
          <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-center space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-500 animate-pulse" />
            <h4 className="font-black text-rose-300 text-base">Accès temporairement verrouillé</h4>
            <p className="text-xs text-rose-200">
              Trop de tentatives erronées. Par mesure de sécurité anti-bruteforce, veuillez patienter avant de réessayer :
            </p>
            <div className="text-xl font-mono font-black text-amber-400">
              {Math.floor(lockTimer / 60)}m {lockTimer % 60}s
            </div>
          </div>
        ) : (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Identité du Client / Nom complet ou Entreprise *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Patrick Mukendi (ou Rawbank SARL)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Type de Client *
                  </label>
                  <select
                    value={clientType}
                    onChange={e => setClientType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Institution publique">Institution publique</option>
                    <option value="Organisme international">Organisme international</option>
                    <option value="Entreprise ou établissement">Entreprise ou établissement</option>
                    <option value="ONG et association">ONG et association</option>
                    <option value="Particulier">Particulier</option>
                    <option value="Autres">Autres</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Numéro de Téléphone International (+243...) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+243 81 000 9988"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Adresse Email Professionnelle *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@entreprise.cd"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Mot de Passe Sécurisé *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Quick autofill for immediate testing */}
            {!isRegister && (
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleQuickDemoClient}
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Remplir avec un compte de démonstration (fictif)</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg cursor-pointer transition-all mt-2 flex items-center justify-center gap-2"
            >
              <span>
                {isLoading
                  ? "Traitement sécurisé..."
                  : isRegister
                  ? "Créer mon Compte"
                  : "Se Connecter"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {(
          <div className="text-center pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              {isRegister
                ? "Déjà un compte client ? Connectez-vous ici"
                : "Vous êtes visiteur ? Cliquez ici pour créer un compte et passer commande"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
