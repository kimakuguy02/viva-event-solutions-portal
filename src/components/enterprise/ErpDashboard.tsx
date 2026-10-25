import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Users,
  FileText,
  KeyRound,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  Send,
  Lock,
  Plus
} from 'lucide-react';

interface ErpDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const ErpDashboard: React.FC<ErpDashboardProps> = ({ setActiveTab }) => {
  const { currentUser, isDg, isDaf, isAdminRh, isChefEquipe, isCommercial } = useAuth();
  const {
    transactions,
    cashClosures,
    tasks,
    loanRecords,
    crmClients,
    exchangeRate,
    approveTransactionManager,
  } = useEnterpriseErp();

  // NOTE Phase 2 : l'ancien flux OTP simulé de ce tableau de bord était du code
  // mort (jamais invoqué ni rendu). La validation DAF passe par l'attestation
  // nominative du module Comptabilité (RPC erp_validate_daf).

  // Financial Calculations
  const totalRecettesUSD = transactions
    .filter(t => t.type === 'recette' && t.validationStatus === 'valide')
    .reduce((acc, t) => acc + t.amountUSD, 0);

  const totalDepensesUSD = transactions
    .filter(t => t.type === 'depense' && t.validationStatus === 'valide')
    .reduce((acc, t) => acc + t.amountUSD, 0);

  const netTreasuryUSD = totalRecettesUSD - totalDepensesUSD;
  const netTreasuryCDF = netTreasuryUSD * exchangeRate;

  // Écritures en attente de visa : clé = statut réellement stocké. Le flag
  // requiresDoubleSignature n'est qu'un motif ; filtrer dessus sous-comptait les
  // approbations en attente tant que le seuil n'est pas re-dérivé par le serveur.
  const pendingApprovals = transactions.filter(t => t.validationStatus !== 'valide');

  // Urgent tasks
  const urgentTasks = tasks.filter(t => t.priority === 'urgente' && t.status !== 'termine');
  const activeLoans = loanRecords.filter(l => l.status === 'en_cours');

  // Today's closure
  const today = new Date().toISOString().split('T')[0];
  const todayClosureUSD = cashClosures.find(c => c.date === today && c.currency === 'USD');

  return (
    <div className="space-y-8 pb-16">
      {/* Top Welcome & Worker Identity Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⚡ {currentUser.jobTitle || 'Travailleur VIVA EVENT'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Kinshasa / Gombe • RDC • SYSCOHADA / IFRS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Tableau de Bord Exécutif • {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Espace de gestion opérationnelle équilibrée : pilotage de trésorerie bi-devise (USD/CDF), suivi des projets terrain, traçabilité des actifs et gouvernance anti-fraude.
          </p>
        </div>

        {/* Fast Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(isDg || isDaf || isAdminRh) && (
            <button
              onClick={() => setActiveTab('accounting')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>Saisir Recette / Dépense</span>
            </button>
          )}

          {(isDg || isChefEquipe || isAdminRh) && (
            <button
              onClick={() => setActiveTab('projects-tasks')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tâches & Rapport Terrain</span>
            </button>
          )}

          {(isDg || isCommercial) && (
            <button
              onClick={() => setActiveTab('crm')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Nouveau Client CRM</span>
            </button>
          )}
        </div>
      </div>

      {/* RÈGLE ANTI-FRAUDE : Bannière d'Alerte si écritures en attente de visa */}
      {pendingApprovals.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-pulse-slow">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Règle Anti-Fraude : visas en attente</span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500 text-slate-950 font-black font-mono">
                  {pendingApprovals.length} en attente
                </span>
              </h4>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Le seuil de double signature (100 USD / 285 000 CDF) est appliqué par le serveur ; comptage basé sur le statut réellement enregistré en base.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('accounting')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 cursor-pointer shadow flex items-center gap-1"
          >
            <span>Traiter les Décaissements</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Cards (Bi-Devise USD/CDF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Trésorerie Nette */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trésorerie Disponible</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              ${netTreasuryUSD.toLocaleString()} USD
            </div>
            <div className="text-xs font-mono text-emerald-400 mt-1">
              ≈ {netTreasuryCDF.toLocaleString()} CDF (Taux {exchangeRate})
            </div>
          </div>
        </div>

        {/* 2. Recettes Totales Validées */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recettes Encaissées</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              ${totalRecettesUSD.toLocaleString()} USD
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Prestations scéniques, matériel & subventions
            </div>
          </div>
        </div>

        {/* 3. Tâches Terrain & Urgences */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tâches Prioritaires</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {tasks.filter(t => t.status !== 'termine').length}
            </div>
            <div className="text-xs text-rose-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{urgentTasks.length} tâches classées URGENTES</span>
            </div>
          </div>
        </div>

        {/* 4. Traçabilité Matériel en Prêt */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parc Sorti sur Chantiers</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {activeLoans.length} bons actifs
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Traçabilité QUI, QUOI, QUAND active
            </div>
          </div>
        </div>
      </div>

      {/* Operational Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tâches Opérationnelles Immédiates */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Tâches Opérationnelles par Service
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('projects-tasks')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tout ({tasks.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 4).map(task => {
              const priorityColors = {
                urgente: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                haute: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                normale: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                basse: 'bg-slate-700/30 text-slate-300 border-slate-700'
              };

              return (
                <div key={task.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      {task.serviceDirection}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${priorityColors[task.priority]}`}>
                      Priorité {task.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{task.title}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Assigné à : <strong className="text-slate-200">{task.assignedTo}</strong></span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                      <Clock className="w-3 h-3" />
                      Échéance : {task.deadline}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Clôture Journalière & Trésorerie */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Clôture de Caisse Journalière
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('accounting')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Registre</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Statut Clôture du Jour ({today})</span>
              {todayClosureUSD ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                  PV Validé
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase animate-pulse">
                  Clôture en Attente
                </span>
              )}
            </div>

            {todayClosureUSD ? (
              <div className="space-y-1 text-xs text-slate-300">
                <p>Référence : <span className="font-mono text-amber-400">{todayClosureUSD.pvReference}</span></p>
                <p>Solde Compté : <strong className="text-white">${todayClosureUSD.physicalCountedBalance.toLocaleString()} USD</strong></p>
                <p className="text-[11px] text-slate-400">Signé par {todayClosureUSD.closedBy} à {todayClosureUSD.closedAt}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Règle obligatoire : Toute caisse physique (USD & CDF) doit être clôturée et rapprochée chaque soir avant 19h00 avec procès-verbal signé.
                </p>
                <button
                  onClick={() => setActiveTab('accounting')}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-colors shadow"
                >
                  Effectuer la Clôture de Caisse
                </button>
              </div>
            )}
          </div>

          {/* Quick CRM Summary */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Portefeuille CRM & Prospects</span>
              <span className="text-xs text-purple-400 font-mono font-bold">{crmClients.length} comptes</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dernière interaction : Présidence RDC (Sommet CEEAC) • Suivi assuré par la Direction Commerciale.
            </p>
            <button
              onClick={() => setActiveTab('crm')}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>Consulter l'historique client →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
