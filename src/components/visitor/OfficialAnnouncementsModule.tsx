import React, { useState } from 'react';
import {
  Megaphone,
  Briefcase,
  ShoppingBag,
  FileText,
  Paperclip,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  PlusCircle,
  DollarSign,
  User,
  Phone,
  Mail,
  Send,
  Search,
  Filter,
  Layers,
  GraduationCap,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Users
} from 'lucide-react';

export interface ProductServiceAnnouncement {
  id: string;
  type: 'Produit' | 'Service' | 'Recherche' | 'Événement';
  title: string;
  category: string;
  description: string;
  price: string;
  mediaName?: string;
  attachmentName?: string;
  location: string;
  availabilityDate: string;
  contact: string;
  durationDays: string;
  publishedAt: string;
}

export interface JobOffer {
  id: string;
  title: string;
  reference: string;
  department: string;
  sector: string;
  recruitmentType: string;
  contractType: string;
  workLocation: string;
  
  // Profil recherché
  vacanciesCount: string;
  studyLevel: string;
  educationField: string;
  requiredExperience: string;
  skills: string[];
  languages: string[];
  personalQualities: string[];

  // Conditions du poste
  salaryRange: string;
  workingHours: string;
  applicationStartDate: string;
  applicationEndDate: string;

  submissionsCount: number;
}

export const OfficialAnnouncementsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'recruitment'>('products');
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [showApplicationModal, setShowApplicationModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);

  // Annonces publiées : aucune ligne d'exemple. Une offre datée, chiffrée et
  // « disponible à partir du… » lue par un client ou un candidat engage
  // l'entreprise pour de faux.
  const [productAnnouncements, setProductAnnouncements] = useState<ProductServiceAnnouncement[]>([]);

  // Formulaire d'annonce Produit / Service
  const [productForm, setProductForm] = useState({
    type: 'Produit' as 'Produit' | 'Service' | 'Recherche' | 'Événement',
    title: '',
    category: 'Informatique & Technologie',
    description: '',
    price: '',
    mediaName: '',
    attachmentName: '',
    location: '',
    availabilityDate: '',
    contact: '',
    durationDays: '15 jours',
    acceptedTerms: false
  });
  const [productSubmitSuccess, setProductSubmitSuccess] = useState(false);

  // Offres d'emploi : aucune offre simulée (salaires, échéances, « 24
  // candidatures »). Publier un poste qui n'existe pas engage l'entreprise
  // vis-à-vis de vrais candidats.
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);

  // Formulaire de Candidature Recrutement
  const [applicationForm, setApplicationForm] = useState({
    candidateLastName: '', // Nom: Ex: BANZA
    candidatePostName: '', // Postnom: Ex: MWANABUTE
    candidateFirstName: '', // Prénom: Ex: Fortunat
    birthDate: '', // Ex: 15/04/1998
    phone: '', // Ex: +243 8XX XXX XXX
    email: '', // Ex: candidat@email.com
    residenceCity: 'Kinshasa', // Ex: Kinshasa
    cvFileName: '',
    motivationLetterFileName: '',
    diplomaFileName: '',
    otherDocumentsFileName: '',
    acceptedTerms: false
  });
  const [candidateSubmitSuccess, setCandidateSubmitSuccess] = useState(false);

  // Soumission d'annonce Produit / Service
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.description || !productForm.acceptedTerms) {
      alert('Veuillez remplir les champs obligatoires et accepter les conditions de publication.');
      return;
    }

    const newAd: ProductServiceAnnouncement = {
      id: `prod-${Date.now()}`,
      type: productForm.type,
      title: productForm.title,
      category: productForm.category,
      description: productForm.description,
      price: productForm.price || 'Sur demande',
      mediaName: productForm.mediaName || 'media_annonce.jpg',
      attachmentName: productForm.attachmentName || 'catalogue.pdf',
      location: productForm.location || 'Kinshasa',
      availabilityDate: productForm.availabilityDate || 'Disponible immédiatement',
      contact: productForm.contact || '+243 96 321 6780',
      durationDays: productForm.durationDays,
      publishedAt: 'Aujourd’hui'
    };

    setProductAnnouncements([newAd, ...productAnnouncements]);
    setProductSubmitSuccess(true);
    setTimeout(() => {
      setProductSubmitSuccess(false);
      setShowProductModal(false);
      setProductForm({
        type: 'Produit',
        title: '',
        category: 'Informatique & Technologie',
        description: '',
        price: '',
        mediaName: '',
        attachmentName: '',
        location: '',
        availabilityDate: '',
        contact: '',
        durationDays: '15 jours',
        acceptedTerms: false
      });
    }, 1800);
  };

  // Soumission Candidature Recrutement
  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationForm.candidateLastName || !applicationForm.candidateFirstName || !applicationForm.phone || !applicationForm.acceptedTerms) {
      alert('Veuillez renseigner vos informations obligatoires et accepter les conditions de candidature.');
      return;
    }

    if (selectedOffer) {
      setJobOffers(prev =>
        prev.map(offer =>
          offer.id === selectedOffer.id
            ? { ...offer, submissionsCount: offer.submissionsCount + 1 }
            : offer
        )
      );
    }

    setCandidateSubmitSuccess(true);
    setTimeout(() => {
      setCandidateSubmitSuccess(false);
      setShowApplicationModal(false);
      setApplicationForm({
        candidateLastName: '',
        candidatePostName: '',
        candidateFirstName: '',
        birthDate: '',
        phone: '',
        email: '',
        residenceCity: 'Kinshasa',
        cvFileName: '',
        motivationLetterFileName: '',
        diplomaFileName: '',
        otherDocumentsFileName: '',
        acceptedTerms: false
      });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* En-tête officiel du Guichet Annonces */}
      <div className="rounded-3xl bg-slate-950 p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800 space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Portail Officiel des Annonces & Notes VIVA Event
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Annonces et Notes Officielles
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Consultez et publiez des annonces vérifiées réparties en deux volets exclusifs : opportunités de produits & services événementiels, et offres de recrutement officiel en République Démocratique du Congo.
          </p>
        </div>

        {/* Sélecteur de Volet (I. Produit ou Service / II. Recrutement) */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Volet I : PRODUIT OU SERVICE</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/20">
              {productAnnouncements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recruitment')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'recruitment'
                ? 'bg-[var(--viva-primary)] text-white shadow-lg shadow-[var(--viva-card-shadow)] font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Volet II : RECRUTEMENT</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
              {jobOffers.length} offres
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VOLET I : PRODUIT OU SERVICE                              */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Volet I : Annonces Produits & Services
              </h2>
              <p className="text-xs text-slate-500">
                Matériel informatique, équipement audiovisuel, logistique et prestations professionnelles.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publier une Annonce</span>
            </button>
          </div>

          {/* Liste des annonces produits / services */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productAnnouncements.length === 0 && (
              <p className="md:col-span-3 py-10 text-center text-sm text-slate-500 italic">
                Aucune annonce publiée pour le moment.
              </p>
            )}
            {productAnnouncements.map(ad => (
              <div
                key={ad.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-[10px] uppercase tracking-wider">
                      {ad.type}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {ad.publishedAt}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[var(--viva-primary)] block uppercase tracking-wider">
                      {ad.category}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                      {ad.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ad.description}
                  </p>

                  {/* Prix / Tarif */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-600">Prix / Tarif</span>
                    <span className="text-base font-black text-emerald-600">{ad.price}</span>
                  </div>

                  {/* Média et pièce jointe */}
                  <div className="space-y-2 text-xs">
                    {ad.mediaName && (
                      <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Paperclip className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-[11px] truncate font-medium">Média : {ad.mediaName}</span>
                      </div>
                    )}
                    {ad.attachmentName && (
                      <div className="flex items-center gap-2 text-slate-700 bg-[var(--viva-muted-surface)] p-2 rounded-xl border border-[var(--viva-border)]">
                        <FileText className="w-3.5 h-3.5 text-[var(--viva-primary)] shrink-0" />
                        <span className="text-[11px] truncate font-medium text-[var(--viva-text-main)]">PDF : {ad.attachmentName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">{ad.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">Durée : {ad.durationDays}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 font-medium bg-amber-50/50 p-2 rounded-xl">
                    <span className="text-slate-600 block text-[10px]">Disponibilité :</span>
                    {ad.availabilityDate}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={`tel:${ad.contact.split('/')[0].trim()}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">{ad.contact}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL : PUBLIER UNE ANNONCE (PRODUIT OU SERVICE)          */}
      {/* ========================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  I
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Déposer une Annonce • Produit ou Service
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remplissez les détails selon la nomenclature officielle VIVA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {productSubmitSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-black text-slate-900">Annonce soumise avec succès !</h4>
                <p className="text-xs text-slate-500">
                  Votre annonce a été enregistrée et sera validée par la modération sous 24h.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Type d'annonce */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Type d’annonce *
                    </label>
                    <select
                      value={productForm.type}
                      onChange={e => setProductForm({ ...productForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900"
                    >
                      <option value="Produit">Produit</option>
                      <option value="Service">Service</option>
                      <option value="Recherche">Recherche</option>
                      <option value="Événement">Événement</option>
                    </select>
                  </div>

                  {/* Catégorie */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Catégorie *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : Informatique & Technologie"
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      required
                    />
                  </div>
                </div>

                {/* Titre de l'annonce */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Titre de l’annonce *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex. : Vente d’ordinateurs portables"
                    value={productForm.title}
                    onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex. : Ordinateurs portables professionnels disponibles à Kinshasa..."
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prix / Tarif */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Prix / Tarif (USD) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : 500 USD"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    />
                  </div>

                  {/* Localisation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      📍 Localisation *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : Kinshasa – Gombe"
                      value={productForm.location}
                      onChange={e => setProductForm({ ...productForm, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Média de l'annonce */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      📎 Média de l’annonce
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : Photo du produit, affiche..."
                      value={productForm.mediaName}
                      onChange={e => setProductForm({ ...productForm, mediaName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    />
                  </div>

                  {/* Pièce jointe */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Pièce jointe (PDF)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : Catalogue des produits en PDF"
                      value={productForm.attachmentName}
                      onChange={e => setProductForm({ ...productForm, attachmentName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Date / Disponibilité */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Date / Disponibilité
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : Dès le 20 sept 2026"
                      value={productForm.availabilityDate}
                      onChange={e => setProductForm({ ...productForm, availabilityDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    />
                  </div>

                  {/* Coordonnées */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Coordonnées / WhatsApp *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : +243 8XX XXX XXX"
                      value={productForm.contact}
                      onChange={e => setProductForm({ ...productForm, contact: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      required
                    />
                  </div>

                  {/* Durée de publication */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Durée de publication
                    </label>
                    <select
                      value={productForm.durationDays}
                      onChange={e => setProductForm({ ...productForm, durationDays: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900"
                    >
                      <option value="7 jours">7 jours</option>
                      <option value="15 jours">15 jours</option>
                      <option value="30 jours">30 jours</option>
                      <option value="60 jours">60 jours</option>
                    </select>
                  </div>
                </div>

                {/* Case à cocher : J'accepte les conditions */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={productForm.acceptedTerms}
                      onChange={e => setProductForm({ ...productForm, acceptedTerms: e.target.checked })}
                      className="w-4 h-4 rounded-sm border-slate-300 text-amber-500 focus:ring-amber-400 mt-0.5"
                    />
                    <span>
                      ☑️ <strong className="text-slate-900">J’accepte les conditions de publication</strong> et certifie la conformité de l’annonce aux normes de VIVA Event Solutions.
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    SOUMETTRE L’ANNONCE
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VOLET II : RECRUTEMENT                                    */}
      {/* ========================================================= */}
      {activeTab === 'recruitment' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Volet II : Recrutement & Appels à Candidatures
              </h2>
              <p className="text-xs text-slate-500">
                Offres d'emploi officielles pour les pôles d'ingénierie et services de VIVA Event Solutions.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-full bg-[var(--viva-muted-surface)] border border-[var(--viva-border)] text-[var(--viva-primary)] font-bold">
                {jobOffers.reduce((acc, curr) => acc + curr.submissionsCount, 0)} candidatures enregistrées
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {jobOffers.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500 italic">
                Aucun recrutement ouvert pour le moment.
              </p>
            )}
            {jobOffers.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all space-y-6"
              >
                {/* 1. PROFIL DU POSTE */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-[var(--viva-muted-surface)] border border-[var(--viva-border)] text-[var(--viva-primary)] font-mono font-bold text-xs">
                        Réf. {job.reference}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs">
                        {job.contractType}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs">
                        {job.recruitmentType}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{job.submissionsCount} candidatures reçues</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {job.title}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Département</span>
                      <span className="font-semibold text-slate-800">{job.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Secteur</span>
                      <span className="font-semibold text-slate-800">{job.sector}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Lieu de travail</span>
                      <span className="font-semibold text-slate-800">{job.workLocation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nombre de postes</span>
                      <span className="font-bold text-[var(--viva-primary)]">{job.vacanciesCount}</span>
                    </div>
                  </div>
                </div>

                {/* 2. PROFIL RECHERCHÉ */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎯</span> 2. Profil Recherché
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Niveau d'études</span>
                      <span className="font-bold text-slate-800">{job.studyLevel}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Domaine de formation</span>
                      <span className="font-semibold text-slate-800">{job.educationField}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Expérience requise</span>
                      <span className="font-bold text-emerald-700">{job.requiredExperience}</span>
                    </div>
                  </div>

                  {/* Compétences recherchées, langues, qualités */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">Compétences recherchées : </span>
                      <div className="inline-flex flex-wrap gap-1.5 mt-1">
                        {job.skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-slate-600 pt-1">
                      <div>
                        <span className="font-bold text-slate-700">Langues : </span>
                        <span>{job.languages.join(', ')}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Qualités personnelles : </span>
                        <span>{job.personalQualities.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. CONDITIONS DU POSTE */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💼</span> 3. Conditions du Poste
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[var(--viva-muted-surface)] p-4 rounded-2xl border border-[var(--viva-border)]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--viva-text-main)] block">Rémunération / Salaire</span>
                      <span className="font-black text-[var(--viva-primary)] text-sm">{job.salaryRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--viva-text-main)] block">Horaires de travail</span>
                      <span className="font-semibold text-slate-800">{job.workingHours}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--viva-text-main)] block">Début dépôt</span>
                      <span className="font-semibold text-slate-800">{job.applicationStartDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--viva-text-main)] block">Clôture dépôt</span>
                      <span className="font-bold text-rose-600">{job.applicationEndDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bouton d'action pour postuler */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Nombre de candidatures soumises à ce jour : <strong className="text-slate-900">{job.submissionsCount}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOffer(job);
                      setShowApplicationModal(true);
                    }}
                    className="px-6 py-3 rounded-xl bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[var(--viva-card-shadow)] cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>SOUMETTRE MA CANDIDATURE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL : FORMULAIRE DE CANDIDATURE (SECTIONS 4 & 5)        */}
      {/* ========================================================= */}
      {showApplicationModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[var(--viva-primary)] bg-[var(--viva-muted-surface)] px-2 py-0.5 rounded-md">
                  Réf. {selectedOffer.reference}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Candidature : {selectedOffer.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplicationModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {candidateSubmitSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-black text-slate-900">Candidature transmise avec succès !</h4>
                <p className="text-xs text-slate-500">
                  Votre dossier a été enregistré sous la référence {selectedOffer.reference}. Notre direction des ressources humaines vous contactera pour les prochaines étapes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCandidateSubmit} className="space-y-6">
                {/* 5. INFORMATIONS DU CANDIDAT */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span>👤</span> 5. Informations du Candidat
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Nom * (Ex: BANZA)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: BANZA"
                        value={applicationForm.candidateLastName}
                        onChange={e => setApplicationForm({ ...applicationForm, candidateLastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Postnom (Ex: MWANABUTE)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: MWANABUTE"
                        value={applicationForm.candidatePostName}
                        onChange={e => setApplicationForm({ ...applicationForm, candidatePostName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Prénom * (Ex: Fortunat)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Fortunat"
                        value={applicationForm.candidateFirstName}
                        onChange={e => setApplicationForm({ ...applicationForm, candidateFirstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Date de naissance (Ex: 15/04/1998)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 15/04/1998"
                        value={applicationForm.birthDate}
                        onChange={e => setApplicationForm({ ...applicationForm, birthDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Téléphone / WhatsApp * (Ex: +243 8XX XXX XXX)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: +243 81 000 0000"
                        value={applicationForm.phone}
                        onChange={e => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        E-mail * (Ex: candidat@email.com)
                      </label>
                      <input
                        type="email"
                        placeholder="Ex: candidat@email.com"
                        value={applicationForm.email}
                        onChange={e => setApplicationForm({ ...applicationForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Ville de résidence (Ex: Kinshasa)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Kinshasa"
                        value={applicationForm.residenceCity}
                        onChange={e => setApplicationForm({ ...applicationForm, residenceCity: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. DOCUMENTS À FOURNIR */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span>📎</span> 4. Documents à Fournir
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        CV (PDF / DOCX) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: CV_Jean_Mukendi.pdf"
                        value={applicationForm.cvFileName}
                        onChange={e => setApplicationForm({ ...applicationForm, cvFileName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Lettre de motivation (PDF)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Lettre_Motivation.pdf"
                        value={applicationForm.motivationLetterFileName}
                        onChange={e => setApplicationForm({ ...applicationForm, motivationLetterFileName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Diplômes / Certificats (PDF)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Diplome_Licence.pdf"
                        value={applicationForm.diplomaFileName}
                        onChange={e => setApplicationForm({ ...applicationForm, diplomaFileName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Autres documents
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Certificat de formation en marketing"
                        value={applicationForm.otherDocumentsFileName}
                        onChange={e => setApplicationForm({ ...applicationForm, otherDocumentsFileName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Case à cocher : J'accepte les conditions */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={applicationForm.acceptedTerms}
                      onChange={e => setApplicationForm({ ...applicationForm, acceptedTerms: e.target.checked })}
                      className="w-4 h-4 rounded-sm border-slate-300 text-[var(--viva-primary)] focus:ring-[var(--viva-primary)] mt-0.5"
                    />
                    <span>
                      ☑️ <strong className="text-slate-900">J’accepte les conditions de candidature</strong> et autorise VIVA Event Solutions à traiter mes données dans le cadre de ce recrutement.
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[var(--viva-card-shadow)] cursor-pointer transition-all"
                  >
                    SOUMETTRE MA CANDIDATURE
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
