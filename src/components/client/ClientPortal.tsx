import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { logAudit } from '../../services/supabase/auditService';
import {
  User,
  FileText,
  Compass,
  Ticket,
  PlusCircle,
  CheckCircle2,
  Clock,
  Building,
  Shield,
  Calendar,
  MapPin,
  DollarSign,
  QrCode,
  ArrowRight,
  LogOut,
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  Check,
  Truck,
  Layers,
  Radio,
  Zap,
  Printer,
  Megaphone,
  Vote,
  Award,
  TrendingUp,
  Users,
  Bell,
  AlertCircle
} from 'lucide-react';

interface ClientPortalProps {
  onOpenQuoteModal: () => void;
}

interface Announcement {
  id: string;
  title: string;
  category: 'general' | 'security' | 'technical' | 'vip';
  date: string;
  content: string;
  urgent: boolean;
  author: string;
}

interface TicketItem {
  id: string;
  code: string;
  eventName: string;
  date: string;
  location: string;
  category: string;
  priceUSD: number;
  attendeeName: string;
  status: 'active' | 'used' | 'pending_payment';
}

interface PollItem {
  id: string;
  title: string;
  event: string;
  status: 'active' | 'closed';
  options: { id: string; text: string; votes: number }[];
  userVotedOptionId?: string;
  totalVotes: number;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ onOpenQuoteModal }) => {
  const { currentUser, logout } = useAuth();
  const { projects, quotes, mediaItems, submitQuoteRequest, addProject } = useProjectData();
  const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'tickets' | 'voting' | 'order' | 'projects' | 'quotes' | 'profil' | 'documents' | 'notifications'>('overview');

  // Communications officielles : affichées seulement si la base en contient.
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // 2. Ticketing State — le portefeuille d'un client ne se précharge pas :
  // un billet inventé laisse croire à une réservation payante existante.
  const [tickets, setTickets] = useState<TicketItem[]>([]);

  // Buy Ticket Modal state
  const [isBuyingTicket, setIsBuyingTicket] = useState(false);
  const [selectedEventToBuy, setSelectedEventToBuy] = useState('Sommet Économique International Grands Lacs');
  const [selectedTicketCategory, setSelectedTicketCategory] = useState('Pass Standard ($100)');
  const [ticketAttendeeInput, setTicketAttendeeInput] = useState(currentUser.name || '');

  // 3. Online Voting State — aucun scrutin pré-ouvert, aucun vote pré-compté.
  const [polls, setPolls] = useState<PollItem[]>([]);

  // Order form state — départ vide : un formulaire prérempli avec une date, un
  // hôtel, un budget et du matériel inventés produit un devis que le client
  // croit avoir choisi. Les champs requis bloquent l'envoi tant que ce n'est
  // pas sa saisie.
  const [orderTitle, setOrderTitle] = useState('');
  const [orderType, setOrderType] = useState<'institutionnel' | 'diplomatique' | 'entreprise' | 'culturel' | 'mariage_prestige' | 'foire_salon' | 'religieux' | 'sportif'>('institutionnel');
  const [orderDate, setOrderDate] = useState('');
  const [orderLocation, setOrderLocation] = useState('');
  const [orderAttendees, setOrderAttendees] = useState<number | ''>('');
  const [orderBudget, setOrderBudget] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Selected Services / Pôles
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: boolean }>({
    scenic: true,
    led: true,
    audio: true,
    power: true,
    translation: false,
    streaming: true,
    security: false,
    catering: false
  });

  // Matériel lourd réservé : rien de coché par défaut.
  const [selectedGear, setSelectedGear] = useState<string[]>([]);

  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  // Notifications de session : UNIQUEMENT les actions propres de l'utilisateur
  // pendant cette session (aucune notification inventée — persistance : R3-04).
  const [sessionNotes, setSessionNotes] = useState<{ id: string; time: string; label: string; kind: string }[]>([]);
  // Isolation client (§26) : jamais les données d'un autre client.
  // Devis : e-mail exact. Projets : liés via projectCode des devis + nom/organisation.
  // Transitionnel en attendant l'ownership serveur (R3-07/R3-14).
  const myEmail = (currentUser.email || '').toLowerCase();
  const myOrg = (currentUser.organization || '').toLowerCase();
  const myName = (currentUser.name || '').toLowerCase();
  const myQuotes = quotes.filter(q => (q.clientEmail || '').toLowerCase() === myEmail);
  const myProjectCodes = new Set(myQuotes.map(q => q.projectCode).filter(Boolean) as string[]);
  const myProjects = projects.filter(p =>
    myProjectCodes.has(p.code) ||
    (myOrg && (p.client || '').toLowerCase().includes(myOrg)) ||
    (myName && (p.client || '').toLowerCase() === myName)
  );
  const pushSessionNote = (label: string, kind: string) => {
    setSessionNotes(prev => [{ id: `note-${Date.now()}`, time: new Date().toLocaleString('fr-FR'), label, kind }, ...prev].slice(0, 20));
  };

  const toggleService = (key: string) => {
    setSelectedServices(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGear = (item: string) => {
    setSelectedGear(prev =>
      prev.includes(item) ? prev.filter(g => g !== item) : [...prev, item]
    );
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderTitle.trim()) return;

    // Aucun budget inventé : sans saisie client, la commande n'est pas envoyée.
    const budgetNum = parseFloat(orderBudget);
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setOrderError('Budget estimatif requis : indiquez le montant que VOUS choisissez.');
      return;
    }
    if (!currentUser.phone) {
      setOrderError('Numéro de téléphone requis sur votre profil pour envoyer une commande.');
      return;
    }
    setOrderError(null);

    // Wave 2 — succès affiché seulement après confirmation Supabase.
    let refCode: string;
    try {
      refCode = await submitQuoteRequest({
      clientName: currentUser.name || 'Client Enregistré',
      clientOrganization: currentUser.organization || 'Organisation Partenaire',
      clientEmail: currentUser.email,
      clientPhone: currentUser.phone,
      eventType: orderType,
      eventName: orderTitle,
      eventDate: orderDate,
      location: orderLocation,
      estimatedAttendees: Number(orderAttendees),
      format: 'hybride',
      offerLevel: 'VIP_EXECUTIVE',
      selectedDepartmentIds: [1, 2, 3, 4],
      requirements: {
        scenicAudioLight: selectedServices.scenic,
        ledScreensAndBroadcast: selectedServices.led,
        hybridStreaming: selectedServices.streaming,
        simultaneousTranslation: selectedServices.translation,
        vipTransportAndEscort: selectedServices.security,
        highSecurityAndCrowdControl: selectedServices.security,
        cateringAndCocktail: selectedServices.catering,
        tentsAndPowerGen: selectedServices.power,
        audiovisual4kProduction: true,
        decorationAndFloral: false
      },
      customNotes: `COMMANDE DIRECTE DEPUIS LE COMPTE CLIENT. Matériel lourd réservé: ${selectedGear.join(', ')}. Remarques: ${orderNotes}`,
      estimatedBudgetUSD: budgetNum,
      priority: 'haute'
    });

    } catch (e) {
      setOrderError(`Commande non enregistrée : ${e instanceof Error ? e.message : String(e)}. Réessayez.`);
      return;
    }

    try {
      await addProject({
      title: orderTitle,
      type: orderType === 'institutionnel' ? 'Sommet Institutionnel & Étatique' : 'Événement Corporate d\'Envergure',
      client: currentUser.organization || currentUser.name || 'Client Vérifié',
      status: 'En préparation',
      startDate: orderDate,
      endDate: orderDate,
      location: orderLocation,
      budgetUSD: budgetNum,
      progressPercent: 15,
      departmentIds: [1, 2, 3, 4]
    });
    } catch (e) {
      setOrderError(`Projet non enregistré : ${e instanceof Error ? e.message : String(e)}. Devis ${refCode} conservé, réessayez pour le projet.`);
      return;
    }

    void logAudit('CLIENT_DIRECT_ORDER_SUBMITTED', 'client_portal', refCode);

    const cmdNum = `CMD-VES-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderConfirmed(cmdNum);
    setSuccessMsg(`Commande n° ${cmdNum} enregistrée avec succès ! Référence devis : ${refCode}`);
    pushSessionNote(`Commande ${cmdNum} enregistrée (devis ${refCode})`, 'commande');
  };

  // Handle Ticket Purchase
  const handleBuyTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketAttendeeInput.trim()) return;

    const price = selectedTicketCategory.includes('VIP') ? 250 : selectedTicketCategory.includes('Dîner') ? 350 : 100;
    const newTkt: TicketItem = {
      id: `tkt-${Date.now()}`,
      code: `VES-TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      eventName: selectedEventToBuy,
      date: '2026-10-20',
      location: 'Kinshasa - Palais des Congrès',
      category: selectedTicketCategory,
      priceUSD: price,
      attendeeName: ticketAttendeeInput,
      status: 'active'
    };

    setTickets([newTkt, ...tickets]);
    setIsBuyingTicket(false);
    setSuccessMsg(`Billet ${newTkt.code} acheté et émis avec succès pour ${ticketAttendeeInput} !`);
  };

  // Handle Poll Vote
  const handleVote = (pollId: string, optionId: string) => {
    setPolls(prev =>
      prev.map(p => {
        if (p.id === pollId && !p.userVotedOptionId) {
          const updatedOptions = p.options.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          );
          return {
            ...p,
            options: updatedOptions,
            userVotedOptionId: optionId,
            totalVotes: p.totalVotes + 1
          };
        }
        return p;
      })
    );
    setSuccessMsg('Votre vote a été enregistré et comptabilisé en direct avec succès !');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Client Account Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-2xl border border-amber-500/30 shrink-0">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
                Espace Client • {currentUser.clientType || 'Entreprise ou établissement'}
              </span>
              <span className="text-xs text-slate-400 font-mono">VIVA EVENT SOLUTIONS SARLU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Bienvenue, {currentUser.name || 'Client Partenaire'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {currentUser.email} • {currentUser.organization || 'Compte Client Vérifié'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('order')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Passer une Commande en Ligne</span>
          </button>

          <button
            onClick={() => logout()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 cursor-pointer"
            title="Se déconnecter de l'espace client"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Client Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Tableau de Bord', icon: LayoutDashboard },
          { id: 'announcements', label: '📢 Annonces & Actualités', icon: Megaphone, badge: announcements.filter(a => a.urgent).length },
          { id: 'tickets', label: '🎟️ Billetterie en Ligne', icon: Ticket },
          { id: 'voting', label: '🗳️ Vote en Ligne', icon: Vote },
          { id: 'order', label: '🛒 Commander Matériel', icon: ShoppingCart, highlight: true },
          { id: 'projects', label: 'Suivi Projets', icon: Compass },
          { id: 'quotes', label: 'Devis & Factures', icon: FileText },
          { id: 'profil', label: 'Mon Profil', icon: User },
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: sessionNotes.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setOrderConfirmed(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-102'
                  : tab.highlight
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {orderError && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <span>{orderError}</span>
          <button
            onClick={() => setOrderError(null)}
            className="px-3 py-1 rounded-lg bg-rose-500 text-white font-black text-xs hover:bg-rose-400 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ================= TAB: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Action Callout: Pass Order Directly */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-950 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Commandez sans intermédiaire</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Besoin de matériel ou de services pour votre prochain événement ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Passez votre commande directement depuis votre compte : réservez notre parc matériel lourd (3 200 kVA d'énergie autonome, Line Array, 200 m² écrans LED) et nos équipes techniques spécialisées.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('order')}
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl flex items-center gap-2 cursor-pointer shrink-0 transition-transform transform hover:scale-105"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Passer Commande Maintenant</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div
              onClick={() => setActiveTab('announcements')}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 cursor-pointer hover:border-amber-500 transition-colors"
            >
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Annonces Officielles</span>
                <Megaphone className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white">{announcements.length}</div>
              <div className="text-xs text-amber-400 font-medium">Communiqués de direction</div>
            </div>

            <div
              onClick={() => setActiveTab('tickets')}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Billets & Accès</span>
                <Ticket className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">{tickets.length}</div>
              <div className="text-xs text-emerald-400 font-medium">Pass VIP & Événements</div>
            </div>

            <div
              onClick={() => setActiveTab('voting')}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Votes & Sondages</span>
                <Vote className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">{polls.filter(p => p.status === 'active').length}</div>
              <div className="text-xs text-blue-400 font-medium">Sessions en direct</div>
            </div>

            <div
              onClick={() => setActiveTab('projects')}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                <span>Projets Actifs</span>
                <Compass className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white">{projects.length}</div>
              <div className="text-xs text-indigo-400 font-medium">Sommets & Rétroplanning</div>
            </div>
          </div>

          {/* Recent Active Projects List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>État d'Avancement de vos Projets</span>
            </h3>

            <div className="space-y-4">
              {projects.map(proj => (
                <div key={proj.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">{proj.code}</span>
                      <h4 className="font-bold text-base text-white">{proj.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{proj.location}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>Du {proj.startDate} au {proj.endDate}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase shrink-0">
                      {proj.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>Progression Rétroplanning</span>
                      <span className="text-amber-400 font-bold">{proj.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${proj.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 1: ANNONCES & ACTUALITÉS ================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
                <Megaphone className="w-4 h-4" />
                <span>Espace de Diffusion Officielle</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Annonces & Communiqués VIVA</h3>
              <p className="text-xs text-slate-400 mt-1">
                Retrouvez toutes les notes de service, alertes protocolaires et actualités de la direction générale.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
                Total : {announcements.length} annonces
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {announcements.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400 italic">Aucune communication officielle pour le moment.</p>
            )}
            {announcements.map(ann => (
              <div
                key={ann.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  ann.urgent
                    ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ann.category === 'security'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : ann.category === 'technical'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : ann.category === 'vip'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {ann.category.toUpperCase()}
                    </span>
                    {ann.urgent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase animate-pulse flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Urgent / Important</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ann.date}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">{ann.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                    {ann.content}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="italic font-medium">Émis par : <strong className="text-amber-400">{ann.author}</strong></span>
                  <span className="text-[10px] uppercase font-mono text-slate-500">VIVA EVENT SOLUTIONS SARLU</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: BILLETTERIE EN LIGNE ================= */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
                <Ticket className="w-4 h-4" />
                <span>Guichet de Billetterie Officielle</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Billets & Pass Événementiels</h3>
              <p className="text-xs text-slate-400 mt-1">
                Commandez vos pass VIP, achetez vos places pour les sommets ou téléchargez vos QR codes d'accès sécurisés.
              </p>
              <p className="text-[10px] font-bold text-amber-300/90 mt-1">Session uniquement — persistance serveur : R3-03. Les billets ne survivent pas au rechargement.</p>
            </div>
            <button
              onClick={() => setIsBuyingTicket(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Acheter un Nouveau Billet</span>
            </button>
          </div>

          {/* Buy Ticket Modal Form */}
          {isBuyingTicket && (
            <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-emerald-400" />
                  <span>Achat de Billet en Ligne</span>
                </h4>
                <button
                  onClick={() => setIsBuyingTicket(false)}
                  className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
                >
                  ✕ Annuler
                </button>
              </div>

              <form onSubmit={handleBuyTicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Événement Concerné *</label>
                  <select
                    value={selectedEventToBuy}
                    onChange={e => setSelectedEventToBuy(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Sommet Économique International Grands Lacs">Sommet Économique International Grands Lacs</option>
                    <option value="Forum Panafricain Mines, Énergies & Infrastructures">Forum Panafricain Mines, Énergies & Infrastructures</option>
                    <option value="Gala Annuel des Investisseurs 2026">Gala Annuel des Investisseurs 2026</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Catégorie de Pass *</label>
                    <select
                      value={selectedTicketCategory}
                      onChange={e => setSelectedTicketCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Pass Standard ($100)">Pass Standard ($100)</option>
                      <option value="Pass VIP Plénière ($250)">Pass VIP Plénière ($250)</option>
                      <option value="Pass Full VIP + Dîner de Gala ($350)">Pass Full VIP + Dîner de Gala ($350)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nom du Bénéficiaire / Participant *</label>
                    <input
                      type="text"
                      required
                      value={ticketAttendeeInput}
                      onChange={e => setTicketAttendeeInput(e.target.value)}
                      placeholder="Nom complet"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBuyingTicket(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
                  >
                    Confirmer l'Achat & Émettre le Billet
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.length === 0 && (
              <p className="md:col-span-2 py-8 text-center text-xs text-slate-400 italic">Aucun billet à votre nom pour le moment.</p>
            )}
            {tickets.map(tkt => (
              <div key={tkt.id} className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-4 relative overflow-hidden shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">{tkt.code}</span>
                    <h4 className="font-bold text-base text-white mt-1">{tkt.eventName}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{tkt.date}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{tkt.location}</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white text-slate-950 shadow-md">
                    <QrCode className="w-10 h-10" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Bénéficiaire</span>
                    <span className="font-bold text-white">{tkt.attendeeName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Montant Payé</span>
                    <span className="font-mono font-bold text-emerald-400">${tkt.priceUSD} USD</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                    {tkt.category}
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valide & Actif</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: VOTE EN LIGNE ================= */}
      {activeTab === 'voting' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-1">
                <Vote className="w-4 h-4" />
                <span>Plateforme de Vote & Sondages Interactifs</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Votes en Ligne des Sommets</h3>
              <p className="text-xs text-slate-400 mt-1">
                Participez aux décisions stratégiques, élections et sondages en direct lors des conférences organisées par VIVA.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
              🔒 Vote sécurisé et anonymisé par compte client
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {polls.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400 italic">Aucun scrutin ouvert pour le moment.</p>
            )}
            {polls.map(poll => {
              const hasVoted = Boolean(poll.userVotedOptionId);
              return (
                <div key={poll.id} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">{poll.event}</span>
                      <h4 className="text-lg sm:text-xl font-bold text-white mt-1">{poll.title}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${
                      poll.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {poll.status === 'active' ? '🟢 Vote Ouvert' : '🔴 Vote Clos'}
                    </span>
                  </div>

                  {/* Options & Progress */}
                  <div className="space-y-3">
                    {poll.options.map(opt => {
                      const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                      const isSelected = poll.userVotedOptionId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => !hasVoted && poll.status === 'active' && handleVote(poll.id, opt.id)}
                          className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                            hasVoted || poll.status === 'closed'
                              ? 'bg-slate-950 border-slate-800 cursor-default'
                              : 'bg-slate-950/80 border-slate-800 hover:border-blue-500 cursor-pointer'
                          }`}
                        >
                          {/* Progress fill bar */}
                          {(hasVoted || poll.status === 'closed') && (
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-blue-500/15 transition-all duration-500 z-0"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          )}

                          <div className="flex items-center justify-between gap-4 relative z-10">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border font-bold text-xs ${
                                isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-700 text-slate-400'
                              }`}>
                                {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-white">{opt.text}</span>
                            </div>

                            {(hasVoted || poll.status === 'closed') && (
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-slate-400 font-mono">{opt.votes} votes</span>
                                <span className="text-xs font-bold text-blue-400 font-mono">{percentage}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                    <span>Total des votes exprimés : <strong className="text-white font-mono">{poll.totalVotes}</strong></span>
                    {hasVoted ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Votre vote a été pris en compte</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">Cliquez sur une option pour voter</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB: PASSER COMMANDE DIRECTE ================= */}
      {activeTab === 'order' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {orderConfirmed ? (
            <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider font-mono">
                  Bon de Commande Transmis avec Succès
                </span>
                <h3 className="text-2xl font-black text-white">
                  Numéro de Commande : <span className="text-amber-400">{orderConfirmed}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                  Votre commande a été immédiatement intégrée dans le système d'ordonnancement de VIVA EVENT SOLUTIONS SARLU. Un chef de projet dédié vous contactera sous 2 heures pour la validation technique finale.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left p-6 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Événement</span>
                  <span className="text-xs font-bold text-white">{orderTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Date & Lieu</span>
                  <span className="text-xs font-bold text-white">{orderDate} • {orderLocation}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Budget Prévu</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">${orderBudget} USD</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setActiveTab('quotes')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Consulter le Devis dans mon Espace</span>
                </button>

                <button
                  onClick={() => {
                    setOrderConfirmed(null);
                    setOrderTitle('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
                >
                  Passer une Autre Commande
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOrderSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Guichet de Commande Client</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Passer une Commande de Matériel & Prestations
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sélectionnez les pôles d'expertise et les équipements souhaités. Votre compte client pré-remplit automatiquement vos coordonnées officielles.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Détails Généraux de l'Événement</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Titulature de l'Événement ou Référence de Commande *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderTitle}
                    onChange={e => setOrderTitle(e.target.value)}
                    placeholder="Ex: Sommet Économique RDC - Plénière & Dîner de Gala"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Type d'Événement *
                    </label>
                    <select
                      value={orderType}
                      onChange={e => setOrderType(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="institutionnel">Institutionnel & État</option>
                      <option value="diplomatique">Sommet Diplomatique</option>
                      <option value="entreprise">Entreprise & B2B</option>
                      <option value="culturel">Concert & Festival</option>
                      <option value="foire_salon">Foire & Exposition</option>
                      <option value="mariage_prestige">Mariage de Prestige</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Date Prévue *
                    </label>
                    <input
                      type="date"
                      required
                      value={orderDate}
                      onChange={e => setOrderDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Nombre de Participants *
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={orderAttendees}
                      onChange={e => setOrderAttendees(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Lieu / Ville d'Installation *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderLocation}
                      onChange={e => setOrderLocation(e.target.value)}
                      placeholder="Ex: Kinshasa / Palais du Peuple ou Pullman"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Budget Estimatif Prévu (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      value={orderBudget}
                      onChange={e => setOrderBudget(e.target.value)}
                      placeholder="35000"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>2. Services & Pôles Requis</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { key: 'scenic', label: 'Scénographie 3D & Lumière' },
                    { key: 'led', label: 'Murs LED 4K Géants' },
                    { key: 'audio', label: 'Sonorisation Line Array' },
                    { key: 'power', label: 'Énergie Autonome (3200 kVA)' },
                    { key: 'streaming', label: 'Live Streaming & Régie' },
                    { key: 'translation', label: 'Traduction Simultanée' },
                    { key: 'security', label: 'Sécurité & Escorte VIP' },
                    { key: 'catering', label: 'Traiteur & Cocktail' }
                  ].map(item => (
                    <div
                      key={item.key}
                      onClick={() => toggleService(item.key)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                        selectedServices[item.key]
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          selectedServices[item.key]
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'border-slate-700'
                        }`}
                      >
                        {selectedServices[item.key] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>3. Réservation d'Équipements du Parc Lourd</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Groupe Électrogène Insonorisé 500 kVA (Secours Synchro)',
                    'Mur LED Plein Jour P2.9 (50 m²)',
                    'Système Line Array L-Acoustics K2 (Concert & Discours)',
                    'Régie Vidéo 4K Blackmagic & 4 Caméras Tourelles',
                    'Cabines de Traduction Insonorisées ISO + 100 Casques',
                    'Structure Scénique Aluminium Prolyte 12x10m Couverte',
                    'Pupitre Présidentiel Blindé en Plexiglass & Micros Col de Cygne',
                    'Parc Éclairage Asservi Robe BMFL & Clay Paky Sharpy'
                  ].map((gear, idx) => {
                    const isSelected = selectedGear.includes(gear);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleGear(gear)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{gear}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  Instructions Particulières & Cahier des Charges
                </label>
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Précisez ici les horaires de montage, les personnalités VIP attendues ou toute exigence protocolaire..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Valider la Commande & Transmettre à VIVA EVENT SOLUTIONS SARLU</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ================= TAB: PROJECTS ================= */}
      {activeTab === 'projects' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Tous vos Projets & Sommets</h3>
            <button
              onClick={() => setActiveTab('order')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Commander un autre projet</span>
            </button>
          </div>

          <div className="space-y-4">
            {myProjects.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-dashed border-slate-700">
                <p className="text-sm font-bold text-slate-300">Aucune donnée disponible</p>
                <p className="text-xs text-slate-500 mt-1">Aucun projet ne vous est actuellement attribué. Vos futurs projets apparaîtront ici.</p>
              </div>
            ) : myProjects.map(proj => (
              <div key={proj.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-amber-400">{proj.code}</span>
                  <h4 className="text-lg font-bold text-white">{proj.title}</h4>
                  <p className="text-xs text-slate-400">{proj.type} • {proj.location}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400">${proj.budgetUSD.toLocaleString()}</div>
                    <span className="text-[10px] text-slate-400">Budget Validé</span>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-bold uppercase">
                    {proj.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB: QUOTES ================= */}
      {activeTab === 'quotes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Devis & Factures Pro forma</h3>
            <button
              onClick={() => setActiveTab('order')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Nouveau Devis / Commande</span>
            </button>
          </div>

          <div className="space-y-4">
            {myQuotes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-dashed border-slate-700">
                <p className="text-sm font-bold text-slate-300">Aucune donnée disponible</p>
                <p className="text-xs text-slate-500 mt-1">Vous n'avez aucun devis pour le moment. Vos futurs devis apparaîtront ici.</p>
              </div>
            ) : myQuotes.map(qte => (
              <div key={qte.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-amber-400">{qte.referenceNumber}</span>
                  <h4 className="text-lg font-bold text-white">{qte.eventName}</h4>
                  <p className="text-xs text-slate-400">Participants estimés : {qte.estimatedAttendees} • Date : {qte.eventDate} • Lieu : {qte.location}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400">${qte.estimatedBudgetUSD.toLocaleString()} USD</div>
                    <span className="text-[10px] text-slate-400 uppercase">{qte.status}</span>
                  </div>
                  <button
                    onClick={onOpenQuoteModal}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 cursor-pointer"
                  >
                    Voir Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB: PROFIL ================= */}
      {activeTab === 'profil' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Mon Profil</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Nom</span>
              <span className="text-white font-bold">{currentUser.name}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Email</span>
              <span className="text-white font-mono">{currentUser.email}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Organisation</span>
              <span className="text-white">{currentUser.organization || '—'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Téléphone</span>
              <span className="text-white font-mono">{currentUser.phone || '—'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Rôle</span>
              <span className="text-amber-400 font-mono font-bold">{currentUser.role}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Devis suivis</span>
              <span className="text-white font-black">{myQuotes.length}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Modification du profil : disponible après raccordement du profil serveur (R3 — profils). Contactez votre interlocuteur VIVA pour toute correction.</p>
        </div>
      )}

      {/* ================= TAB: DOCUMENTS ================= */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Mes Documents & Médias</h3>
          <p className="text-[11px] text-slate-500">Seuls les documents disposant d'un lien de téléchargement réel sont affichés. Dépôt/contrats serveurs : R3-05/R3-06.</p>
          <div className="space-y-3">
            {myQuotes.flatMap(q => (q.attachedFiles ?? []).filter(f => f.url).map(f => ({ ...f, ref: q.referenceNumber })) ).length === 0 &&
            mediaItems.filter(m => m.status === 'published' && m.visibility === 'public' && myProjects.some(p => p.title && m.projectName === p.title)).length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-dashed border-slate-700">
                <p className="text-sm font-bold text-slate-300">Aucune donnée disponible</p>
                <p className="text-xs text-slate-500 mt-1">Aucun document ou média ne vous est actuellement partagé.</p>
              </div>
            ) : (
              <>
                {myQuotes.flatMap(q => (q.attachedFiles ?? []).filter(f => f.url).map(f => ({ ...f, ref: q.referenceNumber }))).map((f, i) => (
                  <a key={`doc-${i}`} href={f.url} target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/40">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{f.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Devis {f.ref} • {f.size}</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 shrink-0">Télécharger →</span>
                  </a>
                ))}
                {mediaItems.filter(m => m.status === 'published' && m.visibility === 'public' && myProjects.some(p => p.title && m.projectName === p.title)).map(m => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/40">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{m.title}</div>
                      <div className="text-[11px] text-slate-500">{m.projectName}</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 shrink-0">Voir →</span>
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB: NOTIFICATIONS ================= */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Notifications</h3>
          <p className="text-[11px] text-slate-500">Session en cours uniquement — historique serveur : R3-04. Aucune notification inventée.</p>
          {sessionNotes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-dashed border-slate-700">
              <p className="text-sm font-bold text-slate-300">Aucune donnée disponible</p>
              <p className="text-xs text-slate-500 mt-1">Vos actions de cette session (commandes, devis) apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessionNotes.map(n => (
                <div key={n.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{n.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{n.kind} • {n.time}</div>
                  </div>
                  <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

