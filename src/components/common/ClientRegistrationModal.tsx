import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { VisitorTrackingService } from '../../services/visitorTrackingService';
import {
  X,
  UserPlus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Lock,
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
  const { activePalette, themeMode } = useTheme();
  const { addCrmClient } = useEnterpriseErp();

  const isLight = themeMode === 'light';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative max-w-2xl w-full rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden my-6 transition-all">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4A6CF7] via-[#8B5CF6] to-[#4A6CF7]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!registeredSuccess ? (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#4A6CF7] border border-blue-100 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Portail Institutionnel & Entreprises</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Création de Compte Client & Identification
              </h3>
              <p className="text-xs text-[#6B7280]">
                Créez votre profil officiel pour accéder au suivi de vos devis, sécuriser la réservation de vos événements avant le jour J et bénéficier d'une assistance prioritaire.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Nom Complet du Responsable *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dr. Patrick Mukendi"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Organisation / Entreprise / Raison Sociale *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rawbank RDC / Ministère du Plan"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Client Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Type d'Organisation *
                </label>
                <select
                  value={formData.clientType}
                  onChange={e => setFormData({ ...formData, clientType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white cursor-pointer"
                >
                  <option value="Institution publique">Institution publique / Ministère</option>
                  <option value="Organisme international">Organisme international / Ambassade</option>
                  <option value="Entreprise ou établissement">Grande Entreprise / Multinationale</option>
                  <option value="ONG et association">ONG, Fondation ou Association</option>
                  <option value="Particulier">Particulier VIP / Événement Privé</option>
                  <option value="Autres">Autre structure</option>
                </select>
              </div>

              {/* City / Province */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Ville / Localité d'Opération *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kinshasa - Gombe / Lubumbashi"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email Professionnel *
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@organisation.cd"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white"
                />
              </div>

              {/* WhatsApp Phone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Téléphone WhatsApp (Communication Directe) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+243 00 000 0000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Mot de Passe de Connexion *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Confirmer le Mot de Passe *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Répétez le mot de passe"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white"
                />
              </div>
            </div>

            {/* Primary Event Interest */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Domaine d'Intérêt Prioritaire chez VIVA EVENTS
              </label>
              <select
                value={formData.primaryInterest}
                onChange={e => setFormData({ ...formData, primaryInterest: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#4A6CF7] focus:bg-white cursor-pointer"
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
            <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/60 text-xs flex items-start gap-3 text-[#6B7280]">
              <Sparkles className="w-4 h-4 text-[#4A6CF7] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Vos données sont strictement sécurisées selon le droit commercial OHADA en RDC et la politique de confidentialité de <strong className="text-slate-900">VIVA EVENT SOLUTIONS SARLU</strong>. Votre compte client est immédiatement opérationnel pour planifier vos projets.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-2.5 rounded-full font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all bg-[#4A6CF7] hover:bg-[#3B5CE6] text-white disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Création en cours...' : 'Créer Mon Compte Client & M\'Identifier'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Registration Success Screen */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#4A6CF7] uppercase tracking-widest">
                Compte Validé • Code : {generatedClientCode}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Félicitations {formData.fullName} !
              </h3>
              <p className="text-sm text-[#6B7280] max-w-lg mx-auto leading-relaxed">
                Votre compte client pour <strong className="text-slate-900">{formData.organization}</strong> est désormais activé. Vous êtes officiellement identifié au sein de la régie VIVA EVENT SOLUTIONS.
              </p>
            </div>

            {/* Quick Action Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenReservation?.();
                }}
                className="p-4 rounded-2xl border border-blue-200 text-left space-y-2 transition-all hover:shadow-md cursor-pointer bg-blue-50/50 group"
              >
                <div className="flex items-center justify-between">
                  <Calendar className="w-6 h-6 text-[#4A6CF7]" />
                  <ArrowRight className="w-4 h-4 text-[#4A6CF7] transition-transform group-hover:translate-x-1" />
                </div>
                <div className="font-bold text-xs text-slate-900 uppercase">Réserver un Événement</div>
                <p className="text-[11px] text-[#6B7280]">
                  Transmettez votre projet bien avant le jour J pour réserver vos dates et matériels.
                </p>
              </button>

              <button
                onClick={onClose}
                className="p-4 rounded-2xl border border-slate-200 text-left space-y-2 transition-all hover:shadow-md cursor-pointer bg-white group"
              >
                <div className="flex items-center justify-between">
                  <Building2 className="w-6 h-6 text-slate-700" />
                  <ArrowRight className="w-4 h-4 text-slate-700 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="font-bold text-xs text-slate-900 uppercase">Accéder au Portail Client</div>
                <p className="text-[11px] text-[#6B7280]">
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
