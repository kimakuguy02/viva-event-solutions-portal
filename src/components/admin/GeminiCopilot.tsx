import React, { useState } from 'react';
import { AdminCard, AdminEmpty } from './AdminUI';
import { useAuth } from '../../context/AuthContext';
import type { CopilotMessage, CopilotProposedAction } from '../../types/platformBuilder';
import { Sparkles, Send, CheckCircle2, XCircle, History, ShieldAlert } from 'lucide-react';

/* Gemini Copilot — EXPÉRIENCE et architecture uniquement (Phase 2.1).
   GARANTIES : aucune clé secrète (aucun appel réseau IA), aucune mutation
   réelle (les « confirmations » restent des simulations marquées comme telles
   en attendant l'Edge Function + RBAC de la phase IA), aucun contournement :
   chaque action proposée affiche le rôle requis. L'historique est en session. */

const SUGGESTIONS = [
  'Rédige un titre hero pour un sommet diplomatique',
  'Propose un module « Billetterie VIP »',
  'Analyse la cohérence du menu public',
  'Aide-moi à structurer un formulaire de recrutement',
];

function proposeFor(prompt: string): CopilotProposedAction[] {
  const p = prompt.toLowerCase();
  if (p.includes('module')) {
    return [{
      id: `pa-${Date.now()}`,
      kind: 'CREATE_MODULE',
      title: 'Créer le module « Billetterie VIP »',
      detail: 'Module catégorie logistics, visible staff + commercial, permission associée manage.',
      payloadSummary: '{ code: mod-billetterie-vip, category: logistics, allowedRoles: [admin, manager] }',
      status: 'proposed',
    }];
  }
  if (p.includes('formulaire') || p.includes('recrutement')) {
    return [{
      id: `pa-${Date.now()}`,
      kind: 'CREATE_FORM',
      title: 'Créer le formulaire « Candidature technicien »',
      detail: 'Champs : nom, email, téléphone, spécialité (liste), expérience (nombre), motivations (textarea). Audience : public.',
      payloadSummary: '{ targetAudience: public, fields: [text, email, phone, select, number, textarea] }',
      status: 'proposed',
    }];
  }
  if (p.includes('menu')) {
    return [{
      id: `pa-${Date.now()}`,
      kind: 'UPDATE_MENU',
      title: 'Réordonner le menu public',
      detail: 'Placer « Réalisations » avant « Partenaires », visibilité public inchangée.',
      payloadSummary: '{ menu-home:1, menu-media:2, menu-partners:3 }',
      status: 'proposed',
    }];
  }
  return [{
    id: `pa-${Date.now()}`,
    kind: 'ANALYZE',
    title: 'Analyse de votre demande',
    detail: 'Proposition d brouillon : reformulation + plan en 3 étapes. Aucune écriture effectuée.',
    payloadSummary: '{ étapes: [analyser, proposer, confirmer] }',
    status: 'proposed',
  }];
}

function answerFor(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('hero') || p.includes('sommet')) {
    return 'Proposition de titre : « Kinshasa, capitale des grands rendez-vous — ingénierie événementielle de précision ». Dites-moi le ton (institutionnel / audacieux) et je décline sous-titre + CTA. Rien n’a été publié : la publication restera un acte CMS validé par vous.';
  }
  if (p.includes('cohérence') || p.includes('menu')) {
    return 'Analyse (brouillon) : le menu public comporte 12 entrées dont 3 à audience mixte. Je propose de regrouper Annonces/Billetterie/Sondages sous « Guichet interactif ». Confirmez pour générer le plan de modification (sans l’appliquer).';
  }
  return 'Bien reçu. Je prépare une proposition ci-dessous : examinez-la, modifiez-la, puis confirmez. Tant que l’Edge Function IA n’est pas branchée, aucune de mes propositions n’écrit réellement — c’est une garantie, pas une limitation temporaire oubliée.';
}

export const GeminiCopilot: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour. Je suis le copilote de configuration (mode maquette) : je propose, vous confirmez, rien ne s’exécute seul. Aucune clé, aucune mutation réelle dans cette phase.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [actions, setActions] = useState<CopilotProposedAction[]>([]);
  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const role = currentUser.role;
  const capability = role === 'admin' || role === 'admin_general'
    ? 'Capacité maximale : proposer modules, menus, formulaires, contenus, configuration. Exécution : confirmation + Edge + RBAC (phase IA).'
    : role === 'client'
      ? 'Assistance limitée à vos propres données (devis, projets, tickets). Aucune configuration plateforme.'
      : role === 'visitor'
        ? 'Questions générales sur VIVA EVENT SOLUTIONS uniquement.'
        : 'Capacité limitée à votre périmètre autorisé (vos modules et données). Aucune administration.';
  const scopedSuggestions =
    role === 'client'
      ? ['Où en est mon devis ?', 'Quels documents me sont partagés ?', 'Comment suivre mon projet ?']
      : role === 'visitor'
        ? ['Que fait VIVA EVENT SOLUTIONS ?', 'Quels sont vos 15 pôles ?', 'Comment demander un devis ?']
        : SUGGESTIONS;

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const um: CopilotMessage = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() };
    const staffLike = role === 'admin' || role === 'admin_general' || role === 'dg_gerant' || role === 'admin_rh' || role === 'daf_comptable' || role === 'chef_equipe' || role === 'commercial_secretaire';
    const am: CopilotMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: staffLike ? answerFor(text) : `${answerFor(text)} (Périmètre ${role} : aucune proposition de configuration — assistance d'information uniquement.)`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, um, am]);
    // Actions de configuration réservées au périmètre staff/admin.
    if (staffLike) setActions((prev) => [...proposeFor(text), ...prev]);
    setInput('');
  };

  const setStatus = (id: string, status: CopilotProposedAction['status']) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (status === 'confirmed') {
          // SIMULATION MARQUÉE : aucune mutation réelle (Edge + RBAC à venir).
          return { ...a, status, detail: `${a.detail} [Simulation — non appliqué : Edge Function IA + vérification RBAC requises.]` };
        }
        return { ...a, status };
      }),
    );
  };

  return (
    <div className="space-y-4">
      <AdminCard
        title="Gemini Copilot — maquette d'expérience"
        subtitle="Conversation, contexte, suggestions, actions proposées avec confirmation. Aucune clé, aucune exécution réelle."
        action={
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" /> RBAC : confirmation humaine requise
          </span>
        }
      >
        <p className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
          Périmètre de votre rôle ({role}) : {capability}
        </p>
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap gap-2">
          {scopedSuggestions.map((s) => (
            <button key={s} onClick={() => setInput(s)} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer text-left">
              <Sparkles className="w-3 h-3 inline mr-1 text-amber-400" />{s}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-950 border border-slate-800 text-slate-200'}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Décrivez ce que vous voulez configurer…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
          />
          <button onClick={send} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer">
            <Send className="w-4 h-4" /> Envoyer
          </button>
        </div>
      </AdminCard>

      <AdminCard
        title="Actions proposées"
        subtitle="Chaque action affiche son périmètre. La confirmation reste une simulation marquée jusqu'à l'Edge Function."
        action={
          <button onClick={() => setHistoryOpen((v) => !v)} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
            <History className="w-3.5 h-3.5" /> Historique ({actions.length})
          </button>
        }
      >
        {actions.length === 0 ? (
          <AdminEmpty title="Aucune action proposée" hint="Posez une question au copilote pour obtenir une proposition structurable." />
        ) : (
          <div className="space-y-3">
            {actions.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">{a.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${a.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : a.status === 'rejected' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                    {a.status === 'proposed' ? 'proposée' : a.status === 'confirmed' ? 'confirmée (simulée)' : 'rejetée'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{a.detail}</p>
                <code className="block text-[10px] font-mono text-slate-500 bg-slate-900 p-2 rounded-lg break-all">{a.payloadSummary}</code>
                {a.status === 'proposed' && (
                  <div className="flex gap-2">
                    <button onClick={() => setStatus(a.id, 'confirmed')} className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black flex items-center gap-1 cursor-pointer">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmer (simulation)
                    </button>
                    <button onClick={() => setStatus(a.id, 'rejected')} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
};
