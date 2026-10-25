import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { throttleCheck } from '../../utils/rateLimit';
import { VisitorTrackingService } from '../../services/visitorTrackingService';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  Building,
  Phone,
  Mail,
  FileText,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Layers,
  Flame,
  ArrowRight
} from 'lucide-react';

interface EventReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EventReservationModal: React.FC<EventReservationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, isSimulatingVisitor } = useAuth();
  const { activePalette, themeMode } = useTheme();
  const { submitQuoteRequest, departments } = useProjectData();

  const isLight = themeMode === 'light';
  const isLoggedInClient = currentUser.role === 'client' && !isSimulatingVisitor;

  // Form State
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<'institutionnel' | 'diplomatique' | 'entreprise' | 'culturel' | 'mariage_prestige' | 'foire_salon' | 'religieux' | 'sportif'>('entreprise');
  const [eventDate, setEventDate] = useState('');
  const [durationDays, setDurationDays] = useState('1');
  const [location, setLocation] = useState('Kinshasa - Fleuve Congo Hotel');
  const [attendeesInput, setAttendeesInput] = useState('Ex: 250');
  const [format, setFormat] = useState<'presentiel' | 'hybride' | 'live'>('presentiel');
  const [budgetInput, setBudgetInput] = useState('Ex: 12 000 USD');
  const [customNotes, setCustomNotes] = useState('');

  // Selected Services / Poles (including Pôle 13: Production Audiovisuelle & Cinématographique)
  const [selectedPoles, setSelectedPoles] = useState<number[]>([3, 7, 8, 13]);

  // Contact Info (pre-filled if user is logged in)
  const [organizerName, setOrganizerName] = useState(isLoggedInClient ? currentUser.name : '');
  const [organization, setOrganization] = useState(isLoggedInClient ? (currentUser.organization || '') : '');
  const [email, setEmail] = useState(isLoggedInClient ? currentUser.email : '');
  const [phone, setPhone] = useState(isLoggedInClient ? (currentUser.phone || '+243 ') : '+243 ');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservationCode, setConfirmedReservationCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate days before the event (anticipation delay)
  const daysUntilEvent = useMemo(() => {
    if (!eventDate) return null;
    const target = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [eventDate]);

  if (!isOpen) return null;

  const togglePole = (poleId: number) => {
    setSelectedPoles(prev =>
      prev.includes(poleId) ? prev.filter(id => id !== poleId) : [...prev, poleId]
    );
  };

  const handleSubmitReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventName.trim()) {
      setError("Veuillez donner un titre ou intitulé à votre projet événementiel.");
      return;
    }

    if (!eventDate) {
      setError("Veuillez sélectionner la date prévue de l'événement.");
      return;
    }

    if (!organizerName.trim()) {
      setError("Veuillez renseigner votre nom complet ou celui du responsable du projet.");
      return;
    }

    if (!phone.trim() || phone.length < 8) {
      setError("Veuillez indiquer un numéro WhatsApp valide pour la confirmation.");
      return;
    }

    setIsSubmitting(true);

    // Anti-abus : 3 réservations / 10 min par navigateur (défense serveur/Edge : R4).
    const throttle = throttleCheck('reservation:submit', 3, 10 * 60_000, 10 * 60_000);
    if (!throttle.allowed) {
      setError(`Trop de réservations consécutives. Réessayez dans ${Math.ceil(throttle.retryAfterSec / 60)} minute(s).`);
      setIsSubmitting(false);
      return;
    }

    setTimeout(async () => {
      // 1. Submit into projects/quotes store — Wave 2 : succès après confirmation.
      const reservationRef = `RES-VES-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const attendeesCount = parseInt(attendeesInput.replace(/[^0-9]/g, ''), 10) || 250;
      const budgetAmount = parseInt(budgetInput.replace(/[^0-9]/g, ''), 10) || 12000;

      try {
        await submitQuoteRequest({
        clientName: organizerName,
        clientOrganization: organization || "Client Organisateur",
        clientEmail: email || "contact@client.cd",
        clientPhone: phone,
        eventType,
        eventName,
        eventDate,
        location,
        estimatedAttendees: attendeesCount,
        format,
        offerLevel: 'PREMIUM',
        selectedDepartmentIds: selectedPoles,
        requirements: {
          scenicAudioLight: selectedPoles.includes(7),
          ledScreensAndBroadcast: selectedPoles.includes(7) || selectedPoles.includes(3),
          hybridStreaming: format === 'hybride' || selectedPoles.includes(3),
          simultaneousTranslation: selectedPoles.includes(11),
          vipTransportAndEscort: selectedPoles.includes(10),
          highSecurityAndCrowdControl: selectedPoles.includes(12),
          cateringAndCocktail: selectedPoles.includes(6),
          tentsAndPowerGen: selectedPoles.includes(7),
          audiovisual4kProduction: selectedPoles.includes(13),
          decorationAndFloral: selectedPoles.includes(5),
          artisticAndEntertainment: selectedPoles.includes(15),
          hotelAndConcierge: selectedPoles.includes(14)
        },
        customNotes: `[RÉSERVATION ANTICIPÉE BIEN AVANT JOUR J] Effectif: ${attendeesInput}. Budget: ${budgetInput}. Durée: ${durationDays} jour(s). Décompte: ${daysUntilEvent} jours restants. Cahier des charges: ${customNotes}`,
        estimatedBudgetUSD: budgetAmount,
        priority: (daysUntilEvent !== null && daysUntilEvent < 14) ? 'urgente' : 'haute'
      });
      } catch (e) {
        setError(`Réservation non enregistrée : ${e instanceof Error ? e.message : String(e)}. Réessayez.`);
        setIsSubmitting(false);
        return;
      }

      // 2. Track action in Visitor Tracking
      VisitorTrackingService.trackAction(
        'reservation_submitted',
        `Réservation Anticipée : ${eventName} (${organizerName} - ${phone})`
      );

      // If user was not registered yet, identify them now
      VisitorTrackingService.identifyVisitor({
        name: organizerName,
        organization: organization || 'Projet Événementiel Réservé',
        email: email || '',
        phone,
        clientType: eventType,
        city: location.split('-')[0].trim() || 'Kinshasa'
      });

      setIsSubmitting(false);
      setConfirmedReservationCode(reservationRef);
      onSuccess?.();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative max-w-3xl w-full rounded-2xl sm:rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col transition-all">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--viva-primary)] via-[#8B5CF6] to-[var(--viva-primary)] shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmedReservationCode ? (
          <form onSubmit={handleSubmitReservation} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[var(--viva-primary)] border border-blue-100 text-xs font-semibold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Anticipation Événementielle & Blocage de Calendrier</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Réservation de Projet Événementiel Avant le Jour J
              </h3>
              <p className="text-xs text-[var(--viva-text-muted)] leading-relaxed">
                Faites-nous parvenir votre projet dès aujourd'hui. L'anticipation garantit la réservation prioritaire de nos parcs de matériels lourds (Line Array, écrans LED, régies 4K) et la mobilisation de nos directeurs de régie.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1 : Le Projet & la Date */}
            <div className="space-y-4 pt-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--viva-primary)] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Détails de l'Événement & Calendrier Prévu</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Intitulé / Nom du Projet Événementiel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sommet Économique RDC 2026 / Lancement Produit / Mariage Prestige"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)] focus:bg-white transition-all"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Typologie de l'Événement *
                  </label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)] focus:bg-white cursor-pointer"
                  >
                    <option value="institutionnel">Sommet Institutionnel / Ministériel</option>
                    <option value="diplomatique">Conférence Diplomatique & Protocolaire</option>
                    <option value="entreprise">Convention d'Entreprise & Soirée Gala</option>
                    <option value="culturel">Festival, Concert & Événement Culturel</option>
                    <option value="foire_salon">Foire, Salon Professionnel & Exposition</option>
                    <option value="mariage_prestige">Mariage Prestige & Cérémonie Privée</option>
                    <option value="religieux">Convention ou Grand Rassemblement</option>
                    <option value="sportif">Événement Sportif & Tournoi</option>
                  </select>
                </div>

                {/* Date of Event */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Date Prévue du Jour J *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)] focus:bg-white"
                  />
                </div>
              </div>

              {/* Anticipation Indicator Pill */}
              {daysUntilEvent !== null && (
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    daysUntilEvent > 30
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : daysUntilEvent > 10
                      ? 'bg-blue-50 border-blue-200 text-[var(--viva-primary)]'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {daysUntilEvent > 0 ? (
                        <>
                          Délai avant le Jour J : <strong>{daysUntilEvent} jours</strong> ({daysUntilEvent > 30 ? 'Anticipation Idéale pour sécuriser tous les matériels' : 'Délai court - Traitement en priorité haute'})
                        </>
                      ) : (
                        'Événement prévu aujourd\'hui'
                      )}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
                    J - {daysUntilEvent}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Durée de l'Événement
                  </label>
                  <select
                    value={durationDays}
                    onChange={e => setDurationDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)] cursor-pointer"
                  >
                    <option value="1">1 Jour</option>
                    <option value="2">2 Jours</option>
                    <option value="3">3 Jours</option>
                    <option value="5">5 Jours (Semaine)</option>
                    <option value="7">1 Semaine ou plus</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Lieu & Ville Pressentis *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kinshasa - Fleuve Congo Hotel"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)]"
                  />
                </div>

                {/* Estimated Attendees */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span>Participants Estimés</span>
                    <span className="text-[var(--viva-primary)] font-bold font-mono text-[11px] normal-case bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Ex: 250</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 250"
                    value={attendeesInput}
                    onChange={e => setAttendeesInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)] focus:bg-white transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Ex: 250 participants (commencez par Ex:)</p>
                </div>
              </div>
            </div>

            {/* Section 2 : Les Pôles à Bloquer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--viva-primary)] flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>2. Pôles VIVA EVENTS à Mobiliser en Priorité</span>
                </h4>
                <span className="text-[11px] text-[var(--viva-text-muted)]">
                  {selectedPoles.length} sélectionné(s) sur {departments.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 sm:max-h-64 overflow-y-auto pr-1">
                {departments.map(dept => {
                  const isSelected = selectedPoles.includes(dept.id);
                  const isAudiovisuelCinema = dept.id === 13;
                  return (
                    <button
                      type="button"
                      key={dept.id}
                      onClick={() => togglePole(dept.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-[var(--viva-primary)] font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected ? 'bg-[var(--viva-primary)] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isSelected ? '✓' : (dept.number < 10 ? `0${dept.number}` : dept.number)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="truncate block font-medium">{dept.name}</span>
                        {isAudiovisuelCinema && (
                          <span className="text-[9px] text-[var(--viva-primary)] font-bold block">4K / Cinéma / Drones</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3 : Budget & Cahier des charges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>Budget Estimatif (USD)</span>
                  <span className="text-[var(--viva-primary)] font-bold font-mono text-[11px] normal-case bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Ex: 12 000 USD</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12 000 USD"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)] focus:bg-white transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">Ex: 12 000 USD (commencez par Ex:)</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Besoins Particuliers & Cahier des Charges
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cabines de traduction requises, direct live sur RTNC, groupes synchronisés..."
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)]"
                />
              </div>
            </div>

            {/* Section 4 : Coordonnées de l'Organisateur */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--viva-primary)] flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <span>3. Coordonnées de l'Organisateur / Client</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Nom du Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="Votre Nom"
                    value={organizerName}
                    onChange={e => setOrganizerName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[var(--viva-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Organisation</label>
                  <input
                    type="text"
                    placeholder="Société / Institution"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[var(--viva-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Téléphone WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+243 00 000 0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-900 outline-none focus:border-[var(--viva-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@domaine.cd"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-[var(--viva-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-2.5 rounded-full font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] text-white disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                <span>{isSubmitting ? 'Blocage de réservation...' : 'Transmettre & Réserver l\'Événement'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Success Screen */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-[var(--viva-primary)] uppercase tracking-widest">
                Réservation Enregistrée • Réf : {confirmedReservationCode}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Projet Transmis avec Succès !
              </h3>
              <p className="text-sm text-[var(--viva-text-muted)] max-w-lg mx-auto leading-relaxed">
                Votre projet <strong>« {eventName} »</strong> a été directement transmis à notre Direction Technique et Commerciale. Notre régie vous contactera sous 2 heures sur votre WhatsApp ({phone}) pour valider l'option sur le calendrier.
              </p>
            </div>

            {/* WhatsApp Direct Action Button */}
            <div className="pt-2 max-w-md mx-auto space-y-3">
              <a
                href={`https://wa.me/243963216780?text=${encodeURIComponent(`Bonjour VIVA EVENT SOLUTIONS, je viens de réserver mon événement "${eventName}" (Réf: ${confirmedReservationCode}) prévu le ${eventDate} à ${location}. Pouvez-vous me confirmer la disponibilité des matériels ?`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Notifier Immédiatement la Régie par WhatsApp (+243 963 216 780)</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Terminer / Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
