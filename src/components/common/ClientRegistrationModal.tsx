import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { VisitorTrackingService } from '../../services/visitorTrackingService';
import {
  X,
  UserPlus,
  Building2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenReservation?: () => void;
}

export const ClientRegistrationModal: React.FC<ClientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenReservation
}) => {
  const { signUp } = useAuth();
  const { activePalette } = useTheme();
  const { addCrmClient } = useEnterpriseErp();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    organization: '',
    clientType: 'Entreprise ou établissement' as 'Institution publique' | 'Organisme international' | 'Entreprise ou établissement' | 'ONG et association' | 'Particulier' | 'Autres',
    email: '',
    phone: '+243 ',
    city: 'Kinshasa - Gombe',
    password: '',
    confirmPassword: '',
    primaryInterest: 'Sommets, Conférences & Événements Institutionnels'
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [generatedClientCode, setGeneratedClientCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!formData.fullName.trim()) {
      setError('Veuillez renseigner votre nom complet ou celui de votre représentant.');
      return;
    }

    if (!formData.organization.trim()) {
      setError("Veuillez renseigner le nom de votre organisation, entreprise ou institution.");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Veuillez fournir une adresse email professionnelle valide.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      setError('Veuillez renseigner un numéro de téléphone WhatsApp valide (+243...).');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe saisis ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Compte réel Supabase (rôle CLIENT imposé par la base, jamais choisi)
      const res = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        phone: formData.phone,
        organization: formData.organization,
      });
      if (!res.success) {
        setError(res.error || 'Échec de la création du compte.');
        return;
      }
      if (res.needsConfirmation) {
        setError(null);
      }
      setGeneratedClientCode(formData.email);

      // 2. Fiche CRM locale (migrée vers Supabase en Phase 5)
      addCrmClient({
        name: formData.fullName,
        organization: formData.organization,
        category: formData.clientType === 'Institution publique' ? 'institutionnel'
          : formData.clientType === 'Organisme international' ? 'diplomatique'
          : formData.clientType === 'Entreprise ou établissement' ? 'grande_entreprise'
          : formData.clientType === 'Particulier' ? 'particulier_vip' : 'pme',
        status: 'client_actif',
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.phone,
        address: formData.city,
        city: formData.city
      }).catch(err => {
        console.warn('[Wave 2] Fiche CRM non persistée distant :', err);
      });

      // 3. Identify visitor in VisitorTrackingService
      VisitorTrackingService.identifyVisitor({
        name: formData.fullName,
        organization: formData.organization,
        email: formData.email,
        phone: formData.phone,
        clientType: formData.clientType,
        city: formData.city
      });

      setRegisteredSuccess(true);
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = 'block text-xs font-semibold uppercase tracking-wider viva-muted mb-1';
  const inputClass = 'viva-input w-full px-3.5 py-2.5 text-xs font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div
        className="relative max-w-2xl w-full rounded-3xl border shadow-2xl overflow-hidden my-6 transition-all"
        style={{
          backgroundColor: activePalette.colors.bgSurface,
          borderColor: activePalette.colors.border,
          borderRadius: activePalette.design.radiusCard,
          boxShadow: activePalette.design.cardShadow
        }}
      >
        {/* Liseré de marque */}
        <div className="h-1.5 w-full" style={{ background: activePalette.design.accentGradient }} />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full transition-colors cursor-pointer z-10 viva-muted hover:opacity-70"
          style={{ backgroundColor: activePalette.colors.bgSubtle }}
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {!registeredSuccess ? (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${activePalette.colors.primary}14`,
                  borderColor: `${activePalette.colors.primary}33`,
                  color: activePalette.colors.primary
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Portail Institutionnel & Entreprises</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black viva-heading">
                Création de Compte Client & Identification
              </h3>
              <p className="text-xs viva-muted">
                Créez votre profil officiel pour accéder au suivi de vos devis, sécuriser la réservation de vos événements avant le jour J et bénéficier d'une assistance prioritaire.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nom Complet du Responsable *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Patrick Mukendi"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Organisation / Entreprise / Raison Sociale *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rawbank RDC / Ministère du Plan"
                  value={formData.organization}
                  onChange={e => setFormData({ ...formData, organization: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Type d'Organisation *</label>
                <select
                  value={formData.clientType}
                  onChange={e => setFormData({ ...formData, clientType: e.target.value as any })}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="Institution publique">Institution publique / Ministère</option>
                  <option value="Organisme international">Organisme international / Ambassade</option>
                  <option value="Entreprise ou établissement">Grande Entreprise / Multinationale</option>
                  <option value="ONG et association">ONG, Fondation ou Association</option>
                  <option value="Particulier">Particulier VIP / Événement Privé</option>
                  <option value="Autres">Autre structure</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Ville / Localité d'Opération *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kinshasa - Gombe / Lubumbashi"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email Professionnel *</label>
                <input
                  type="email"
                  required
                  placeholder="contact@organisation.cd"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Téléphone WhatsApp (Communication Directe) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+243 00 000 0000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>Mot de Passe de Connexion *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 caractères"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Confirmer le Mot de Passe *</label>
                <input
                  type="password"
                  required
                  placeholder="Répétez le mot de passe"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Primary Event Interest */}
            <div>
              <label className={labelClass}>Domaine d'Intérêt Prioritaire chez VIVA EVENTS</label>
              <select
                value={formData.primaryInterest}
                onChange={e => setFormData({ ...formData, primaryInterest: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="Sommets, Conférences & Événements Institutionnels">Sommets, Conférences & Événements Institutionnels</option>
                <option value="Location Matériel Lourd (Sonorisation Line Array, Écrans LED 4K, Énergie kVA)">Location Matériel Lourd (Son Line Array, Écrans LED, Énergie kVA)</option>
                <option value="Traduction Simultanée Bosch & Interprétariat Diplomatique">Traduction Simultanée Bosch & Interprétariat Diplomatique</option>
                <option value="Événements Hybrides, Streaming 4K & Retransmission Satellite">Événements Hybrides, Streaming 4K & Retransmission Satellite</option>
                <option value="Protocole d'État, Accueil VIP & Escorte Motorisée">Protocole d'État, Accueil VIP & Escorte Motorisée</option>
                <option value="Traiteur Gastronomique, Cocktails & Banquets Officiels">Traiteur Gastronomique, Cocktails & Banquets Officiels</option>
                <option value="Fêtes d'Entreprise, Salons Professionnels & Foires">Fêtes d'Entreprise, Salons Professionnels & Foires</option>
                <option value="Mariages Prestige & Cérémonies Privées Haut de Gamme">Mariages Prestige & Cérémonies Privées Haut de Gamme</option>
              </select>
            </div>

            {/* Legal / Data Guarantee Note */}
            <div
              className="p-4 rounded-2xl border text-xs flex items-start gap-3 viva-muted"
              style={{
                backgroundColor: activePalette.colors.bgSubtle,
                borderColor: activePalette.colors.border
              }}
            >
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: activePalette.colors.accent }} />
              <p className="leading-relaxed">
                Vos données sont strictement sécurisées selon le droit commercial OHADA en RDC et la politique de confidentialité de <strong style={{ color: activePalette.colors.textMain }}>VIVA EVENT SOLUTIONS SARLU</strong>. Votre compte client est immédiatement opérationnel pour planifier vos projets.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer viva-muted hover:opacity-70"
                style={{ borderColor: activePalette.colors.border }}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="viva-btn-primary w-full sm:w-auto px-7 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Création en cours...' : 'Créer Mon Compte Client & M\'Identifier'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Registration Success Screen */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-widest"
                style={{ color: activePalette.colors.primary }}
              >
                Compte Validé • Code : {generatedClientCode}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black viva-heading">
                Félicitations {formData.fullName} !
              </h3>
              <p className="text-sm viva-muted max-w-lg mx-auto leading-relaxed">
                Votre compte client pour <strong style={{ color: activePalette.colors.textMain }}>{formData.organization}</strong> est désormais activé. Vous êtes officiellement identifié au sein de la régie VIVA EVENT SOLUTIONS.
              </p>
            </div>

            {/* Quick Action Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenReservation?.();
                }}
                className="p-4 rounded-2xl border text-left space-y-2 transition-all hover:opacity-90 cursor-pointer group"
                style={{
                  backgroundColor: `${activePalette.colors.primary}14`,
                  borderColor: `${activePalette.colors.primary}40`
                }}
              >
                <div className="flex items-center justify-between">
                  <Calendar className="w-6 h-6" style={{ color: activePalette.colors.primary }} />
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: activePalette.colors.primary }} />
                </div>
                <div className="font-bold text-xs viva-heading uppercase">Réserver un Événement</div>
                <p className="text-[11px] viva-muted">
                  Transmettez votre projet bien avant le jour J pour réserver vos dates et matériels.
                </p>
              </button>

              <button
                onClick={onClose}
                className="p-4 rounded-2xl border text-left space-y-2 transition-all hover:opacity-90 cursor-pointer group"
                style={{
                  backgroundColor: activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border
                }}
              >
                <div className="flex items-center justify-between">
                  <Building2 className="w-6 h-6 viva-muted" />
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 viva-muted" />
                </div>
                <div className="font-bold text-xs viva-heading uppercase">Accéder au Portail Client</div>
                <p className="text-[11px] viva-muted">
                  Consultez votre espace, suivez vos devis et échangez avec vos chargés de projets.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
