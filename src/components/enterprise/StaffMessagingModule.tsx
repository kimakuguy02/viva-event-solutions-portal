import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Hash, 
  Shield, 
  Paperclip, 
  Search, 
  User, 
  CheckCheck, 
  AlertCircle,
  FileText,
  DollarSign,
  Truck,
  CheckSquare,
  Users
} from 'lucide-react';
import { StaffMessage, StaffChannel, MessagePriority } from '../../types/erp';
import { OFFICIAL_VIVA_WORKERS } from '../../context/AuthContext';

interface StaffMessagingModuleProps {
  initialChannelId?: string;
}

const INITIAL_CHANNELS: StaffChannel[] = [
  {
    id: 'ch-general',
    name: 'Général VIVA',
    code: 'GENERAL',
    description: 'Annonces officielles et coordination globale de l’entreprise',
    category: 'general',
    memberRoles: ['dg_gerant', 'admin_rh', 'daf_comptable', 'chef_equipe', 'commercial_secretaire']
  },
  {
    id: 'ch-ops',
    name: 'Opérations & Régie Technique',
    code: 'OPS-TECH',
    description: 'Suivi de chantier, sonorisation, énergie et déploiement terrain',
    category: 'operations',
    memberRoles: ['dg_gerant', 'chef_equipe']
  },
  {
    id: 'ch-finance',
    name: 'Trésorerie & Comptabilité',
    code: 'FINANCE',
    description: 'Validation des décaissements, caisses et rapprochements SYSCOHADA',
    category: 'finance',
    memberRoles: ['dg_gerant', 'daf_comptable']
  },
  {
    id: 'ch-commercial',
    name: 'Commercial & Grands Comptes',
    code: 'COMMERCIAL',
    description: 'Suivi CRM, validation des devis et gestion des clients VIP',
    category: 'commercial',
    memberRoles: ['dg_gerant', 'commercial_secretaire', 'admin_rh']
  },
  {
    id: 'ch-urgences',
    name: 'URGENCES & Sûreté',
    code: 'ALERTE-URG',
    description: 'Canal prioritaire d’intervention rapide et de sécurité',
    category: 'urgences',
    memberRoles: ['dg_gerant', 'admin_rh', 'daf_comptable', 'chef_equipe', 'commercial_secretaire']
  }
];

export const StaffMessagingModule: React.FC<StaffMessagingModuleProps> = () => {
  const { currentUser } = useAuth();
  const [channels] = useState<StaffChannel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [activeDmRecipientId, setActiveDmRecipientId] = useState<string | null>(null);
  // Aucun message préfabriqué : un historique de conversations attribué à de
  // vrais collaborateurs ne peut être que du décor. Vide = rien d'envoyé.
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [messagePriority, setMessagePriority] = useState<MessagePriority>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<StaffMessage['attachment'] | undefined>(undefined);

  // Filter colleagues (excluding current user)
  const colleagues = OFFICIAL_VIVA_WORKERS.filter(w => w.email !== currentUser.email);

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activeDmRecipient = colleagues.find(c => c.id === activeDmRecipientId);

  // Filter messages for current view (channel or direct message)
  const filteredMessages = messages.filter(m => {
    if (activeDmRecipientId) {
      return (
        (m.senderId === currentUser.id && m.recipientId === activeDmRecipientId) ||
        (m.senderId === activeDmRecipientId && m.recipientId === currentUser.id)
      );
    }
    return m.channelId === activeChannelId;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const workerInfo = OFFICIAL_VIVA_WORKERS.find(w => w.role === currentUser.role) || {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      jobTitle: currentUser.jobTitle || 'Collaborateur VIVA',
      avatarColor: '#4A6CF7'
    };

    const msg: StaffMessage = {
      id: `msg-${Date.now()}`,
      senderId: workerInfo.id,
      senderName: workerInfo.name,
      senderRole: workerInfo.role,
      senderJobTitle: workerInfo.jobTitle,
      senderAvatarColor: workerInfo.avatarColor,
      channelId: activeDmRecipientId ? undefined : activeChannelId,
      recipientId: activeDmRecipientId || undefined,
      content: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      priority: messagePriority,
      attachment: selectedAttachment
    };

    setMessages(prev => [...prev, msg]);
    setNewMessageText('');
    setMessagePriority('normal');
    setSelectedAttachment(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Réseau Social & Messagerie Interne Sécurisée VIVA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Canaux d'Échange & Messages Directs du Personnel
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Communiquez en temps réel entre directions, partagez des pièces jointes métiers (devis, tâches, prêts de matériel) et coordonnez les opérations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <div className="text-xs font-bold text-white">
            {OFFICIAL_VIVA_WORKERS.length} Membres en Ligne
          </div>
        </div>
      </div>

      {/* Main Messaging Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
        {/* Sidebar: Channels & Colleagues */}
        <div className="lg:col-span-1 rounded-3xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col space-y-5 shadow-lg">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher canal ou collègue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Channels Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2">
              Salons Officiels ({channels.length})
            </span>
            <div className="space-y-1">
              {channels.map(ch => {
                const isActive = !activeDmRecipientId && activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setActiveDmRecipientId(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#4A6CF7] text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                      <span className="truncate">{ch.name}</span>
                    </div>
                    {ch.category === 'urgences' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2">
              Messages Directs (1-à-1)
            </span>
            <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
              {colleagues.map(col => {
                const isActive = activeDmRecipientId === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => {
                      setActiveDmRecipientId(col.id);
                    }}
                    className={`w-full text-left p-2 rounded-2xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: col.avatarColor }}
                    >
                      {col.name.charAt(0)}
                    </div>
                    <div className="truncate flex-1">
                      <div className="font-bold text-white truncate">{col.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{col.jobTitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeDmRecipientId ? (
                <>
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: activeDmRecipient?.avatarColor || '#4A6CF7' }}
                  >
                    {activeDmRecipient?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeDmRecipient?.name}</h3>
                    <p className="text-[11px] text-slate-400">{activeDmRecipient?.jobTitle} • {activeDmRecipient?.directionName}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeChannel?.name}</h3>
                    <p className="text-[11px] text-slate-400">{activeChannel?.description}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                Sécurisé VIVA ERP
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[460px] bg-slate-950/30">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">Aucun message pour le moment</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Soyez le premier à lancer la discussion dans ce canal ou à envoyer un message direct à votre collègue.
                </p>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id || msg.senderName.includes(currentUser.name);
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-2 text-[11px] px-1 text-slate-400">
                      <span className="font-bold text-white">{msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.senderJobTitle}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[9px] border border-rose-500/30">
                          URGENT
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm shadow-md leading-relaxed ${
                        isMe
                          ? 'bg-[#4A6CF7] text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {msg.attachment && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 bg-black/20 p-2.5 rounded-xl">
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold">{msg.attachment.label}</span>
                            <span className="block text-[10px] text-white/70">Référence interne ERP</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Composer Footer */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
            {selectedAttachment && (
              <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-amber-400">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Pièce jointe : {selectedAttachment.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttachment(undefined)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <select
                value={messagePriority}
                onChange={e => setMessagePriority(e.target.value as MessagePriority)}
                className="px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent 🔥</option>
              </select>

              <button
                type="button"
                onClick={() => setSelectedAttachment({
                  type: 'devis',
                  label: 'Devis VIP VIVA-2026-981 ($14,500)',
                  referenceId: 'quo-001'
                })}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                title="Joindre un élément ERP (Devis, Tâche, Matériel)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder={`Écrire un message dans ${activeDmRecipientId ? activeDmRecipient?.name : activeChannel?.name}...`}
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-[#4A6CF7] hover:bg-[#3A5BD9] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
              >
                <span>Envoyer</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
