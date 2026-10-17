import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { AccountingTransaction, PaymentAccount } from '../../types/erp';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileCheck2,
  Calendar,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Building,
  Smartphone,
  Wallet,
  Receipt,
  Download,
  X
} from 'lucide-react';

export const AccountingModule: React.FC = () => {
  const { currentUser, isDg, isDaf, isAdminRh } = useAuth();
  const {
    transactions,
    cashClosures,
    exchangeRate,
    addTransaction,
    approveTransactionManager,
    validateTransactionDaf,
    createDailyCashClosure
  } = useEnterpriseErp();

  // Active tab inside module: 'journal' | 'clotures' | 'comptes'
  const [activeSubTab, setActiveSubTab] = useState<'journal' | 'clotures' | 'comptes'>('journal');

  // Filter
  const [filterType, setFilterType] = useState<'all' | 'recette' | 'depense'>('all');

  // Modal New Transaction
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [txType, setTxType] = useState<'recette' | 'depense'>('recette');
  const [txCategory, setTxCategory] = useState<AccountingTransaction['category']>('ventes_services');
  const [txAccountCode, setTxAccountCode] = useState('7061');
  const [txDescription, setTxDescription] = useState('');
  const [txAmountUSD, setTxAmountUSD] = useState<number>(500);
  const [txPaymentAccount, setTxPaymentAccount] = useState<PaymentAccount>('banque_rawbank_usd');
  const [txBeneficiary, setTxBeneficiary] = useState('');

  // Modal Double Signature / OTP
  const [selectedTxForOtp, setSelectedTxForOtp] = useState<AccountingTransaction | null>(null);
  const [dafNote, setDafNote] = useState('');
  const [otpError, setOtpError] = useState('');
  const [txSaveError, setTxSaveError] = useState<string | null>(null);

  // Modal Daily Closure
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [closureCurrency, setClosureCurrency] = useState<'USD' | 'CDF'>('USD');
  const [physicalCountedInput, setPhysicalCountedInput] = useState<number>(12000);
  const [closureJustification, setClosureJustification] = useState('');
  const [closureSuccessMessage, setClosureSuccessMessage] = useState<string | null>(null);

  // Totals
  const totalRecettesUSD = transactions
    .filter(t => t.type === 'recette' && t.validationStatus === 'valide')
    .reduce((acc, t) => acc + t.amountUSD, 0);

  const totalDepensesUSD = transactions
    .filter(t => t.type === 'depense' && t.validationStatus === 'valide')
    .reduce((acc, t) => acc + t.amountUSD, 0);

  const netBalanceUSD = totalRecettesUSD - totalDepensesUSD;
  const netBalanceCDF = netBalanceUSD * exchangeRate;

  // Pending double signatures
  const pendingDoubleSignatures = transactions.filter(
    t => t.requiresDoubleSignature && t.validationStatus !== 'valide'
  );

  const handleOpenNewTx = (type: 'recette' | 'depense') => {
    setTxType(type);
    if (type === 'recette') {
      setTxCategory('ventes_services');
      setTxAccountCode('7061');
    } else {
      setTxCategory('energie');
      setTxAccountCode('6051');
    }
    setIsNewTxOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || txAmountUSD <= 0) return;

    // Wave 2 — succès affiché seulement après confirmation Supabase.
    try {
      await addTransaction({
        type: txType,
        category: txCategory,
        accountCode: txAccountCode,
        description: txDescription,
        amountUSD: Number(txAmountUSD),
        paymentAccount: txPaymentAccount,
        beneficiaryOrPayer: txBeneficiary || 'Partenaire / Fournisseur',
        performedBy: `${currentUser.name} (${currentUser.jobTitle || 'Comptabilité'})`
      });

      setIsNewTxOpen(false);
      setTxDescription('');
      setTxBeneficiary('');
      setTxSaveError(null);
    } catch (err) {
      setTxSaveError(`Enregistrement refusé : ${err instanceof Error ? err.message : String(err)}. Aucune écriture effectuée.`);
    }
  };

  const handleTriggerOtp = (tx: AccountingTransaction) => {
    // Plus de code simulé : ouverture de l'attestation DAF (vérification serveur).
    setSelectedTxForOtp(tx);
    setDafNote('');
    setOtpError('');
  };

  const handleValidateOtp = async () => {
    // Attestation DAF nominative : la séparation initiateur/manager/DAF et le
    // verrouillage sont vérifiés côté serveur (RPC erp_validate_daf).
    // Canal OTP réel (SMS/email) : non connecté — documented, jamais simulé.
    if (selectedTxForOtp) {
      const ok = await validateTransactionDaf(selectedTxForOtp.id).catch(err => {
        setOtpError(`Validation refusée : ${err instanceof Error ? err.message : String(err)}.`);
        return false;
      });
      if (!ok) return;
      setSelectedTxForOtp(null);
      setDafNote('');
      setOtpError('');
    }
  };

  const handleSaveClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    // Wave 2 — succès affiché seulement après confirmation Supabase.
    try {
      const result = await createDailyCashClosure({
        currency: closureCurrency,
        physicalCountedBalance: Number(physicalCountedInput),
        justification: closureJustification,
        closedBy: `${currentUser.name} (${currentUser.jobTitle || 'DAF'})`
      });

      setClosureSuccessMessage(`✅ Clôture enregistrée avec succès ! Référence : ${result.pvReference}`);
      setTimeout(() => {
        setIsClosureModalOpen(false);
        setClosureSuccessMessage(null);
      }, 2500);
    } catch (err) {
      setClosureSuccessMessage(`❌ Clôture refusée : ${err instanceof Error ? err.message : String(err)}. Aucune écriture effectuée.`);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              SYSCOHADA / IFRS RDC • Taux : 1 USD = {exchangeRate} CDF
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Comptabilité Générale & Trésorerie d'Entreprise
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Tenue des journaux de recettes et dépenses, gestion des caisses physiques et comptes bancaires en bi-devise (USD/CDF), règle anti-fraude de double signature et clôture journalière obligatoire.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenNewTx('recette')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>+ Encaisser Recette</span>
          </button>

          <button
            onClick={() => handleOpenNewTx('depense')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <TrendingDown className="w-4 h-4" />
            <span>- Décaissement</span>
          </button>

          <button
            onClick={() => setIsClosureModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Clôture de Caisse</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bi-Devise */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recettes Validées</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            +${totalRecettesUSD.toLocaleString()} USD
          </div>
          <div className="text-xs font-mono text-slate-400">
            ≈ +{(totalRecettesUSD * exchangeRate).toLocaleString()} CDF
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dépenses Engagées</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">
            -${totalDepensesUSD.toLocaleString()} USD
          </div>
          <div className="text-xs font-mono text-slate-400">
            ≈ -{(totalDepensesUSD * exchangeRate).toLocaleString()} CDF
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solde Trésorerie Net</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            ${netBalanceUSD.toLocaleString()} USD
          </div>
          <div className="text-xs font-mono text-emerald-400">
            ≈ {netBalanceCDF.toLocaleString()} CDF disponible
          </div>
        </div>
      </div>

      {/* RÈGLE ANTI-FRAUDE : Encart d'explication Double Signature */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">Règle Anti-Fraude de Double Signature Équilibrée</h4>
            <p className="text-slate-400 leading-relaxed max-w-3xl">
              • <strong>Dépense &le; 100 USD (ou &le; 285 000 CDF)</strong> : Décaissement opérationnel direct avec reçu d'appoint.<br />
              • <strong>Décaissement &gt; 100 USD (ou &gt; 285 000 CDF)</strong> : Exige la validation du Manager (DG / Administrateur MALTHUS KILUMBA WA BANZA) <em>PLUS</em> la saisie du code OTP sécurisé émis vers le COMPTABLE.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('journal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'journal'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Journal SYSCOHADA ({transactions.length} écritures)
        </button>

        <button
          onClick={() => setActiveSubTab('clotures')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'clotures'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Procès-Verbaux de Clôture ({cashClosures.length})
        </button>

        <button
          onClick={() => setActiveSubTab('comptes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'comptes'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Soldes par Comptes & Caisses
        </button>
      </div>

      {/* VIEW 1: JOURNAL SYSCOHADA */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  filterType === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterType('recette')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  filterType === 'recette' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Recettes
              </button>
              <button
                onClick={() => setFilterType('depense')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  filterType === 'depense' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dépenses
              </button>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Affichage de {filteredTransactions.length} pièces comptables
            </span>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-4">Réf. Pièce</th>
                    <th className="p-4">Date & Compte</th>
                    <th className="p-4">Libellé & Bénéficiaire</th>
                    <th className="p-4">Compte Règlement</th>
                    <th className="p-4">Montant USD</th>
                    <th className="p-4">Montant CDF</th>
                    <th className="p-4">Statut & Double Signature</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                  {filteredTransactions.map(tx => {
                    const isExpense = tx.type === 'depense';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-amber-400">
                          {tx.pieceReference}
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="text-slate-300 font-mono">{tx.date}</div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                            Cpte {tx.accountCode}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs space-y-0.5">
                          <div className="font-bold text-white line-clamp-1">{tx.description}</div>
                          <div className="text-[11px] text-slate-400">{tx.beneficiaryOrPayer}</div>
                        </td>
                        <td className="p-4 text-slate-300 font-mono text-[11px]">
                          {tx.paymentAccount.replace(/_/g, ' ').toUpperCase()}
                        </td>
                        <td className={`p-4 font-mono font-bold text-sm ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isExpense ? '-' : '+'}${tx.amountUSD.toLocaleString()}
                        </td>
                        <td className="p-4 font-mono text-slate-400 text-xs">
                          {tx.amountCDF.toLocaleString()} CDF
                        </td>
                        <td className="p-4">
                          {tx.validationStatus === 'valide' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Validé
                            </span>
                          )}
                          {tx.validationStatus === 'en_attente_manager' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Visa Manager Requis
                            </span>
                          )}
                          {tx.validationStatus === 'en_attente_otp_daf' && (
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase inline-flex items-center gap-1 animate-pulse">
                              <KeyRound className="w-3 h-3" /> Attestation DAF requise
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1 whitespace-nowrap">
                          {tx.validationStatus === 'en_attente_manager' && (isDg || isAdminRh) && (
                            <button
                              onClick={() => approveTransactionManager(tx.id, currentUser.name).catch(err =>
                                console.error('[Wave 2] Visa manager refusé :', err)
                              )}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold cursor-pointer"
                              title="Valider en tant que Manager"
                            >
                              Approuver Manager
                            </button>
                          )}

                          {tx.validationStatus === 'en_attente_otp_daf' && (
                            <button
                              onClick={() => handleTriggerOtp(tx)}
                              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                              title="Attester en tant que DAF (vérification serveur)"
                            >
                              <KeyRound className="w-3 h-3" /> Attester (DAF)
                            </button>
                          )}

                          {tx.validationStatus === 'valide' && (
                            <span className="text-[11px] text-slate-500 italic">Conforme</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PROCÈS-VERBAUX DE CLÔTURE DE CAISSE */}
      {activeSubTab === 'clotures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Registre des Clôtures Journalières de Caisse</h3>
            <button
              onClick={() => setIsClosureModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle Clôture du Soir
            </button>
          </div>

          {/* Workflow de clôture : OPEN → COUNT → RECONCILE → VALIDATE → CLOSED */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Workflow : ouverture → comptage → rapprochement → validation → clôture</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Ouverture', 'Comptage', 'Rapprochement', 'Validation', 'Clôture'].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300">{i + 1}. {s}</span>
                  {i < arr.length - 1 && <span className="text-slate-600">→</span>}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Écarts non justifiés = anomalie à viser par le DAF. Clôtures validées : immuables (R4-23).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cashClosures.map(clot => (
              <div key={clot.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span className="font-mono font-bold text-sm text-white">{clot.pvReference}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                    {clot.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Date Clôture :</span>
                    <p className="font-mono text-white font-bold">{clot.date}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Devise Caisse :</span>
                    <p className="font-mono text-amber-400 font-bold">{clot.currency}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Solde Théorique :</span>
                    <p className="font-mono text-slate-300">
                      {clot.currency === 'USD' ? `$${clot.theoreticalBalance.toLocaleString()}` : `${clot.theoreticalBalance.toLocaleString()} CDF`}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Solde Compté Physiquement :</span>
                    <p className="font-mono text-emerald-400 font-bold">
                      {clot.currency === 'USD' ? `$${clot.physicalCountedBalance.toLocaleString()}` : `${clot.physicalCountedBalance.toLocaleString()} CDF`}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 text-xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Procès-Verbal & Justification :</span>
                  <p className="text-slate-300 italic">{clot.justification}</p>
                  <p className="text-[10px] text-slate-500 pt-1">Signé par {clot.closedBy} le {clot.closedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: COMPTES & CAISSES */}
      {activeSubTab === 'comptes' && (
        <div className="space-y-4">
          <p className="text-[11px] text-slate-500">
            Mouvements nets calculés sur les écritures <strong className="text-slate-300">validées</strong> réellement enregistrées.
            Soldes d'ouverture non configurés (R4-22) — aucun solde inventé.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              { key: 'caisse_usd', label: "Caisse Espèces Principale", currency: 'USD' },
              { key: 'caisse_cdf', label: 'Caisse Franc Congolais', currency: 'CDF' },
              { key: 'banque_rawbank_usd', label: 'Compte Rawbank USD', currency: 'USD' },
              { key: 'banque_equity_usd', label: 'Compte EquityBCDC USD', currency: 'USD' },
              { key: 'mpesa_cdf', label: 'Vodacom M-Pesa Entreprise', currency: 'CDF' },
              { key: 'airtel_money_usd', label: 'Airtel Money Business', currency: 'USD' },
            ] as const).map(acct => {
              const moves = transactions.filter(t => t.paymentAccount === acct.key && t.validationStatus === 'valide');
              if (moves.length === 0) {
                return (
                  <div key={acct.key} className="p-6 rounded-3xl bg-slate-900 border border-dashed border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">{acct.label}</span>
                    <p className="text-xs text-slate-500 italic">Non disponible — aucune écriture validée.</p>
                  </div>
                );
              }
              const net = moves.reduce((n, t) => n + (t.type === 'recette' ? 1 : -1) * (acct.currency === 'USD' ? t.amountUSD : t.amountCDF), 0);
              return (
                <div key={acct.key} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
                  <span className="text-xs font-bold text-slate-400 uppercase">{acct.label}</span>
                  <h4 className="text-xl font-black text-white">{net.toLocaleString()} {acct.currency}</h4>
                  <p className="text-xs text-slate-400">Mouvements nets ({moves.length} écriture{moves.length > 1 ? 's' : ''} validée{moves.length > 1 ? 's' : ''}) — hors solde d'ouverture.</p>
                </div>
              );
            })}
          </div>

          {/* Plan comptable réellement utilisé (dérivé, jamais inventé) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Plan comptable utilisé (OHADA — dérivé des écritures)</h4>
            <p className="text-[11px] text-slate-500">Comptes présents dans les écritures validées. Plan officiel complet : R4-19.</p>
            {(() => {
              const byCode = new Map<string, { label: string; total: number; count: number }>();
              for (const t of transactions.filter(x => x.validationStatus === 'valide')) {
                const cur = byCode.get(t.accountCode) ?? { label: t.category, total: 0, count: 0 };
                cur.total += t.type === 'recette' ? t.amountUSD : -t.amountUSD;
                cur.count += 1;
                byCode.set(t.accountCode, cur);
              }
              const rows = [...byCode.entries()];
              if (rows.length === 0) return <p className="text-xs text-slate-500 italic">Aucune donnée disponible.</p>;
              return (
                <div className="space-y-1.5">
                  {rows.map(([code, r]) => (
                    <div key={code} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-400 font-bold">{code} <span className="text-slate-400">• {r.label} ({r.count})</span></span>
                      <span className={`font-black ${r.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${r.total.toLocaleString()} USD</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================== MODAL NOUVELLE ÉCRITURE ==================== */}
      {isNewTxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                {txType === 'recette' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-lg font-bold text-white">
                  {txType === 'recette' ? 'Enregistrement Recette SYSCOHADA' : 'Saisie Décaissement Dépense'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewTxOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
              {txSaveError && <p className="text-xs text-rose-400 font-bold">{txSaveError}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Catégorie Comptable</label>
                  {txType === 'recette' ? (
                    <select
                      value={txCategory}
                      onChange={e => {
                        const cat = e.target.value as any;
                        setTxCategory(cat);
                        if (cat === 'ventes_services') setTxAccountCode('7061');
                        else if (cat === 'marchandises') setTxAccountCode('7071');
                        else setTxAccountCode('7581');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="ventes_services">7061 • Ventes Prestations Événementielles</option>
                      <option value="marchandises">7071 • Vente & Location Matériel</option>
                      <option value="subventions">7581 • Subventions & Sponsoring</option>
                    </select>
                  ) : (
                    <select
                      value={txCategory}
                      onChange={e => {
                        const cat = e.target.value as any;
                        setTxCategory(cat);
                        if (cat === 'energie') setTxAccountCode('6051');
                        else if (cat === 'loyers') setTxAccountCode('6221');
                        else if (cat === 'salaires') setTxAccountCode('6611');
                        else setTxAccountCode('6021');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="energie">6051 • Énergie & Carburant Groupes 500 kVA</option>
                      <option value="loyers">6221 • Loyers Dépôts & Bureaux</option>
                      <option value="salaires">6611 • Salaires & Primes Régisseurs</option>
                      <option value="stock">6021 • Consommables, Câbles & Accessoires</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Compte de Règlement</label>
                  <select
                    value={txPaymentAccount}
                    onChange={e => setTxPaymentAccount(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  >
                    <option value="banque_rawbank_usd">Rawbank USD</option>
                    <option value="banque_equity_usd">EquityBCDC USD</option>
                    <option value="caisse_usd">Caisse Espèces USD</option>
                    <option value="caisse_cdf">Caisse Espèces CDF</option>
                    <option value="mpesa_cdf">Vodacom M-Pesa CDF</option>
                    <option value="airtel_money_usd">Airtel Money USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description / Libellé de l'Opération</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Facture acompte sonorisation Sommet CEEAC"
                  value={txDescription}
                  onChange={e => setTxDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Montant en USD</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={txAmountUSD}
                    onChange={e => setTxAmountUSD(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-bold font-mono text-sm"
                  />
                  <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                    ≈ {(txAmountUSD * exchangeRate).toLocaleString()} CDF
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Client Payer / Bénéficiaire</label>
                  <input
                    type="text"
                    placeholder="Ex: SEP Congo, Vodacom, Présidence"
                    value={txBeneficiary}
                    onChange={e => setTxBeneficiary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Notice if transaction triggers Double Signature */}
              {txType === 'depense' && txAmountUSD > 100 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                  <KeyRound className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Attention :</strong> Dépense supérieure à $100 USD. Cette écriture nécessitera la validation du Manager + le code OTP du DAF.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTxOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Enregistrer l'Écriture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL DOUBLE SIGNATURE & OTP DAF ==================== */}
      {selectedTxForOtp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Validation DAF — attestation</h3>
                  <p className="text-[11px] text-slate-400">Double Signature Anti-Fraude (vérification serveur)</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxForOtp(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>Réf. Décaissement : <strong className="text-amber-400 font-mono">{selectedTxForOtp.pieceReference}</strong></p>
              <p>Libellé : <strong className="text-white">{selectedTxForOtp.description}</strong></p>
              <p>Montant Soumis : <strong className="text-rose-400 font-mono text-sm">${selectedTxForOtp.amountUSD.toLocaleString()} USD</strong></p>
              <p>Manager ayant approuvé : <strong className="text-slate-200">{selectedTxForOtp.managerApprovedBy || 'Direction Générale'}</strong></p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <p className="font-bold">Attestation DAF nominative</p>
              <p className="text-[11px] text-slate-400">
                En confirmant, vous attestez en tant que <strong className="text-white">{currentUser.name}</strong> avoir
                vérifié cette opération. Le serveur refuse toute validation si vous êtes l'initiateur ou le manager
                viseur (séparation des fonctions), et verrouille la transaction. Aucun code SMS : canal OTP réel non
                connecté (traçé comme tel, jamais simulé).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">Note de validation (optionnel)</label>
              <input
                type="text"
                value={dafNote}
                onChange={e => setDafNote(e.target.value)}
                placeholder="Ex : pièces vérifiées, visa donné"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white"
              />
              {otpError && <p className="text-xs text-rose-400 font-bold">{otpError}</p>}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedTxForOtp(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleValidateOtp}
                className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer shadow-lg"
              >
                Attester & Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CLÔTURE DE CAISSE ==================== */}
      {isClosureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Procès-Verbal de Clôture Journalière</h3>
              </div>
              <button
                onClick={() => setIsClosureModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {closureSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-center text-sm">
                {closureSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleSaveClosure} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Caisse à Clôturer</label>
                    <select
                      value={closureCurrency}
                      onChange={e => setClosureCurrency(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    >
                      <option value="USD">Caisse USD ($)</option>
                      <option value="CDF">Caisse CDF (Franc Congolais)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Solde Compté Physiquement</label>
                    <input
                      type="number"
                      required
                      value={physicalCountedInput}
                      onChange={e => setPhysicalCountedInput(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Observations & Justification d'Écart</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Comptage des coupures de 100$ conforme. Aucune anomalie détectée."
                    value={closureJustification}
                    onChange={e => setClosureJustification(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsClosureModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow"
                  >
                    Signer & Sceller le Procès-Verbal
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
