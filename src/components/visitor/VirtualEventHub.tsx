import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import {
  Radio,
  Tv,
  MessageSquare,
  BarChart3,
  QrCode,
  ThumbsUp,
  Send,
  Volume2,
  Users,
  Play
} from 'lucide-react';

export const VirtualEventHub: React.FC = () => {
  const { tickets, liveQuestions, currentPoll, askLiveQuestion, upvoteQuestion, votePoll } = useProjectData();
  const [activeTab, setActiveTab] = useState<'stream' | 'qa' | 'poll' | 'badge'>('stream');
  const [selectedLanguage, setSelectedLanguage] = useState<'FR' | 'EN' | 'LN' | 'SW'>('FR');
  const [isPlaying, setIsPlaying] = useState(true);

  // Question form state
  const [newAuthor, setNewAuthor] = useState('');
  const [newAffiliation, setNewAffiliation] = useState('');
  const [newContent, setNewContent] = useState('');

  // Ticket badge generation state
  const [badgeAttendee] = useState({
    name: "Dr. Augustin Kalambay",
    org: "Délégation Ministérielle & RDC Tech Forum",
    seatNumber: "VIP-A14",
    ticketCode: "VES-TKT-2026-9844"
  });

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    askLiveQuestion(newAuthor || "Participant en Ligne", newAffiliation || "Délégation", newContent);
    setNewContent('');
  };

  return (
    <section className="py-16 bg-white" id="live-hub-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[var(--viva-primary)] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[var(--viva-primary)] animate-ping"></span>
            <span>Module d'Engagement Virtuel & Événements Hybrides</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Plateforme Digitale & Régie 4K Interactive
          </h2>
          <p className="text-sm sm:text-base text-[var(--viva-text-muted)] leading-relaxed">
            Démocratisation de l'Event Tech : retransmission HD/4K multi-flux, questions-réponses modérées en direct, sondages interactifs et billetterie à QR Code chiffré.
          </p>
        </div>

        {/* Hub Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'stream'
                ? 'bg-[var(--viva-primary)] text-white shadow-sm'
                : 'bg-white text-[var(--viva-text-muted)] hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Retransmission 4K en Direct</span>
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'qa'
                ? 'bg-[var(--viva-primary)] text-white shadow-sm'
                : 'bg-white text-[var(--viva-text-muted)] hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Questions & Réponses ({liveQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('poll')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'poll'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'bg-white text-[var(--viva-text-muted)] hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Sondage en Direct</span>
          </button>

          <button
            onClick={() => setActiveTab('badge')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'badge'
                ? 'bg-[var(--viva-primary)] text-white shadow-sm'
                : 'bg-white text-[var(--viva-text-muted)] hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Badge Digital & Contrôle d'Accès</span>
          </button>
        </div>

        {/* Content Tabs */}
        {/* 1. Live Stream Player */}
        {activeTab === 'stream' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="relative aspect-video rounded-3xl bg-slate-900 overflow-hidden shadow-xl group flex items-center justify-center border border-slate-200">
                {/* Simulated Live Scene */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/40 flex items-center justify-center">
                  <div className="text-center space-y-3 p-6">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                      <Radio className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-white">
                      Sommet Économique International des Grands Lacs
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Régie Principale 4K HDR • Diffusion multi-plateforme en direct de Kinshasa
                    </p>
                  </div>
                </div>

                {/* Top stream controls */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>EN DIRECT 4K</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-slate-200 text-xs font-mono backdrop-blur-md">
                    1,842 spectateurs
                  </span>
                </div>

                {/* Bottom stream audio languages */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-black/70 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 rounded-full bg-[var(--viva-primary)] text-white hover:bg-[var(--viva-primary-dark)] font-bold cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-slate-200">
                      <Volume2 className="w-4 h-4 text-[var(--viva-primary)]" />
                      <span className="hidden sm:inline">Traduction :</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['FR', 'EN', 'LN', 'SW'] as const).map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            selectedLanguage === lang
                              ? 'bg-[var(--viva-primary)] text-white'
                              : 'bg-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Starlink 220 Mbps
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column : Session schedule */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--viva-primary)]" />
                <span>Programme de la Journée</span>
              </h4>

              <div className="space-y-3">
                {tickets.map(session => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border transition-colors ${
                      session.isLive
                        ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                        : 'bg-slate-50/50 border-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-[var(--viva-primary)] font-bold">{session.time}</span>
                      {session.isLive && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-semibold text-[10px] uppercase">
                          En direct
                        </span>
                      )}
                    </div>
                    <h5 className="font-bold text-sm text-slate-900 line-clamp-2">{session.title}</h5>
                    <p className="text-xs text-[var(--viva-text-muted)] mt-1">{session.speaker}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                      <span>Piste : {session.track}</span>
                      <span>{session.registeredCount} / {session.capacity} inscrits</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Interactive Q&A Tab */}
        {activeTab === 'qa' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Ask form */}
            <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--viva-primary)]" />
                <span>Poser une Question au Panel</span>
              </h4>
              <p className="text-xs text-[var(--viva-text-muted)]">
                Vos questions sont transmises en temps réel à la régie et au modérateur du sommet.
              </p>

              <form onSubmit={handleAskQuestion} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Votre Nom & Prénom</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                    placeholder="Ex: Jean-Luc Tshisekedi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[var(--viva-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organisation / Entreprise</label>
                  <input
                    type="text"
                    value={newAffiliation}
                    onChange={e => setNewAffiliation(e.target.value)}
                    placeholder="Ex: Fédération des Entreprises"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[var(--viva-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Votre Question *</label>
                  <textarea
                    rows={3}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Saisissez votre question claire et concise..."
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[var(--viva-primary)]"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer à la Modération</span>
                </button>
              </form>
            </div>

            {/* Questions list with upvoting */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Questions Posées par l'Audience
              </h4>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {liveQuestions.map(q => (
                  <div key={q.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{q.author}</span>
                        <span className="text-[11px] text-[var(--viva-text-muted)] ml-2">({q.affiliation}) • {q.timestamp}</span>
                      </div>
                      {q.isAnswered && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-semibold">
                          Répondue en Direct
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{q.content}</p>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => upvoteQuestion(q.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-xs text-[var(--viva-primary)] font-semibold transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{q.votes} votes</span>
                      </button>
                      <span className="text-[11px] text-[var(--viva-text-muted)]">Transmis au modérateur</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Live Poll Tab */}
        {activeTab === 'poll' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-mono font-bold text-[#8B5CF6] uppercase tracking-wider">
                Sondage en Direct de l'Audience
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-50 text-[#8B5CF6] text-xs font-semibold">
                Actif ({currentPoll.totalVotes} votes)
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentPoll.question}
            </h3>

            <div className="space-y-3">
              {currentPoll.options.map(option => {
                const percent = Math.round((option.votes / (currentPoll.totalVotes || 1)) * 100);
                return (
                  <div
                    key={option.id}
                    onClick={() => votePoll(option.id)}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 cursor-pointer transition-all space-y-2 relative overflow-hidden group"
                  >
                    {/* Background Progress fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-purple-100/60 group-hover:bg-purple-100 transition-all"
                      style={{ width: `${percent}%` }}
                    ></div>

                    <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900">
                      <span>{option.text}</span>
                      <span className="text-[#8B5CF6] font-bold font-mono">{percent}% ({option.votes})</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-center text-[var(--viva-text-muted)]">
              Cliquez sur une option pour enregistrer votre vote instantané. Les pourcentages se recalculent automatiquement.
            </p>
          </div>
        )}

        {/* 4. Digital Badge & QR Code Check-in Tab */}
        {activeTab === 'badge' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg text-center relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="text-left">
                <span className="text-[10px] font-mono font-bold text-[var(--viva-primary)] uppercase tracking-wider">
                  VIVA EVENT SOLUTIONS • BADGE VIP
                </span>
                <h4 className="text-base font-bold text-slate-900">Accès Conférence & Sommet</h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[var(--viva-primary)] font-bold text-xs uppercase">
                Pass Accrédité
              </span>
            </div>

            {/* Generated QR Code representation */}
            <div className="p-4 bg-slate-50 rounded-2xl w-48 h-48 mx-auto shadow-sm flex items-center justify-center border border-slate-200">
              <QrCode className="w-40 h-40 text-slate-900" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">{badgeAttendee.name}</h3>
              <p className="text-xs text-[var(--viva-primary)] font-semibold">{badgeAttendee.org}</p>
              <p className="text-xs text-[var(--viva-text-muted)] font-mono pt-1">
                Zone / Siège : <span className="text-slate-900 font-bold">{badgeAttendee.seatNumber}</span> • Code : {badgeAttendee.ticketCode}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-[var(--viva-text-muted)]">
              Scannable aux portiques électroniques de sécurité & postes d'émargement VIVA EVENT.
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
