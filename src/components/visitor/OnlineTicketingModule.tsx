import React, { useState } from 'react';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  QrCode, 
  Download, 
  RefreshCw, 
  ArrowRight,
  DollarSign
} from 'lucide-react';

interface TicketCategory {
  id: string;
  name: string;
  badge: string;
  priceUSD: number;
  priceCDF: number;
  description: string;
  color: string;
  availableCount: number;
}

interface EventInfo {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
}

const OFFICIAL_EVENTS: EventInfo[] = [
  {
    id: 'evt-01',
    name: 'Sommet Économique & Technologique RDC 2026',
    subtitle: 'Grandes Tendances de l’Ingénierie & Numérique en Afrique Centrale',
    date: '28 Octobre 2026',
    time: '09:00 - 18:00',
    location: 'Hôtel Pullman Grand Karavia / Fleuve Congo Hotel, Kinshasa',
    organizer: 'VIVA EVENT SOLUTIONS & Partenaires'
  },
  {
    id: 'evt-02',
    name: 'Gala Prestige & Concert Symphonique VIVA',
    subtitle: 'Célébration des 15 Pôles d’Excellence & Prestation Live',
    date: '15 Novembre 2026',
    time: '18:30 - 23:30',
    location: 'Salle de Congrès Internationale, Gombe, Kinshasa',
    organizer: 'VIVA ENTERTAINMENT'
  },
  {
    id: 'evt-03',
    name: 'Forum des Investisseurs & B2B Matchmaking',
    subtitle: 'Opportunités d’Affaires et Infrastructures Modernes',
    date: '02 Décembre 2026',
    time: '08:30 - 17:00',
    location: 'Centre Financier de Kinshasa (CFK)',
    organizer: 'VIVA GROUPE RDC'
  }
];

const TICKET_CATEGORIES: TicketCategory[] = [
  {
    id: 'cat-standard',
    name: 'STANDARD',
    badge: 'Accès Salle',
    priceUSD: 50,
    priceCDF: 140000,
    description: 'Accès aux conférences plénières et documentation numérique.',
    color: 'from-slate-700 to-slate-900',
    availableCount: 300
  },
  {
    id: 'cat-premium',
    name: 'PREMIUM',
    badge: 'Avantage',
    priceUSD: 120,
    priceCDF: 335000,
    description: 'Places réservées et accès aux zones de networking dédiées.',
    color: 'from-blue-600 to-indigo-800',
    availableCount: 150
  },
  {
    id: 'cat-vip',
    name: 'VIP',
    badge: 'Exclusif',
    priceUSD: 250,
    priceCDF: 700000,
    description: 'Placement au parterre, premier rang et cocktail de clôture exclusif.',
    color: 'from-amber-600 to-yellow-700',
    availableCount: 75
  },
  {
    id: 'cat-vvip',
    name: 'VVIP',
    badge: 'Prestige Royal',
    priceUSD: 500,
    priceCDF: 1400000,
    description: 'Accès illimité salon privé, dîner de gala avec les personnalités et service butler dédié.',
    color: 'from-purple-600 to-slate-950',
    availableCount: 25
  }
];

export const OnlineTicketingModule: React.FC = () => {
  // Selected Event & Category
  const [selectedEvent, setSelectedEvent] = useState<EventInfo>(OFFICIAL_EVENTS[0]);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>(TICKET_CATEGORIES[0]);
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'CDF'>('USD');
  const [quantity, setQuantity] = useState<number>(1);

  // Client Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card' | 'bank_transfer' | 'cash'>('mobile_money');
  const [mobileOperator, setMobileOperator] = useState<'mpesa' | 'orange' | 'airtel'>('mpesa');

  // Confirmation State
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cancellation Policy Modal
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  const unitPrice = currencyMode === 'USD' ? selectedCategory.priceUSD : selectedCategory.priceCDF;
  const currencySymbol = currencyMode === 'USD' ? 'USD ($)' : 'CDF (FC)';
  const totalAmount = unitPrice * quantity;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim()) {
      setValidationError("Veuillez renseigner tous les champs obligatoires du client (Nom, Téléphone, Email).");
      return;
    }
    setValidationError(null);
    const ref = `VIVA-TICK-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderReference(ref);
    setIsConfirmed(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setIsConfirmed(false);
    setOrderReference(null);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setQuantity(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Official Ticketing Header Banner Matching User Request */}
      <div className="rounded-3xl bg-slate-950 p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800 space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4A6CF7]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-pulse"></span>
          Guichet Officiel de Billetterie Événementielle VIVA
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Réservation en Ligne & Billetterie Sécurisée
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Sélectionnez votre événement, choisissez votre catégorie de billet (Standard, Premium, VIP, VVIP) et réservez instantanément avec confirmation garantie.
          </p>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Paiement Mobile Money & Carte</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>E-Billet avec QR Code</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCancellationModal(true)}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors underline cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Conditions & Politique d'Annulation</span>
          </button>
        </div>
      </div>

      {!isConfirmed ? (
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Categories, Event & Client Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Ticket Categories */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#4A6CF7] flex items-center justify-center font-bold text-sm">1</div>
                  <h3 className="text-base font-bold text-slate-900">Catégorie de Billet & Quantité</h3>
                </div>

                {/* Currency Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('USD')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      currencyMode === 'USD' ? 'bg-[#4A6CF7] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('CDF')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      currencyMode === 'CDF' ? 'bg-[#4A6CF7] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    CDF (FC)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TICKET_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory.id === cat.id;
                  const price = currencyMode === 'USD' ? cat.priceUSD : cat.priceCDF;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'border-[#4A6CF7] bg-blue-50/40 shadow-md ring-2 ring-[#4A6CF7]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-base font-black text-slate-900 tracking-tight">{cat.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 whitespace-nowrap">
                            {cat.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Prix</span>
                          <span className="text-base font-black text-[#4A6CF7]">
                            {price.toLocaleString()} {currencyMode === 'USD' ? '$' : 'FC'}
                          </span>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#4A6CF7] bg-[#4A6CF7] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Selector */}
              <div className="pt-2 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Quantité de Billets</span>
                  <span className="text-[11px] text-slate-500">Nombre de places à réserver</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-black text-base text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Select Event */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#4A6CF7] flex items-center justify-center font-bold text-sm">2</div>
                  <h3 className="text-base font-bold text-slate-900">Sélectionnez l'Événement</h3>
                </div>
                <span className="text-xs text-slate-500">{OFFICIAL_EVENTS.length} événements programmés</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {OFFICIAL_EVENTS.map(evt => {
                  const isSelected = selectedEvent.id === evt.id;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-[#4A6CF7] bg-blue-50/40 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {evt.organizer}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{evt.name}</h4>
                        <p className="text-xs text-slate-500">{evt.subtitle}</p>
                        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#4A6CF7]" /> {evt.date}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#4A6CF7]" /> {evt.time}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#4A6CF7]" /> {evt.location}</span>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#4A6CF7] bg-[#4A6CF7] text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Client Information */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#4A6CF7] flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="text-base font-bold text-slate-900">Informations du Client / Acheteur</h3>
              </div>

              {validationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Nom Complet *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: Malthus Kilumba"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Téléphone (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="+243 81 000 0000"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Adresse Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="client@domaine.cd"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4A6CF7]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Payment Method */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#4A6CF7] flex items-center justify-center font-bold text-sm">4</div>
                <h3 className="text-base font-bold text-slate-900">Mode de Paiement & Règlement</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setPaymentMethod('mobile_money')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2 ${
                    paymentMethod === 'mobile_money' ? 'border-[#4A6CF7] bg-blue-50/50 shadow-md' : 'border-slate-200 bg-white'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-[#4A6CF7]" />
                  <span className="text-xs font-bold text-slate-900">Mobile Money</span>
                  <span className="text-[10px] text-slate-500">M-Pesa, Orange, Airtel</span>
                </div>

                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2 ${
                    paymentMethod === 'card' ? 'border-[#4A6CF7] bg-blue-50/50 shadow-md' : 'border-slate-200 bg-white'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-[#4A6CF7]" />
                  <span className="text-xs font-bold text-slate-900">Carte Bancaire</span>
                  <span className="text-[10px] text-slate-500">Visa / Mastercard</span>
                </div>

                <div
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2 ${
                    paymentMethod === 'bank_transfer' ? 'border-[#4A6CF7] bg-blue-50/50 shadow-md' : 'border-slate-200 bg-white'
                  }`}
                >
                  <Building2 className="w-6 h-6 text-[#4A6CF7]" />
                  <span className="text-xs font-bold text-slate-900">Virement Bancaire</span>
                  <span className="text-[10px] text-slate-500">RAWBANK / EquityBCDC</span>
                </div>

                <div
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2 ${
                    paymentMethod === 'cash' ? 'border-[#4A6CF7] bg-blue-50/50 shadow-md' : 'border-slate-200 bg-white'
                  }`}
                >
                  <DollarSign className="w-6 h-6 text-[#4A6CF7]" />
                  <span className="text-xs font-bold text-slate-900">Paiement au Guichet</span>
                  <span className="text-[10px] text-slate-500">Bureau VIVA Kinshasa</span>
                </div>
              </div>

              {paymentMethod === 'mobile_money' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">Sélectionnez l'opérateur Mobile Money :</span>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileOperator('mpesa')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mobileOperator === 'mpesa' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Vodacom M-Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileOperator('orange')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mobileOperator === 'orange' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Orange Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileOperator('airtel')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mobileOperator === 'airtel' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Airtel Money
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Order Summary & Checkout Button */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-6 sticky top-24">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
                Récapitulatif de la Commande
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">Événement</span>
                  <p className="font-bold text-slate-900">{selectedEvent.name}</p>
                  <p className="text-slate-500">{selectedEvent.date} • {selectedEvent.location}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Catégorie :</span>
                  <span className="font-bold text-slate-900">{selectedCategory.name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Prix unitaire :</span>
                  <span className="font-bold text-slate-900">{unitPrice.toLocaleString()} {currencySymbol}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Quantité :</span>
                  <span className="font-bold text-slate-900">{quantity} billet(s)</span>
                </div>

                <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total à Régler :</span>
                  <span className="text-lg font-black text-[#4A6CF7]">{totalAmount.toLocaleString()} {currencySymbol}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-[#4A6CF7] hover:bg-[#3A5BD9] text-white text-sm font-bold shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Confirmer et Payer</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                En confirmant, vous acceptez les conditions générales de vente et la politique d'annulation VIVA Event Solutions.
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Order Confirmation Success View */
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-2xl space-y-8 animate-fadeIn text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Commande Confirmée & Validée
            </span>
            <h2 className="text-2xl font-black text-slate-900">Merci pour votre réservation, {clientName} !</h2>
            <p className="text-sm text-slate-600">
              Votre e-billet sécurisé a été généré avec succès. Une copie de confirmation a été envoyée à <strong className="text-slate-900">{clientEmail}</strong>.
            </p>
          </div>

          {/* Ticket E-Card */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white text-left shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">E-Billet Officiel VIVA</span>
                <h4 className="text-lg font-black">{selectedEvent.name}</h4>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-xl text-xs font-mono font-bold text-white border border-white/20">
                {orderReference}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-white/60 block">Titulaire</span>
                <strong className="text-white text-sm">{clientName}</strong>
              </div>
              <div>
                <span className="text-white/60 block">Téléphone / Contact</span>
                <strong className="text-white text-sm">{clientPhone}</strong>
              </div>
              <div>
                <span className="text-white/60 block">Catégorie</span>
                <strong className="text-amber-300 text-sm">{selectedCategory.name} ({quantity} pl.)</strong>
              </div>
              <div>
                <span className="text-white/60 block">Date & Lieu</span>
                <strong className="text-white">{selectedEvent.date}</strong>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-900 font-bold">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="text-[11px] text-white/80">
                  <span>Présentez ce QR code à l'entrée</span>
                  <span className="block font-bold text-amber-400">Montant réglé : {totalAmount.toLocaleString()} {currencySymbol}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Payé & Validé
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => alert("Téléchargement du e-billet PDF en cours...")}
              className="px-6 py-3.5 rounded-2xl bg-[#4A6CF7] hover:bg-[#3A5BD9] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger mon e-Billet (PDF)</span>
            </button>

            <button
              onClick={handleReset}
              className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réserver une autre place</span>
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Policy Modal */}
      {showCancellationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-2xl w-full rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Conditions & Pénalités d'Annulation</h3>
              </div>
              <button
                onClick={() => setShowCancellationModal(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-1">
                <h4 className="font-bold text-blue-900">1. Annulation jusqu'à 7 jours avant l'événement</h4>
                <p className="text-blue-700">Remboursement intégral à 100% sans aucun frais ni pénalité.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <h4 className="font-bold text-amber-900">2. Annulation entre 7 jours et 48 heures avant</h4>
                <p className="text-amber-700">Pénalité de frais administratifs de 15%. Remboursement de 85% du montant réglé ou report gratuit sur un prochain événement VIVA.</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 space-y-1">
                <h4 className="font-bold text-rose-900">3. Moins de 48 heures ou non-présentation (No-Show)</h4>
                <p className="text-rose-700">Billet non remboursable. Toutefois, le billet est <strong>totalement transférable</strong> à une tierce personne sur simple notification écrite par email ou WhatsApp jusqu'à 12h avant l'ouverture des portes.</p>
              </div>
            </div>

            <button
              onClick={() => setShowCancellationModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
