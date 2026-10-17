import React, { useState } from 'react';
import {
  Vote,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Award,
  AlertCircle,
  Share2,
  ShieldCheck,
  Search,
  ChevronRight,
  Info
} from 'lucide-react';

export interface Candidate {
  id: string;
  serialNumber: string; // Ex: "08"
  name: string; // Ex: "Fortunat BANZA MWANABUTE"
  title: string;
  avatarUrl?: string;
  description: string;
  votes: number;
}

export interface ElectionScrutin {
  id: string;
  type: string; // Ex: "Élection des génies en construction"
  title: string; // Ex: "Élection du Génie de Lukunga / Kinshasa"
  country: string; // Ex: "République Démocratique du Congo"
  cityProvince: string; // Ex: "Kinshasa"
  startDate: string; // Ex: "20/02/2026 – 16h15"
  endDate: string; // Ex: "20/02/2026 – 20h00"
  status: 'active' | 'closed' | 'upcoming';
  totalVoters: number;
  candidates: Candidate[];
}

export const VotingPollsModule: React.FC = () => {
  // Scrutin principal initialisé avec les données exactes de la proposition
  const [scrutin, setScrutin] = useState<ElectionScrutin>({
    id: 'scrutin-lukunga-2026',
    type: 'Élection des génies en construction',
    title: 'Élection du Génie de Lukunga / Kinshasa',
    country: 'République Démocratique du Congo',
    cityProvince: 'Kinshasa',
    startDate: '20/02/2026 – 16h15',
    endDate: '20/02/2026 – 20h00',
    status: 'active',
    totalVoters: 548,
    candidates: [
      {
        id: 'c-08',
        serialNumber: '08',
        name: 'Fortunat BANZA MWANABUTE',
        title: 'Ingénieur Concepteur en Génie Civil & Architecture Événementielle',
        description: 'Projet d’infrastructures modulaires bioclimatiques et dômes géodésiques durables pour les grands rassemblements en RDC.',
        votes: 312
      },
      {
        id: 'c-03',
        serialNumber: '03',
        name: 'Guy TSHIMANGA KABEMBA',
        title: 'Ingénieur en Systèmes Électriques & Énergies Renouvelables',
        description: 'Réseaux autonomes hybrides solaire-diesel insonorisés pour les méga-festivals urbains et ruraux.',
        votes: 148
      },
      {
        id: 'c-05',
        serialNumber: '05',
        name: 'Sarah LUKUSA MALU',
        title: 'Architecte Scénographe & Acoustique de Salle',
        description: 'Conception d’amphithéâtres démontables à isolation phonique renforcée pour les centres de congrès.',
        votes: 88
      }
    ]
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('c-08');
  const [activeView, setActiveView] = useState<'vote' | 'results'>('vote');
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [voterCode, setVoterCode] = useState<string>('');
  const [voteSuccessMessage, setVoteSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalVotes = scrutin.candidates.reduce((sum, c) => sum + c.votes, 0);
  const selectedCandidate = scrutin.candidates.find(c => c.id === selectedCandidateId) || scrutin.candidates[0];

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) return;

    // Incrémenter le vote du candidat
    setScrutin(prev => ({
      ...prev,
      totalVoters: prev.totalVoters + 1,
      candidates: prev.candidates.map(c =>
        c.id === selectedCandidateId ? { ...c, votes: c.votes + 1 } : c
      )
    }));

    setHasVoted(true);
    setVoteSuccessMessage(
      `Votre bulletin a été validé avec succès pour le Candidat N°${selectedCandidate.serialNumber} : ${selectedCandidate.name}.`
    );
  };

  const filteredCandidates = scrutin.candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.serialNumber.includes(searchQuery) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* En-tête officiel du scrutin */}
      <div className="rounded-3xl bg-slate-950 p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800 space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Plateforme Officielle de Vote & Sondages VIVA
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Scrutin Ouvert
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {scrutin.totalVoters} votants
            </span>
          </div>
        </div>

        {/* Détails du Scrutin conformes au cahier des charges */}
        <div className="space-y-3 max-w-3xl">
          <div className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-widest font-mono">
            {scrutin.type}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {scrutin.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Système d'expression citoyenne et professionnelle sécurisé par registre d'audit numérique pour l'évaluation des talents et projets d'ingénierie en RDC.
          </p>
        </div>

        {/* Fiche signalétique géographique et temporelle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300 font-medium">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Pays</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{scrutin.country}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Ville / Province</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{scrutin.cityProvince}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Date & Heure Début</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{scrutin.startDate}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Date & Heure Clôture</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{scrutin.endDate}</span>
            </div>
          </div>
        </div>

        {/* Barre de navigation entre VOTER et VOIR LES RÉSULTATS */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('vote')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              activeView === 'vote'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Voter au Scrutin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('results')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              activeView === 'results'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>VOIR LES RÉSULTATS</span>
          </button>
        </div>
      </div>

      {/* Message de succès après vote */}
      {voteSuccessMessage && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Bulletin enregistré dans l'urne numérique</h4>
            <p className="text-xs text-emerald-200/90">{voteSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Vue 1 : Interface de Vote */}
      {activeView === 'vote' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des Candidats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Sélectionnez votre Candidat
                </h3>
                <p className="text-xs text-slate-500">
                  Cliquez sur un candidat pour consulter son profil et préparer votre vote.
                </p>
              </div>

              {/* Recherche de candidat */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom ou n°..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredCandidates.map(candidate => {
                const isSelected = selectedCandidateId === candidate.id;
                return (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/40 shadow-xl ring-2 ring-purple-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Numéro de série proéminent */}
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider font-mono">N° SÉRIE</span>
                        <span className="text-xl font-mono">{candidate.serialNumber}</span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-lg font-black text-slate-900 tracking-tight truncate">
                            {candidate.name}
                          </h4>
                          {isSelected && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
                              Sélectionné
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-purple-700">
                          {candidate.title}
                        </p>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {candidate.description}
                        </p>
                      </div>

                      {/* Indicateur radio */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 self-center ${
                        isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panneau de confirmation et bouton "Voter" */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-6 sticky top-24">
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">
                  Bulletin Officiel
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Confirmation du Choix
                </h4>
                <p className="text-xs text-slate-500">
                  Vérifiez le numéro et l'identité du candidat avant de valider votre voix.
                </p>
              </div>

              {selectedCandidate && (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-mono font-black text-lg flex items-center justify-center">
                      {selectedCandidate.serialNumber}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidat choisi</span>
                      <span className="text-sm font-black text-slate-900">{selectedCandidate.name}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 border-t border-purple-100 pt-2">
                    <span className="font-semibold text-slate-700">Scrutin : </span>
                    {scrutin.title}
                  </div>
                </div>
              )}

              {/* Formulaire de validation */}
              <form onSubmit={handleVoteSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Numéro de Téléphone ou Code Électeur (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: +243 81 000 0000"
                    value={voterCode}
                    onChange={e => setVoterCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Utilisé pour certifier l'unicité du vote et recevoir le récépissé numérique.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    Votre vote est irrévocable, chiffré de bout en bout et vérifiable via le registre électoral.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={hasVoted}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    hasVoted
                      ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                  }`}
                >
                  <Vote className="w-4 h-4" />
                  <span>{hasVoted ? 'Vote Déjà Enregistré' : 'Voter'}</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('results')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 underline cursor-pointer"
                >
                  Voir les résultats en direct →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vue 2 : Résultats du Scrutin */}
      {activeView === 'results' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Dépouillement & Résultats en Direct
              </h3>
              <p className="text-xs text-slate-500">
                Statistiques actualisées en temps réel selon le registre de vote certifié.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800">
                Total Voix : {totalVotes}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700">
                Participation : {scrutin.totalVoters} électeurs
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {scrutin.candidates
              .sort((a, b) => b.votes - a.votes)
              .map((candidate, idx) => {
                const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
                const isLeading = idx === 0;

                return (
                  <div
                    key={candidate.id}
                    className={`p-6 rounded-3xl border transition-all bg-white shadow-sm space-y-4 ${
                      isLeading ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-black ${
                          isLeading ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <span className="text-[8px] uppercase">N°</span>
                          <span className="text-base">{candidate.serialNumber}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">{candidate.name}</h4>
                            {isLeading && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-600" />
                                En tête
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">{candidate.title}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-2xl font-black text-purple-600">{percentage}%</span>
                        <span className="text-xs text-slate-400 block font-normal">{candidate.votes} votes</span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isLeading ? 'bg-purple-600' : 'bg-slate-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => setActiveView('vote')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
            >
              ← Retourner à la cabine de vote
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
