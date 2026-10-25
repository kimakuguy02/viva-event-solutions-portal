import React, { useState } from 'react';
import { useAuth, OFFICIAL_VIVA_WORKERS } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Database,
  LogIn,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface EnterpriseLoginScreenProps {
  onSuccess?: () => void;
  onContinueAsVisitor?: () => void;
}

export const EnterpriseLoginScreen: React.FC<EnterpriseLoginScreenProps> = ({
  onSuccess,
  onContinueAsVisitor
}) => {
  const { loginWithServer, loginWithGoogle } = useAuth();
  const { exchangeRate } = useEnterpriseErp();
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';

  const [email, setEmail] = useState('direction.generale@viva-eventsolutions.cd');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez renseigner votre email et mot de passe.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await loginWithServer(email.trim(), password);
      setIsLoading(false);

      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "Identifiants non reconnus par le serveur d'authentification.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Erreur de communication avec le serveur.");
    }
  };

  const handleSelectEmail = (workerEmail: string) => {
    setEmail(workerEmail);
    setError(null);
  };

  const highlights = [
    {
      title: 'Comptabilité SYSCOHADA / IFRS RDC :',
      body: `Gestion bi-devise parfaite (1 USD = ${exchangeRate} CDF), rapprochements bancaires et journaux d'écritures.`,
      color: activePalette.colors.tertiary
    },
    {
      title: 'Règle Anti-Fraude Double Signature :',
      body: 'Tout décaissement > 100 USD requiert la validation Manager + le code OTP sécurisé du DAF.',
      color: activePalette.colors.accent
    },
    {
      title: 'Clôture Journalière Obligatoire :',
      body: 'Rapprochement quotidien de caisse physique avec procès-verbal scellé.',
      color: activePalette.colors.primary
    },
    {
      title: 'Traçabilité des Actifs (QUI, QUOI, QUAND) :',
      body: 'Suivi des prêts de matériel lourd et contrôle technique contradictoire au retour.',
      color: activePalette.colors.tertiary
    }
  ];

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden"
      style={{ backgroundColor: activePalette.colors.bgMain, color: activePalette.colors.textMain }}
    >
      {/* Ambiances de marque */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: activePalette.colors.primary }}
        />
        <div
          className="absolute -bottom-40 -right-16 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: activePalette.colors.accent }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: activePalette.colors.tertiary }}
        />
      </div>

      <div className="relative max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        {/* Colonne marque */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl p-0.5 flex items-center justify-center shadow-xl"
              style={{ background: activePalette.design.accentGradient }}
            >
              <div
                className="w-full h-full rounded-[14px] flex items-center justify-center font-black text-2xl font-mono"
                style={{ backgroundColor: activePalette.colors.bgMain, color: activePalette.colors.accent }}
              >
                V
              </div>
            </div>
            <div>
              <span
                className="text-[11px] font-bold uppercase tracking-widest font-mono"
                style={{ color: activePalette.colors.accent }}
              >
                Portail Entreprise Certifié
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight viva-heading">
                VIVA EVENT SOLUTIONS
              </h1>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm leading-relaxed viva-muted">
            <p className="font-semibold" style={{ color: activePalette.colors.textMain }}>
              Système de Gestion Intégrée (ERP) dédié aux travailleurs et à la direction :
            </p>
            <div className="space-y-2 text-xs">
              {highlights.map(item => (
                <div
                  key={item.title}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: activePalette.colors.bgSurface,
                    borderColor: activePalette.colors.border
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: item.color }} />
                  <span>
                    <strong style={{ color: activePalette.colors.textMain }}>{item.title}</strong>{' '}
                    {item.body}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex items-center gap-4 text-xs viva-muted pt-2 border-t"
            style={{ borderColor: activePalette.colors.border }}
          >
            <span className="flex items-center gap-1.5 font-mono" style={{ color: activePalette.colors.accent }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              Sécurité Serveur RBAC
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Database className="w-3.5 h-3.5" style={{ color: activePalette.colors.tertiary }} />
              Base Centrale Synchronisée
            </span>
          </div>
        </div>

        {/* Carte de connexion */}
        <div
          className="lg:col-span-6 rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-6"
          style={{
            backgroundColor: activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border,
            borderRadius: activePalette.design.radiusCard,
            boxShadow: activePalette.design.cardShadow
          }}
        >
          <div
            className="border-b pb-4"
            style={{ borderColor: activePalette.colors.border }}
          >
            <h2 className="text-xl font-bold viva-heading flex items-center gap-2">
              <LogIn className="w-5 h-5" style={{ color: activePalette.colors.accent }} />
              <span>Connexion Travailleur ERP</span>
            </h2>
            <p className="text-xs viva-muted mt-1">
              Authentification sécurisée par mot de passe vérifié côté serveur.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="viva-muted font-bold block mb-1.5 uppercase text-[10px] tracking-wider">
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3" style={{ color: activePalette.colors.textMuted }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@viva-eventsolutions.cd"
                  className="viva-input w-full pl-9 pr-3 py-2.5 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="viva-muted font-bold block mb-1.5 uppercase text-[10px] tracking-wider">
                Mot de Passe Sécurisé
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3" style={{ color: activePalette.colors.textMuted }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="viva-input w-full pl-9 pr-3 py-2.5 font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="viva-btn-primary w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Vérification Serveur...
                </span>
              ) : (
                <>
                  <span>Ouvrir l'ERP Entreprise</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-3">
            <div
              className="border-t w-full"
              style={{ borderColor: activePalette.colors.border }}
            ></div>
            <span
              className="px-3 text-[10px] uppercase tracking-widest absolute viva-muted"
              style={{ backgroundColor: activePalette.colors.bgSurface }}
            >
              ou
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              const res = await loginWithGoogle();
              setIsLoading(false);
              if (res.success && onSuccess) onSuccess();
              else if (!res.success) setError(res.error || "Erreur de connexion Google.");
            }}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all viva-muted hover:opacity-80"
            style={{
              backgroundColor: activePalette.colors.bgSubtle,
              borderColor: activePalette.colors.border
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Connexion Google (Firebase Auth)</span>
          </button>

          {/* Sélection rapide d'email (ne remplit jamais le mot de passe) */}
          <div
            className="space-y-2 pt-2 border-t"
            style={{ borderColor: activePalette.colors.border }}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider block viva-muted">
              Comptes Officiels VIVA EVENT (cliquez pour remplir l'email) :
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFICIAL_VIVA_WORKERS.slice(0, 4).map(worker => {
                const isSelected = email === worker.email;
                return (
                  <button
                    key={worker.id}
                    type="button"
                    onClick={() => handleSelectEmail(worker.email)}
                    className="p-2.5 rounded-xl border text-left transition-all cursor-pointer group"
                    style={{
                      backgroundColor: isSelected ? `${activePalette.colors.primary}1A` : activePalette.colors.bgSubtle,
                      borderColor: isSelected ? activePalette.colors.primary : activePalette.colors.border
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: worker.avatarColor }}
                      />
                      <span
                        className="text-xs font-bold line-clamp-1 transition-colors"
                        style={{ color: isSelected ? activePalette.colors.primary : activePalette.colors.textMain }}
                      >
                        {worker.name}
                      </span>
                    </div>
                    <p className="text-[10px] viva-muted line-clamp-1 pl-4.5 mt-0.5">
                      {worker.jobTitle.split('(')[0]}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleSelectEmail('commercial@viva-eventsolutions.cd')}
              className="w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between"
              style={{
                backgroundColor:
                  email === 'commercial@viva-eventsolutions.cd'
                    ? `${activePalette.colors.accent}1A`
                    : activePalette.colors.bgSubtle,
                borderColor:
                  email === 'commercial@viva-eventsolutions.cd'
                    ? activePalette.colors.accent
                    : activePalette.colors.border
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePalette.colors.accent }} />
                <span className="text-xs font-bold viva-heading">Sarah KALONJI • Commercial / Secrétaire</span>
              </div>
              <span className="text-[10px] font-bold" style={{ color: activePalette.colors.accent }}>
                Sélectionner
              </span>
            </button>
          </div>

          {onContinueAsVisitor && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onContinueAsVisitor}
                className="text-xs viva-muted hover:opacity-80 cursor-pointer underline underline-offset-4"
                style={{ color: isLight ? activePalette.colors.textMuted : activePalette.colors.textMuted }}
              >
                Consulter la Vitrine Événementielle Publique (Mode Visiteur)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
