import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { throttleCheck } from '../../utils/rateLimit';
import { DEPARTMENTS_DATA } from '../../data/vivaData';
import {
  Calculator,
  CheckCircle2,
  FileText,
  Building,
  Mail,
  Phone,
  User,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface InteractiveQuoteFormProps {
  initialDeptId?: number | null;
  onClose?: () => void;
  onSuccessSubmitted?: (refCode: string) => void;
}

export const InteractiveQuoteForm: React.FC<InteractiveQuoteFormProps> = ({
  initialDeptId,
  onClose,
  onSuccessSubmitted
}) => {
  const { submitQuoteRequest } = useProjectData();
  const [step, setStep] = useState<number>(1);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Form States
  const [eventType, setEventType] = useState<'institution_publique' | 'organisme_international' | 'entreprise_etablissement' | 'ong_association' | 'particulier'>('institution_publique');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('Kinshasa / Gombe (Hôtel / Salle de prestige)');
  const [estimatedAttendees, setEstimatedAttendees] = useState<number>(500);

  // Selected Departments
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>(() => {
    return initialDeptId ? [initialDeptId] : [2, 7, 8];
  });

  // Technical Options Checklist (19 Prestations)
  const [requirements, setRequirements] = useState({
    conseilConception: true,
    productionAudiovisuelle: true,
    diffusionLive: true,
    sonorisationEclairage: true,
    ecransLed: true,
    decorationScenographie: true,
    mobilierInfrastructures: true,
    traiteurRestauration: true,
    locationMatérielChapiteaux: true,
    transportLogistique: true,
    accueilProtocole: true,
    billetterieInscriptions: true,
    traductionInterpretarit: false,
    marketingCommunication: false,
    brandingActivation: false,
    securiteGardiennage: true,
    servicesArtistiques: false,
    developpementTech: false,
    hebergementConciergerie: false
  });

  const [customNotes, setCustomNotes] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientOrganization, setClientOrganization] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Live Budget Calculation Engine (Estimation USD)
  const calculateEstimatedBudget = () => {
    let basePrice = 5000;

    // Scale by attendees
    if (estimatedAttendees > 2000) basePrice += 25000;
    else if (estimatedAttendees > 1000) basePrice += 15000;
    else if (estimatedAttendees > 500) basePrice += 8000;
    else if (estimatedAttendees > 200) basePrice += 4000;

    // Scale by client type complexity
    if (eventType === 'institution_publique' || eventType === 'organisme_international') basePrice *= 1.3;
    if (eventType === 'particulier') basePrice *= 0.9;

    // Scale by departments count
    basePrice += selectedDeptIds.length * 2500;

    // Specific technical add-ons (19 Prestations sum)
    if (requirements.conseilConception) basePrice += 2500;
    if (requirements.productionAudiovisuelle) basePrice += 3500;
    if (requirements.diffusionLive) basePrice += 2800;
    if (requirements.sonorisationEclairage) basePrice += 4500;
    if (requirements.ecransLed) basePrice += 3800;
    if (requirements.decorationScenographie) basePrice += 3500;
    if (requirements.mobilierInfrastructures) basePrice += 3000;
    if (requirements.traiteurRestauration) basePrice += Math.round(estimatedAttendees * 35);
    if (requirements.locationMatérielChapiteaux) basePrice += 4200;
    if (requirements.transportLogistique) basePrice += 2500;
    if (requirements.accueilProtocole) basePrice += 2000;
    if (requirements.billetterieInscriptions) basePrice += 1800;
    if (requirements.traductionInterpretarit) basePrice += 3200;
    if (requirements.marketingCommunication) basePrice += 3000;
    if (requirements.brandingActivation) basePrice += 2800;
    if (requirements.securiteGardiennage) basePrice += 2800;
    if (requirements.servicesArtistiques) basePrice += 2500;
    if (requirements.developpementTech) basePrice += 3500;
    if (requirements.hebergementConciergerie) basePrice += 2200;

    return Math.round(basePrice);
  };

  const estimatedBudgetUSD = calculateEstimatedBudget();

  const toggleDept = (id: number) => {
    setSelectedDeptIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone || !eventName) {
      setValidationError("Veuillez remplir tous les champs obligatoires (Nom, Email, Téléphone, Titre de l'événement).");
      return;
    }
    setValidationError(null);

    // Anti-abus : 3 devis / 5 min par navigateur (défense serveur/Edge : R4).
    const throttle = throttleCheck('quote:submit', 3, 5 * 60_000, 5 * 60_000);
    if (!throttle.allowed) {
      setValidationError(`Trop de demandes consécutives. Réessayez dans ${Math.ceil(throttle.retryAfterSec / 60)} minute(s).`);
      return;
    }

    // Wave 2 — succès affiché seulement après confirmation Supabase.
    try {
      const ref = await submitQuoteRequest({
      clientName,
      clientOrganization: clientOrganization || "Organisation Partenaire",
      clientEmail,
      clientPhone,
      eventType,
      eventName,
      eventDate: eventDate || "2026-10-15",
      location,
      estimatedAttendees,
      selectedDepartmentIds: selectedDeptIds,
      requirements,
      customNotes,
      estimatedBudgetUSD,
      priority: eventType === 'institution_publique' ? 'urgente' : 'haute'
    });

    setSubmittedRef(ref);
    if (onSuccessSubmitted) {
      onSuccessSubmitted(ref);
    }
    } catch (e) {
      setValidationError(
        `Enregistrement impossible : ${e instanceof Error ? e.message : String(e)}. Aucune donnée perdue, réessayez.`,
      );
    }
  };

  if (submittedRef) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-[#4A6CF7] tracking-wider uppercase">
            Demande de devis enregistrée avec succès
          </span>
          <h3 className="text-2xl font-black text-slate-900">
            Merci {clientName}, votre dossier est transmis au Guichet Unique !
          </h3>
          <p className="text-sm text-[#6B7280]">
            Votre référence officielle de suivi est :
          </p>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-[#4A6CF7] font-mono font-bold text-lg inline-block">
            {submittedRef}
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-[#6B7280] space-y-2">
          <p className="font-bold text-slate-900">Prochaines étapes :</p>
          <p>1. Notre pôle Ingénierie & Direction étudie votre cahier des charges sous 24h ouvrées.</p>
          <p>2. Un devis pro-forma détaillé et un rétroplanning chronologique vous seront transmis.</p>
          <p>3. En tant qu'administrateur, vous pouvez également consulter et traiter ce devis instantanément dans l'espace Back-Office !</p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              setSubmittedRef(null);
              setStep(1);
              if (onClose) onClose();
            }}
            className="px-6 py-2.5 rounded-full bg-[#4A6CF7] hover:bg-[#3B5CE6] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            Fermer le Guichet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-[#4A6CF7] border border-blue-100">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Demande de Devis Officiel & Guichet Unique
            </h3>
            <p className="text-xs text-[#6B7280]">
              Soumission de cahier des charges, chiffrage et transmission directe au Back-Office (USD)
            </p>
          </div>
        </div>

        {/* Live dynamic badge */}
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-mono text-[#6B7280] uppercase">Estimation Provisoire</span>
          <div className="text-xl font-black text-[#4A6CF7]">
            ${estimatedBudgetUSD.toLocaleString()} <span className="text-xs font-normal text-[#6B7280]">USD</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-[#4A6CF7]' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-[#4A6CF7] text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
          <span className="hidden sm:inline">Cahier des Charges</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-100 mx-2"></div>
        <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-[#4A6CF7]' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-[#4A6CF7] text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
          <span className="hidden sm:inline">Pôles & Options</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-100 mx-2"></div>
        <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? 'text-[#4A6CF7]' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-[#4A6CF7] text-white' : 'bg-slate-100 text-slate-500'}`}>3</span>
          <span className="hidden sm:inline">Coordonnées & Validation</span>
        </div>
      </div>

      {/* Step 1 : Event basics */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Type de clients *
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
              >
                <option value="institution_publique">Institution publique</option>
                <option value="organisme_international">Organisme international</option>
                <option value="entreprise_etablissement">Entreprise ou établissement</option>
                <option value="ong_association">ONG et association</option>
                <option value="particulier">Particulier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Nom ou Thématique de l'Événement *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="Ex. Mariage, Sommet International, Forum Économique"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Date Prévisionnelle
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Lieu / Ville / Salle
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ex: Kinshasa / Palais du Peuple"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Nombre de Participants : <span className="text-[#4A6CF7] font-bold">{estimatedAttendees}</span>
              </label>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={estimatedAttendees}
                onChange={e => setEstimatedAttendees(Number(e.target.value))}
                className="w-full accent-[#4A6CF7] mt-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (!eventName) {
                  alert("Veuillez saisir le nom de l'événement.");
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-2.5 rounded-full bg-[#4A6CF7] hover:bg-[#3B5CE6] text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 : Departments & Technical options */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Departments Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Départements VIVA Sollicités (Cocher les pôles souhaités)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              {DEPARTMENTS_DATA.map(dept => {
                const isSelected = selectedDeptIds.includes(dept.id);
                return (
                  <div
                    key={dept.id}
                    onClick={() => toggleDept(dept.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-[#4A6CF7] font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{dept.number}. {dept.shortName}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#4A6CF7] shrink-0 ml-1" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Prestations & Équipements Clés Requis (19 Pôles d'Expertise)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              {[
                { key: 'conseilConception', label: 'Conseil, conception, organisation & coordination événementielle' },
                { key: 'productionAudiovisuelle', label: 'Production audiovisuelle & cinématographique' },
                { key: 'diffusionLive', label: 'Diffusion en direct : présentiel & virtuel' },
                { key: 'sonorisationEclairage', label: 'Sonorisation, éclairage & équipements scéniques' },
                { key: 'ecransLed', label: 'Écrans LED, projection & solutions visuelles' },
                { key: 'decorationScenographie', label: 'Décoration, scénographie & aménagement événementiel' },
                { key: 'mobilierInfrastructures', label: 'Mobilier & infrastructures événementielles' },
                { key: 'traiteurRestauration', label: 'Traiteur, restauration & hospitalité' },
                { key: 'locationMatérielChapiteaux', label: 'Location de matériels, chapiteaux, groupes électrogènes et salles' },
                { key: 'transportLogistique', label: 'Transport, logistique & mobilité' },
                { key: 'accueilProtocole', label: 'Accueil, protocole, hôtesses & gestion des invités' },
                { key: 'billetterieInscriptions', label: 'Billetterie, inscriptions & gestion des participants' },
                { key: 'traductionInterpretarit', label: 'Traduction, interprétariat & services linguistiques' },
                { key: 'marketingCommunication', label: 'Marketing, communication, promotion & relations publiques' },
                { key: 'brandingActivation', label: 'Branding, visibilité & activation de marque' },
                { key: 'securiteGardiennage', label: 'Sécurité, gardiennage & gestion des risques' },
                { key: 'servicesArtistiques', label: 'Services artistiques, animations & divertissement' },
                { key: 'developpementTech', label: 'Développement technologique & solutions digitales' },
                { key: 'hebergementConciergerie', label: 'Hébergement, conciergerie & assistance événementielle' }
              ].map(opt => (
                <label
                  key={opt.key}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-200 cursor-pointer text-xs text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={(requirements as any)[opt.key]}
                    onChange={e =>
                      setRequirements(prev => ({ ...prev, [opt.key]: e.target.checked }))
                    }
                    className="accent-[#4A6CF7] w-4 h-4 rounded shrink-0 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-full bg-[#4A6CF7] hover:bg-[#3B5CE6] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 : Contact & Submission */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#4A6CF7] font-semibold">Estimation Indicative Globale :</span>
              <div className="text-2xl font-black text-slate-900">
                ${estimatedBudgetUSD.toLocaleString()} <span className="text-xs font-normal text-[#6B7280]">USD</span>
              </div>
            </div>
            <div className="text-right text-xs text-[#6B7280]">
              <span>{selectedDeptIds.length} Pôles sélectionnés</span> • <span>{estimatedAttendees} Invités</span>
            </div>
          </div>

          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Nom & Prénom du Responsable *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ex: M. Guy Kimaku"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Institution / Entreprise / Ministère
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientOrganization}
                  onChange={e => setClientOrganization(e.target.value)}
                  placeholder="Ex: Secrétariat Général ou Ambassade"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email Professionnel *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="contact@organisation.cd"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Numéro Téléphone / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+243 81 000 0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Précisions Spécifiques / Contraintes du Cahier des Charges
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="Exigences protocolaires particulières, raccordement Starlink, régimes alimentaires, escorte..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
            ></textarea>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-[#4A6CF7] hover:bg-[#3B5CE6] text-white font-semibold text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Demander un devis</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
