import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import heroEventImage from '../../assets/images/corporate_event_stage_1789481825088.jpg';
import {
  Mail,
  Lock,
  User,
  Phone,
  X,
  ArrowRight,
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

  // Lockout timer if too many failed attempts (5 minutes)
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

  const inputClass = 'viva-input w-full pl-10 pr-4 py-2.5 text-sm';
  const labelClass = 'block text-xs font-bold viva-muted uppercase mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative max-w-4xl w-full rounded-3xl border shadow-2xl overflow-hidden my-6 grid lg:grid-cols-[0.85fr_1.15fr]"
        style={{
          backgroundColor: activePalette.colors.bgSurface,
          borderColor: activePalette.colors.border,
          borderRadius: activePalette.design.radiusCard,
          boxShadow: activePalette.design.cardShadow
        }}
      >
        {/* Panneau marque (desktop) */}
        <div
          className="relative hidden lg:flex flex-col justify-between p-8 text-white overflow-hidden"
        >
          <img
            src={heroEventImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: activePalette.design.accentGradient, opacity: 0.88 }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 10%, #FFFFFF 0%, transparent 45%)' }}
            aria-hidden="true"
          />
          <div className="relative space-y-7">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-lg">
                V
              </span>
              <div className="leading-tight">
                <div className="font-black text-sm tracking-wide">VIVA EVENT</div>
                <div className="text-[10px] tracking-[0.22em] opacity-80">SOLUTIONS SARLU</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-black leading-tight">
                Votre événement,<br />notre ingénierie.
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Sommets, galas et forums : 15 pôles intégrés, de la conception à la régie finale.
              </p>
            </div>

            <ul className="space-y-3 text-sm">
              {[
                'Commandes et devis centralisés',
                'Suivi de vos événements en temps réel',
                'Réservation directe du parc technique'
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-white/90">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative text-[11px] tracking-wide text-white/70 pt-8 uppercase">
            Kinshasa • République démocratique du Congo
          </div>
        </div>

        {/* Formulaire */}
        <div className="relative p-6 sm:p-8 space-y-5">
          <div
            className="absolute top-0 left-0 right-0 h-1.5 lg:hidden"
            style={{ background: activePalette.design.accentGradient }}
          ></div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl transition-colors cursor-pointer viva-muted hover:opacity-70"
            style={{ backgroundColor: activePalette.colors.bgSubtle }}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

        {/* Header Badge */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full font-bold text-xs border"
              style={{
                backgroundColor: `${activePalette.colors.accent}1A`,
                borderColor: `${activePalette.colors.accent}40`,
                color: activePalette.colors.accent
              }}
            >
              VIVA EVENT SOLUTIONS SARLU
            </span>
            <span className="text-[10px] font-mono font-bold" style={{ color: activePalette.colors.tertiary }}>
              • Chiffrement & Espace Sécurisé
            </span>
          </div>

          <h2 className="text-2xl font-black viva-heading flex items-center gap-2 pt-1">
            {isRegister ? (
              <>
                <UserPlus className="w-6 h-6" style={{ color: activePalette.colors.accent }} />
                <span>Créer un Compte Client</span>
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6" style={{ color: activePalette.colors.accent }} />
                <span>Connexion Espace Client</span>
              </>
            )}
          </h2>

          <p className="text-xs viva-muted leading-relaxed">
            {isRegister
              ? "Créez votre compte en 1 minute pour commander du matériel lourd, réserver nos 15 pôles de services et suivre vos devis."
              : "Connectez-vous pour passer vos commandes, suivre vos devis et gérer vos événements en temps réel."}
          </p>
        </div>

        {/* Rappel : commandes rattachées au compte */}
        <div
          className="p-3 rounded-2xl border flex items-center gap-3"
          style={{
            background: `linear-gradient(90deg, ${activePalette.colors.accent}14, ${activePalette.colors.tertiary}0F)`,
            borderColor: `${activePalette.colors.accent}33`
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${activePalette.colors.accent}1F`,
              borderColor: `${activePalette.colors.accent}40`,
              color: activePalette.colors.accent
            }}
          >
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold viva-heading block">Commandes & Réservations en ligne</span>
            <span className="viva-muted text-[11px]">
              {isRegister
                ? "Créer votre compte vous permet de réserver nos équipements sans intermédiaire."
                : "Votre compte client centralise tous vos bons de commande et devis officiels."}
            </span>
          </div>
        </div>

        {/* Onglets Connexion / Création */}
        <div
          className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border"
          style={{
            backgroundColor: activePalette.colors.bgSubtle,
            borderColor: activePalette.colors.border
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className="py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: !isRegister ? activePalette.colors.accent : 'transparent',
              color: !isRegister ? activePalette.colors.onAccent : activePalette.colors.textMuted
            }}
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
            className="py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: isRegister ? activePalette.colors.accent : 'transparent',
              color: isRegister ? activePalette.colors.onAccent : activePalette.colors.textMuted
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Créer un Compte</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            className="p-3.5 rounded-2xl border text-xs font-bold space-y-1"
            style={{
              backgroundColor: `${activePalette.colors.accent}1A`,
              borderColor: `${activePalette.colors.accent}40`,
              color: activePalette.colors.accent
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {isLocked ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-center space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-500 animate-pulse" />
            <h4 className="font-black text-rose-500 text-base">Accès temporairement verrouillé</h4>
            <p className="text-xs text-rose-500/90">
              Trop de tentatives erronées. Par mesure de sécurité anti-bruteforce, veuillez patienter avant de réessayer :
            </p>
            <div className="text-xl font-mono font-black" style={{ color: activePalette.colors.accent }}>
              {Math.floor(lockTimer / 60)}m {lockTimer % 60}s
            </div>
          </div>
        ) : (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className={labelClass}>Identité du Client / Nom complet ou Entreprise *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4" style={{ color: activePalette.colors.textMuted }} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Patrick Mukendi (ou Rawbank SARL)"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Type de Client *</label>
                  <select
                    value={clientType}
                    onChange={e => setClientType(e.target.value as any)}
                    className="viva-input w-full px-4 py-2.5 text-sm cursor-pointer"
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
                  <label className={labelClass}>Numéro de Téléphone International (+243...) *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4" style={{ color: activePalette.colors.textMuted }} />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+243 81 000 9988"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Adresse Email Professionnelle *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4" style={{ color: activePalette.colors.textMuted }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@entreprise.cd"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Mot de Passe Sécurisé *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4" style={{ color: activePalette.colors.textMuted }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="viva-btn-accent w-full py-3.5 text-xs sm:text-sm uppercase tracking-wider mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
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

        <div
          className="text-center pt-2 border-t"
          style={{ borderColor: activePalette.colors.border }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-bold hover:underline cursor-pointer"
            style={{ color: activePalette.colors.accent }}
          >
            {isRegister
              ? "Déjà un compte client ? Connectez-vous ici"
              : "Vous êtes visiteur ? Cliquez ici pour créer un compte et passer commande"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
