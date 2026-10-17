import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { CrmClient, CrmInteraction } from '../../types/erp';
import {
  Users,
  Building2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Plus,
  Send,
  Star,
  DollarSign,
  FileText,
  Search,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Shield,
  Smartphone,
  X
} from 'lucide-react';

export const CrmModule: React.FC = () => {
  const { currentUser, isCommercial, isDg } = useAuth();
  const {
    crmClients,
    crmInteractions,
    addCrmClient,
    updateCrmClientStatus,
    addCrmInteraction,
    sendMultichannelNotice
  } = useEnterpriseErp();
  const { quotes, projects } = useProjectData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<CrmClient | null>(crmClients[0] || null);

  // Modals
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewInteractionOpen, setIsNewInteractionOpen] = useState(false);
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);

  // New Client Form
  const [clientName, setClientName] = useState('');
  const [clientOrg, setClientOrg] = useState('');
  const [clientCategory, setClientCategory] = useState<CrmClient['category']>('grande_entreprise');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('+243 ');
  const [clientAddress, setClientAddress] = useState('Kinshasa / Gombe');
  const [clientNotes, setClientNotes] = useState('');

  // New Interaction Form
  const [interType, setInterType] = useState<CrmInteraction['type']>('appel');
  const [interSummary, setInterSummary] = useState('');
  const [interNextAction, setInterNextAction] = useState('');
  const [interNextDate, setInterNextDate] = useState('');

  // Send Message Form
  const [msgChannel, setMsgChannel] = useState<'sms' | 'email' | 'notification_push'>('sms');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  // Vue pipeline + timeline unifiée (données réelles uniquement, sources labellisées).
  const [crmView, setCrmView] = useState<'directory' | 'pipeline' | 'timeline'>('directory');

  // Contacts liés — SESSION uniquement (persistance : R3-11). Jamais de contact inventé.
  const [sessionContacts, setSessionContacts] = useState<{ id: string; clientId: string; name: string; role: string; email: string; phone: string; notes: string }[]>([]);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+243 ');
  const [contactNotes, setContactNotes] = useState('');

  const PIPELINE: { id: CrmClient['status']; label: string }[] = [
    { id: 'prospect', label: 'Prospects (NEW)' },
    { id: 'devis_en_cours', label: 'Devis en cours (PROPOSAL)' },
    { id: 'client_actif', label: 'Clients actifs (WON)' },
    { id: 'fidelise', label: 'Fidélisés' },
  ];

  const timelineEvents = (selectedClient
    ? [
        ...crmInteractions.filter(i => i.clientId === selectedClient.id).map(i => ({
          id: i.id, date: i.date, kind: 'interaction' as const,
          title: `${i.type.replace(/_/g, ' ')} — ${i.authorName}`, detail: i.summary,
          extra: i.nextAction ? `Suivi : ${i.nextAction}${i.nextFollowUpDate ? ` (${i.nextFollowUpDate})` : ''}` : undefined,
        })),
        ...quotes.filter(q => q.clientEmail.toLowerCase() === selectedClient.email.toLowerCase()).map(q => ({
          id: q.id, date: q.createdAt, kind: 'devis' as const,
          title: `Devis ${q.referenceNumber} — ${q.status}`, detail: q.eventName,
          extra: `${q.estimatedBudgetUSD.toLocaleString()} USD`,
        })),
        ...projects.filter(p =>
          (p.clientId && p.clientId === selectedClient.id) ||
          p.client.toLowerCase().includes(selectedClient.organization.toLowerCase()) ||
          p.client.toLowerCase() === selectedClient.name.toLowerCase()
        ).map(p => ({
          id: p.id, date: p.startDate, kind: 'projet' as const,
          title: `Projet ${p.code} — ${p.status}`, detail: p.title,
          extra: p.location,
        })),
      ].sort((a, b) => (a.date < b.date ? 1 : -1))
    : []);

  // Filtered Clients
  const filteredClients = crmClients.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'all' || c.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientOrg) return;

    addCrmClient({
      name: clientName,
      organization: clientOrg,
      category: clientCategory,
      status: 'prospect',
      email: clientEmail,
      phone: clientPhone,
      address: clientAddress,
      city: 'Kinshasa',
      fidelityTier: 'standard',
      assignedManager: currentUser.name,
      notes: clientNotes
    });

    setIsNewClientOpen(false);
    setClientName('');
    setClientOrg('');
    setClientNotes('');
  };

  const handleCreateInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !interSummary) return;

    addCrmInteraction({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      type: interType,
      authorName: currentUser.name,
      summary: interSummary,
      nextAction: interNextAction,
      nextFollowUpDate: interNextDate
    });

    setIsNewInteractionOpen(false);
    setInterSummary('');
    setInterNextAction('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !msgContent) return;

    sendMultichannelNotice({
      channel: msgChannel,
      targetRecipient: msgChannel === 'email' ? selectedClient.email : selectedClient.phone,
      recipientName: selectedClient.name,
      subject: msgSubject || `Message VIVA EVENT - ${selectedClient.organization}`,
      content: msgContent,
      category: 'facture_devis'
    });

    setMsgSentSuccess(true);
    setTimeout(() => {
      setMsgSentSuccess(false);
      setIsSendMessageOpen(false);
      setMsgContent('');
      setMsgSubject('');
    }, 1500);
  };

  const clientInteractions = crmInteractions.filter(i => selectedClient && i.clientId === selectedClient.id);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CRM Entreprise • Portefeuille Clients & Prospects
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Gestion de la Relation Client & Fidélisation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Suivi des comptes institutionnels, diplomatiques et grandes entreprises, historique des interactions, relances devis et communication multicanale (SMS, Email, Notifications).
          </p>
        </div>

        <button
          onClick={() => setIsNewClientOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client / Prospect</span>
        </button>
      </div>

      {/* Commutateur de vue annuaire / pipeline / timeline */}
      <div className="flex items-center gap-2">
        {([
          { id: 'directory', label: 'Annuaire' },
          { id: 'pipeline', label: 'Pipeline commercial' },
          { id: 'timeline', label: 'Timeline unifiée' },
        ] as const).map(v => (
          <button
            key={v.id}
            onClick={() => setCrmView(v.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              crmView === v.id ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {crmView === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PIPELINE.map(stage => {
            const members = crmClients.filter(c => c.status === stage.id);
            const stageRevenue = members.reduce((n, c) => n + c.totalRevenueUSD, 0);
            return (
              <div key={stage.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase">{stage.label}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">{members.length}</span>
                </div>
                <p className="text-[11px] font-mono text-emerald-400 font-bold">${stageRevenue.toLocaleString()} USD</p>
                {members.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-3 text-center">Aucune donnée disponible</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {members.map(c => (
                      <button key={c.id} onClick={() => { setSelectedClient(c); setCrmView('directory'); }} className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 cursor-pointer">
                        <div className="text-xs font-bold text-white line-clamp-1">{c.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{c.organization}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {crmView === 'timeline' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white">Timeline — {selectedClient ? selectedClient.name : 'sélectionnez un client dans l’annuaire'}</h4>
          <p className="text-[11px] text-slate-500">Interactions, devis et projets réels uniquement, sources identifiées. Persistance unifiée : R3-13.</p>
          {!selectedClient ? (
            <p className="text-xs text-slate-400 italic">Choisissez un compte pour afficher sa timeline.</p>
          ) : timelineEvents.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Aucune donnée disponible pour ce compte.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {timelineEvents.map(ev => (
                <div key={`${ev.kind}-${ev.id}`} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold font-mono text-[10px] uppercase">{ev.kind}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{ev.date}</span>
                  </div>
                  <p className="font-bold text-white mt-1.5">{ev.title}</p>
                  <p className="text-slate-300 mt-0.5">{ev.detail}</p>
                  {ev.extra && <p className="text-amber-300 text-[11px] mt-1">{ev.extra}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {crmView === 'directory' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Grid: Left List + Right Detail */}
        {/* Left Column: Search, Filter, List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, organisation, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'institutionnel', label: 'Institutions' },
                { id: 'grande_entreprise', label: 'Entreprises' },
                { id: 'diplomatique', label: 'Diplomatie' },
                { id: 'pme', label: 'PME' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    filterCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Clients */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredClients.map(client => {
              const isSelected = selectedClient?.id === client.id;
              const tierBadgeColors = {
                platine: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                or: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                argent: 'bg-slate-400/20 text-slate-200 border-slate-400/30',
                standard: 'bg-slate-800 text-slate-400 border-slate-700'
              };

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all shadow ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-purple-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                      {client.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${tierBadgeColors[client.fidelityTier]}`}>
                      Palier {client.fidelityTier}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white mt-1 line-clamp-1">{client.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{client.organization}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 mt-2">
                    <span className="font-bold text-emerald-400 font-mono">${client.totalRevenueUSD.toLocaleString()} USD</span>
                    <span className="text-[11px]">{client.contractsCount} contrats</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Client Detailed View */}
        <div className="lg:col-span-7">
          {selectedClient ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              {/* Client Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 uppercase">{selectedClient.code}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase">
                      {selectedClient.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">{selectedClient.name}</h3>
                  <p className="text-xs text-slate-400">{selectedClient.organization} • {selectedClient.city}</p>
                </div>

                {/* Multichannel Action Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSendMessageOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer Message</span>
                  </button>

                  <button
                    onClick={() => setIsNewInteractionOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Interaction</span>
                  </button>
                </div>
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                    <Mail className="w-3.5 h-3.5 text-purple-400" /> Email Officiel
                  </span>
                  <p className="font-mono text-white text-xs">{selectedClient.email}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Ligne Téléphonique / WhatsApp
                  </span>
                  <p className="font-mono text-white text-xs">{selectedClient.phone}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" /> Adresse Géographique & Protocole
                  </span>
                  <p className="text-slate-300">{selectedClient.address}</p>
                </div>
              </div>

              {/* Client Notes */}
              {selectedClient.notes && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Notes Stratégiques & Exigences :</span>
                  <p className="text-slate-300 leading-relaxed italic">{selectedClient.notes}</p>
                </div>
              )}

              {/* Interactions Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Historique des Échanges & Rendez-vous ({clientInteractions.length})</span>
                  </h4>
                </div>

                {clientInteractions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Aucune interaction consignée pour ce compte.</p>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {clientInteractions.map(inter => (
                      <div key={inter.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold font-mono text-[10px] uppercase">
                            {inter.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{inter.date}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{inter.summary}</p>
                        {inter.nextAction && (
                          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-300 flex items-center justify-between">
                            <span>Action suivante : <strong>{inter.nextAction}</strong></span>
                            {inter.nextFollowUpDate && <span>Échéance : {inter.nextFollowUpDate}</span>}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500">Enregistré par {inter.authorName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Contacts liés — SESSION uniquement (persistance : R3-11) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-xs uppercase text-slate-300 tracking-wider">
                    Contacts liés ({sessionContacts.filter(ct => selectedClient && ct.clientId === selectedClient.id).length})
                  </h4>
                  <button
                    onClick={() => setIsNewContactOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
                  >
                    + Contact
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Contacts de session — jamais de contact inventé, persistance serveur : R3-11.</p>
                {sessionContacts.filter(ct => selectedClient && ct.clientId === selectedClient.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">Aucun contact consigné pour ce compte.</p>
                ) : (
                  <div className="space-y-2">
                    {sessionContacts.filter(ct => selectedClient && ct.clientId === selectedClient.id).map(ct => (
                      <div key={ct.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div className="font-bold text-white">{ct.name} <span className="text-slate-400 font-normal">— {ct.role}</span></div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ct.email} • {ct.phone}</div>
                        {ct.notes && <p className="text-[11px] text-slate-300 mt-1">{ct.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
              Sélectionnez un compte client dans la liste de gauche pour afficher sa fiche complète.
            </div>
          )}
        </div>
      </div>
      )}

      {/* ==================== MODAL NOUVEAU CLIENT ==================== */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Nouveau Compte Client / Prospect</h3>
              <button onClick={() => setIsNewClientOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nom du Contact Principal</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: M. Patrick Malamba"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Organisation / Entreprise</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rawbank Siège"
                    value={clientOrg}
                    onChange={e => setClientOrg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Catégorie</label>
                  <select
                    value={clientCategory}
                    onChange={e => setClientCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="institutionnel">Institutionnel</option>
                    <option value="grande_entreprise">Grande Entreprise</option>
                    <option value="diplomatique">Corps Diplomatique</option>
                    <option value="pme">PME</option>
                    <option value="particulier_vip">Particulier VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@partenaire.cd"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Adresse à Kinshasa</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Notes Internes</label>
                <textarea
                  rows={3}
                  placeholder="Besoins récurrents, protocole, décisionnaires..."
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  Créer le Compte Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL NOUVEAU CONTACT (session — R3-11) ==================== */}
      {isNewContactOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Nouveau contact lié</h3>
                <p className="text-[11px] text-slate-400">{selectedClient.name} — conservé en session uniquement (R3-11).</p>
              </div>
              <button onClick={() => setIsNewContactOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!contactName.trim()) return;
                setSessionContacts(prev => [...prev, {
                  id: `ctc-${Date.now()}`,
                  clientId: selectedClient.id,
                  name: contactName.trim(),
                  role: contactRole.trim() || '—',
                  email: contactEmail.trim(),
                  phone: contactPhone,
                  notes: contactNotes.trim(),
                }]);
                setContactName(''); setContactRole(''); setContactEmail(''); setContactPhone('+243 '); setContactNotes('');
                setIsNewContactOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nom complet *</label>
                <input type="text" required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Ex : Mme Aline Mbuyi" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Fonction</label>
                <input type="text" value={contactRole} onChange={e => setContactRole(e.target.value)} placeholder="Ex : Directrice de cabinet" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email</label>
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Téléphone</label>
                  <input type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono" />
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Notes</label>
                <textarea rows={2} value={contactNotes} onChange={e => setContactNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsNewContactOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer">Ajouter (session)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL ENREGISTRER INTERACTION ==================== */}
      {isNewInteractionOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">Consigner un Échange</h3>
              <button onClick={() => setIsNewInteractionOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInteraction} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Type d'Échange</label>
                <select
                  value={interType}
                  onChange={e => setInterType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="appel">Appel Téléphonique</option>
                  <option value="reunion">Réunion Physique / Visio</option>
                  <option value="email">Email / Courrier</option>
                  <option value="visite_terrain">Visite Terrain / Repérage</option>
                  <option value="devis_transmis">Transmission Devis / Contrat</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Compte-Rendu Sommaire</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Détails de la discussion, retours client, points d'attention..."
                  value={interSummary}
                  onChange={e => setInterSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Action Suivante</label>
                  <input
                    type="text"
                    placeholder="Ex: Envoyer contrat"
                    value={interNextAction}
                    onChange={e => setInterNextAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Date Échéance</label>
                  <input
                    type="date"
                    value={interNextDate}
                    onChange={e => setInterNextDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewInteractionOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL ENVOYER MESSAGE MULTICANAL ==================== */}
      {isSendMessageOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Communication Multicanal</h3>
                <p className="text-[11px] text-slate-400">Destinataire : {selectedClient.name} ({selectedClient.organization})</p>
              </div>
              <button onClick={() => setIsSendMessageOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {msgSentSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/20 text-emerald-300 font-bold text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p>Message multicanal transmis avec succès !</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Canal de Transmission</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sms', label: 'SMS Pro', icon: Smartphone },
                      { id: 'email', label: 'Email', icon: Mail },
                      { id: 'notification_push', label: 'App Push', icon: Send }
                    ].map(ch => {
                      const Icon = ch.icon;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setMsgChannel(ch.id as any)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                            msgChannel === ch.id
                              ? 'bg-purple-600 border-purple-400 text-white font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[11px]">{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Objet / Titre</label>
                  <input
                    type="text"
                    placeholder="Ex: Devis chiffré pour la plénière du sommet"
                    value={msgSubject}
                    onChange={e => setMsgSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Contenu du Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Rédigez votre message officiel..."
                    value={msgContent}
                    onChange={e => setMsgContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSendMessageOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer Immédiatement</span>
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
