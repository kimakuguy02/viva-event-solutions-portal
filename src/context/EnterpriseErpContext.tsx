import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  EmployeeProfile,
  CrmClient,
  CrmInteraction,
  AccountingTransaction,
  DailyCashClosure,
  ProjectTask,
  DailyFieldReport,
  EquipmentLoanRecord,
  MaintenanceLog,
  MultichannelNotice,
  TaskPriority,
  TaskStatus,
  PaymentAccount
} from '../types/erp';
import {
  USD_TO_CDF_RATE,
  DOUBLE_SIGNATURE_THRESHOLD_USD,
  DOUBLE_SIGNATURE_THRESHOLD_CDF
} from '../data/enterpriseErpData';
import { saveToOfflineStore, loadFromOfflineStore, ensureErpCacheVersion } from '../services/offlineDb';
import { platformSession } from '../services/platformSession';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import type { DataSourceHealth } from './ProjectDataContext';
import { logAudit } from '../services/supabase/auditService';
import {
  isPgId,
  type StoredTxStatus,
  fetchTransactions as fetchPgTransactions,
  createTransaction as createPgTransaction,
  rpcApproveManager,
  rpcValidateDaf,
  rpcReverseTx,
  rpcValidateClosure,
  rpcSetOpeningBalance,
  isRpcMissing,
  fetchTasks as fetchPgTasks,
  createTask as createPgTask,
  setTaskStatus as setPgTaskStatus,
  createClosure as createPgClosure,
  fetchClosures as fetchPgClosures,
  fetchCrmClients as fetchPgCrmClients,
  saveCrmClient as savePgCrmClient,
  fetchCrmInteractions as fetchPgCrmInteractions,
  createCrmInteraction as createPgCrmInteraction,
} from '../services/supabase/erpService';
import { 
  setFirestoreDocument, 
  updateFirestoreDocument, 
  logAuditEvent
} from '../services/firebase';

export type ErpSourceKey = 'transactions' | 'tasks' | 'crmClients' | 'crmInteractions' | 'cashClosures';

export const ERP_SOURCE_LABELS: Record<ErpSourceKey, string> = {
  transactions: 'Transactions ERP',
  tasks: 'Tâches ERP',
  crmClients: 'Clients CRM',
  crmInteractions: 'Interactions CRM',
  cashClosures: 'Clôtures de caisse',
};

const ERP_SOURCE_KEYS: ErpSourceKey[] = ['transactions', 'tasks', 'crmClients', 'crmInteractions', 'cashClosures'];

interface EnterpriseErpContextType {
  // Organigramme & Personnel
  employees: EmployeeProfile[];
  updateEmployeePosition: (empId: string, updatedPos: Partial<EmployeeProfile['jobPosition']>) => void;
  // CRM (Clients & Prospects)
  crmClients: CrmClient[];
  crmInteractions: CrmInteraction[];
  addCrmClient: (client: Omit<CrmClient, 'id' | 'code' | 'totalRevenueUSD' | 'contractsCount' | 'lastInteractionDate'>) => void;
  updateCrmClientStatus: (clientId: string, status: CrmClient['status']) => void;
  addCrmInteraction: (interaction: Omit<CrmInteraction, 'id'>) => Promise<void>;

  // Comptabilité & Trésorerie (SYSCOHADA / IFRS RDC)
  transactions: AccountingTransaction[];
  cashClosures: DailyCashClosure[];
  exchangeRate: number; // 2 850 CDF
  addTransaction: (tx: {
    type: 'recette' | 'depense';
    category: AccountingTransaction['category'];
    accountCode: string;
    description: string;
    amountUSD: number;
    paymentAccount: PaymentAccount;
    beneficiaryOrPayer: string;
    performedBy: string;
    attachmentUrl?: string;
  }) => Promise<{
    id: string;
    requiresDoubleSignature: boolean;
    /** Statut réellement stocké ; null quand ce rôle ne peut pas relire la ligne. */
    validationStatus: AccountingTransaction['validationStatus'] | null;
  }>;
  approveTransactionManager: (txId: string, managerName: string) => Promise<void>;
  validateTransactionDaf: (txId: string) => Promise<boolean>;
  validateTransactionDafOtp: (txId: string, otpCode: string, dafName: string) => Promise<boolean>;
  reverseTransaction: (txId: string, reason: string, performedBy: string) => Promise<{ success: boolean; error?: string }>;
  createDailyCashClosure: (closure: {
    currency: 'USD' | 'CDF';
    physicalCountedBalance: number;
    justification?: string;
    closedBy: string;
  }) => Promise<DailyCashClosure>;
  /** Visa DAF d'une clôture (RPC closure_validate) ; aucun statut posé côté écran. */
  validateCashClosure: (closureId: string) => Promise<void>;
  /** Solde d'ouverture d'un compte de caisse (RPC opening_balance_set, 027). */
  setOpeningBalance: (account: string, currency: 'USD' | 'CDF', amount: number) => Promise<void>;

  // Gestion de Projets & Tâches
  tasks: ProjectTask[];
  fieldReports: DailyFieldReport[];
  addTask: (task: Omit<ProjectTask, 'id' | 'createdAt'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addDailyFieldReport: (report: Omit<DailyFieldReport, 'id' | 'signedAt'>) => void;

  // Gestion Actifs, Stocks & Prêts de Matériel
  loanRecords: EquipmentLoanRecord[];
  maintenanceLogs: MaintenanceLog[];
  issueEquipmentLoan: (loan: Omit<EquipmentLoanRecord, 'id' | 'voucherNumber' | 'status'>) => string;
  returnEquipmentLoan: (loanId: string, returnCondition: EquipmentLoanRecord['returnCondition'], inspectedBy: string, damageCostUSD?: number) => void;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;

  // Communication Multicanal
  notices: MultichannelNotice[];
  sendMultichannelNotice: (notice: Omit<MultichannelNotice, 'id' | 'sentAt' | 'status'>) => void;

  // Mode Hors Ligne & Réseau
  isOnline: boolean;
  lastSyncTimestamp: string;
  syncOfflineData: () => Promise<void>;

  // Provenance des données ERP : Postgres est la source de vérité.
  erpDataHealth: Record<ErpSourceKey, DataSourceHealth>;
  reloadErpDataSource: (key: ErpSourceKey) => void;
  reloadAllErpDataSources: () => void;
}

const EnterpriseErpContext = createContext<EnterpriseErpContextType | undefined>(undefined);

export const EnterpriseErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(new Date().toISOString());

  // Listen to network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTimestamp(new Date().toISOString());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // State initialization with IndexedDB / local storage
  const [employees, setEmployees] = useState<EmployeeProfile[]>(() => {
    const saved = localStorage.getItem('viva_erp_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [crmClients, setCrmClients] = useState<CrmClient[]>(() => {
    const saved = localStorage.getItem('viva_erp_crm_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [crmInteractions, setCrmInteractions] = useState<CrmInteraction[]>(() => {
    const saved = localStorage.getItem('viva_erp_crm_interactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<AccountingTransaction[]>(() => {
    const saved = localStorage.getItem('viva_erp_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [cashClosures, setCashClosures] = useState<DailyCashClosure[]>(() => {
    const saved = localStorage.getItem('viva_erp_cash_closures');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<ProjectTask[]>(() => {
    const saved = localStorage.getItem('viva_erp_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [fieldReports, setFieldReports] = useState<DailyFieldReport[]>(() => {
    const saved = localStorage.getItem('viva_erp_field_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [loanRecords, setLoanRecords] = useState<EquipmentLoanRecord[]>(() => {
    const saved = localStorage.getItem('viva_erp_loan_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('viva_erp_maintenance_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [notices, setNotices] = useState<MultichannelNotice[]>(() => {
    const saved = localStorage.getItem('viva_erp_notices');
    return saved ? JSON.parse(saved) : [];
  });

  const [erpDataHealth, setErpDataHealth] = useState<Record<ErpSourceKey, DataSourceHealth>>({
    transactions: { status: 'loading' },
    tasks: { status: 'loading' },
    crmClients: { status: 'loading' },
    crmInteractions: { status: 'loading' },
    cashClosures: { status: 'loading' },
  });

  // Load from IndexedDB on startup
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Les sessions antérieures ont pu mettre en cache les seeds fictifs : purge
      // une fois par version de cache avant de relire quoi que ce soit de local.
      await ensureErpCacheVersion();
      if (cancelled) return;
      const [tx, closures, tsk, reports, loans, clients, interactions, notes] = await Promise.all([
        loadFromOfflineStore<AccountingTransaction>('erp_transactions'),
        loadFromOfflineStore<DailyCashClosure>('erp_closures'),
        loadFromOfflineStore<ProjectTask>('erp_tasks'),
        loadFromOfflineStore<DailyFieldReport>('erp_reports'),
        loadFromOfflineStore<EquipmentLoanRecord>('erp_loans'),
        loadFromOfflineStore<CrmClient>('erp_clients'),
        loadFromOfflineStore<CrmInteraction>('erp_interactions'),
        loadFromOfflineStore<MultichannelNotice>('erp_notices')
      ]);
      if (cancelled) return;
      if (tx.length) setTransactions(tx);
      if (closures.length) setCashClosures(closures);
      if (tsk.length) setTasks(tsk);
      if (reports.length) setFieldReports(reports);
      if (loans.length) setLoanRecords(loans);
      if (clients.length) setCrmClients(clients);
      if (interactions.length) setCrmInteractions(interactions);
      if (notes.length) setNotices(notes);
    })();
    return () => { cancelled = true; };
  }, []);

  // Wave 2 — Postgres est la source de vérité ERP. Un succès (même vide)
  // remplace l'état local ; un échec est exposé via erpDataHealth.
  const loadErpDataSource = useCallback(async (key: ErpSourceKey) => {
    setErpDataHealth(h => ({ ...h, [key]: { status: 'loading' } }));
    try {
      switch (key) {
        case 'transactions': setTransactions(await fetchPgTransactions()); break;
        case 'tasks': setTasks(await fetchPgTasks()); break;
        case 'crmClients': setCrmClients(await fetchPgCrmClients()); break;
        case 'crmInteractions': setCrmInteractions(await fetchPgCrmInteractions()); break;
        case 'cashClosures': setCashClosures(await fetchPgClosures()); break;
      }
      setErpDataHealth(h => ({ ...h, [key]: { status: 'ok' } }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[Postgres] Lecture « ${ERP_SOURCE_LABELS[key]} » impossible : ${message}`);
      setErpDataHealth(h => ({ ...h, [key]: { status: 'error', message } }));
    }
  }, []);

  const reloadErpDataSource = useCallback((key: ErpSourceKey) => {
    void loadErpDataSource(key);
  }, [loadErpDataSource]);

  const reloadAllErpDataSources = useCallback(() => {
    for (const key of ERP_SOURCE_KEYS) void loadErpDataSource(key);
  }, [loadErpDataSource]);

  // Données ERP : RLS exige une session staff ; rechargées à chaque changement.
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setErpDataHealth({
        transactions: { status: 'error', message: 'Supabase non configuré.' },
        tasks: { status: 'error', message: 'Supabase non configuré.' },
        crmClients: { status: 'error', message: 'Supabase non configuré.' },
        crmInteractions: { status: 'error', message: 'Supabase non configuré.' },
        cashClosures: { status: 'error', message: 'Supabase non configuré.' },
      });
      return;
    }
    let active = true;
    const run = (hasSession: boolean) => {
      if (!active) return;
      for (const key of ERP_SOURCE_KEYS) {
        if (hasSession) void loadErpDataSource(key);
        else setErpDataHealth(h => ({ ...h, [key]: { status: 'idle', message: 'Session staff requise.' } }));
      }
    };
    supabase.auth.getSession().then(({ data }) => run(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => run(Boolean(session)));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadErpDataSource]);

  // Les collections ERP (transactions, tâches, clients) sont portées par
  // Postgres : plus d'écoute Firestore qui réinjecterait des données legacy.

  // Sync to IndexedDB & localStorage on change
  useEffect(() => {
    saveToOfflineStore('erp_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    saveToOfflineStore('erp_closures', cashClosures);
  }, [cashClosures]);

  useEffect(() => {
    saveToOfflineStore('erp_tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    saveToOfflineStore('erp_reports', fieldReports);
  }, [fieldReports]);

  useEffect(() => {
    saveToOfflineStore('erp_loans', loanRecords);
  }, [loanRecords]);

  useEffect(() => {
    saveToOfflineStore('erp_clients', crmClients);
  }, [crmClients]);

  useEffect(() => {
    saveToOfflineStore('erp_interactions', crmInteractions);
  }, [crmInteractions]);

  useEffect(() => {
    saveToOfflineStore('erp_notices', notices);
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('viva_erp_employees', JSON.stringify(employees));
  }, [employees]);

  // ==================== ACTIONS ====================

  const updateEmployeePosition = (empId: string, updatedPos: Partial<EmployeeProfile['jobPosition']>) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          jobPosition: { ...emp.jobPosition, ...updatedPos }
        };
      }
      return emp;
    }));
  };

  const addCrmClient = async (client: Omit<CrmClient, 'id' | 'code' | 'totalRevenueUSD' | 'contractsCount' | 'lastInteractionDate'>) => {
    const newId = `crm-${Date.now()}`;
    const newClient: CrmClient = {
      ...client,
      id: newId,
      code: `CLT-VIVA-${Math.floor(100 + Math.random() * 900)}`,
      totalRevenueUSD: 0,
      contractsCount: 0,
      lastInteractionDate: new Date().toISOString().split('T')[0]
    };
    // Wave 2 — SSOT Supabase d'abord (appariement par code).
    if (isSupabaseConfigured()) {
      try {
        await savePgCrmClient({
          code: newClient.code,
          name: newClient.name,
          organization: newClient.organization,
          category: newClient.category,
          status: newClient.status,
          email: newClient.email,
          phone: newClient.phone,
          city: newClient.city,
          notes: newClient.notes,
        });
        await logAudit('CRM_CLIENT_CREATED', 'clients', newClient.code, { name: newClient.name });
      } catch (e) {
        console.error('[Supabase Wave 2] Création client refusée :', e);
        throw e;
      }
    }
    setCrmClients(prev => [newClient, ...prev]);

    setFirestoreDocument('crm_clients', newId, newClient)
      .catch(e => console.warn('[Firebase ERP] CRM client persist notice:', e));
    
    logAuditEvent({
      action: 'CRM_CLIENT_CREATED',
      resource: 'crm_clients',
      resourceId: newId,
      details: `Création client : ${newClient.name} (${newClient.code})`
    });
  };

  const updateCrmClientStatus = async (clientId: string, status: CrmClient['status']) => {
    const current = crmClients.find(c => c.id === clientId);
    // Wave 2 — SSOT Supabase d'abord (par code).
    if (isSupabaseConfigured() && current) {
      try {
        await savePgCrmClient({
          code: current.code,
          name: current.name,
          organization: current.organization,
          category: current.category,
          status,
          email: current.email,
          phone: current.phone,
          city: current.city,
          notes: current.notes,
        });
        await logAudit('CRM_CLIENT_STATUS_UPDATED', 'clients', current.code, { status });
      } catch (e) {
        console.error('[Supabase Wave 2] Statut client refusé :', e);
        throw e;
      }
    }
    setCrmClients(prev => prev.map(c => c.id === clientId ? { ...c, status } : c));
    updateFirestoreDocument('crm_clients', clientId, { status })
      .catch(e => console.warn('[Firebase ERP] CRM client status update notice:', e));
  };

  const addCrmInteraction = async (interaction: Omit<CrmInteraction, 'id'>) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Enregistrement de l’échange indisponible : Supabase doit être configuré. Aucune écriture locale seule ne sera créée.');
    }

    // Les clients issus de PG portent id = code ; ceux créés dans la session
    // portent un id local. La résolution serveur se fait toujours par code.
    const targetClient = crmClients.find(c => c.id === interaction.clientId);
    const clientCode = targetClient?.code || interaction.clientId;

    const created = await createPgCrmInteraction({
      clientCode,
      type: interaction.type,
      summary: interaction.summary,
      nextAction: interaction.nextAction,
      nextFollowUpDate: interaction.nextFollowUpDate,
    });

    // Le trigger serveur est l'autorité sur l'auteur ; on complète seulement
    // l'affichage local avec l'identité de session.
    const enriched: CrmInteraction = {
      ...created,
      clientName: created.clientName || interaction.clientName,
      authorName: created.authorName || interaction.authorName,
    };

    setCrmInteractions(prev => [enriched, ...prev.filter(i => i.id !== enriched.id)]);

    setCrmClients(prev => prev.map(c => {
      if (c.id !== interaction.clientId) return c;
      const day = enriched.date ? enriched.date.split(' ')[0] : c.lastInteractionDate;
      return { ...c, lastInteractionDate: day };
    }));
  };

  // COMPTABILITÉ & TRÉSORERIE (RÈGLE DOUBLE SIGNATURE STRICTE)
  // Les écritures financières sont persistées uniquement dans Supabase ; les
  // visas de validation sont exécutés par les RPC serveur.
  const addTransaction = async (tx: {
    type: 'recette' | 'depense';
    category: AccountingTransaction['category'];
    accountCode: string;
    description: string;
    amountUSD: number;
    paymentAccount: PaymentAccount;
    beneficiaryOrPayer: string;
    performedBy: string;
    attachmentUrl?: string;
  }) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Écriture financière indisponible : Supabase doit être configuré. Aucune écriture locale ou legacy ne sera créée.');
    }

    const amountCDF = tx.amountUSD * USD_TO_CDF_RATE;
    // Règle anti-fraude : cette valeur n'est qu'une intention. Le trigger serveur
    // (migration 026) re-dérive le seuil et le statut depuis les montants stockés.
    const requiresDouble = tx.type === 'depense' && (tx.amountUSD > DOUBLE_SIGNATURE_THRESHOLD_USD || amountCDF > DOUBLE_SIGNATURE_THRESHOLD_CDF);
    const newId = `tx-${Date.now()}`;

    const newTx: AccountingTransaction = {
      id: newId,
      pieceReference: `${tx.type === 'recette' ? 'FAC-REC' : 'BL-DEP'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      type: tx.type,
      category: tx.category,
      accountCode: tx.accountCode,
      description: tx.description,
      amountUSD: tx.amountUSD,
      amountCDF: amountCDF,
      paymentAccount: tx.paymentAccount,
      beneficiaryOrPayer: tx.beneficiaryOrPayer,
      performedBy: tx.performedBy,
      requiresDoubleSignature: requiresDouble,
      validationStatus: 'en_attente_manager',
      attachmentUrl: tx.attachmentUrl
    };

    // Wave 2 — SSOT Supabase d'abord (le trigger 026 verrouille seuil et statut).
    let stored: StoredTxStatus | null = null;
    try {
      stored = await createPgTransaction({
        type: newTx.type,
        category: newTx.category,
        accountCode: newTx.accountCode,
        description: newTx.description,
        amountUSD: newTx.amountUSD,
        amountCDF: newTx.amountCDF,
        paymentAccount: newTx.paymentAccount,
        beneficiaryOrPayer: newTx.beneficiaryOrPayer,
        requiresDoubleSignature: requiresDouble,
        pieceReference: newTx.pieceReference,
      });
      await logAudit('ERP_TRANSACTION_CREATED', 'erp_transactions', newTx.pieceReference, {
        amountUSD: newTx.amountUSD,
      });
    } catch (e) {
      console.error('[Supabase Wave 2] Création transaction refusée :', e);
      throw e;
    }

    if (!stored) {
      // Écriture acceptée mais non relisible par ce rôle (RLS select) : on relit
      // la source Postgres au lieu d'afficher un statut inventé.
      await loadErpDataSource('transactions');
      return { id: newTx.pieceReference, requiresDoubleSignature: requiresDouble, validationStatus: null };
    }

    const confirmed: AccountingTransaction = {
      ...newTx,
      id: stored.pieceReference,
      pieceReference: stored.pieceReference,
      requiresDoubleSignature: stored.requiresDoubleSignature,
      validationStatus: stored.validationStatus,
    };
    setTransactions(prev => [
      confirmed,
      ...prev.filter(t => t.pieceReference !== confirmed.pieceReference),
    ]);

    return {
      id: confirmed.id,
      requiresDoubleSignature: confirmed.requiresDoubleSignature,
      validationStatus: confirmed.validationStatus,
    };
  };

  const approveTransactionManager = async (txId: string, managerName: string) => {
    const target = transactions.find(t => t.id === txId);
    if (!target) throw new Error('Transaction introuvable.');
    if (!isSupabaseConfigured()) {
      throw new Error('Visa financier indisponible : Supabase doit être configuré. Aucune validation locale ne sera effectuée.');
    }

    try {
      await rpcApproveManager(target.pieceReference);
    } catch (e) {
      if (isRpcMissing(e)) {
        throw new Error('Visa manager indisponible : la RPC erp_approve_manager doit être déployée. Aucune validation locale ne sera effectuée.');
      }
      throw e;
    }

    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          validationStatus: 'en_attente_otp_daf',
          managerApprovedBy: managerName
        };
      }
      return t;
    }));
  };

  // La transition DAF est autorisée uniquement par la RPC qui vérifie en base
  // la séparation des fonctions. Aucun repli client ou Firestore n'est admis.
  const validateTransactionDaf = async (txId: string): Promise<boolean> => {
    const targetTx = transactions.find(t => t.id === txId);
    if (!targetTx) throw new Error('Transaction introuvable.');
    if (!isSupabaseConfigured()) {
      throw new Error('Validation financière indisponible : Supabase doit être configuré. Aucune validation locale ne sera effectuée.');
    }

    try {
      await rpcValidateDaf(targetTx.pieceReference);
    } catch (e) {
      if (isRpcMissing(e)) {
        throw new Error('Validation DAF indisponible : la RPC erp_validate_daf doit être déployée. Aucune validation locale ne sera effectuée.');
      }
      throw e;
    }

    const verifiedAt = new Date().toISOString();

    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          validationStatus: 'valide',
          dafOtpVerifiedAt: verifiedAt
        };
      }
      return t;
    }));

    return true;
  };

  // Alias legacy conservé pour compatibilité d'appel (ne plus utiliser).
  const validateTransactionDafOtp = async (_txId: string, _otpCode: string, _dafName: string): Promise<boolean> => {
    console.warn('[DEPRECATED] validateTransactionDafOtp supprimé (OTP simulé) : utiliser validateTransactionDaf.');
    return validateTransactionDaf(_txId);
  };

  // Reversal / Contrepassation (Immutability guarantee: an approved transaction cannot be deleted)
  const reverseTransaction = async (txId: string, reason: string, performedBy: string): Promise<{ success: boolean; error?: string }> => {
    const original = transactions.find(t => t.id === txId);
    if (!original) {
      return { success: false, error: "Transaction introuvable." };
    }
    if (original.validationStatus !== 'valide') {
      return { success: false, error: "Seule une transaction validée peut faire l'objet d'une contrepassation." };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Contrepassation indisponible : Supabase doit être configuré. Aucune écriture locale ne sera créée.' };
    }

    const reversalId = `tx-rev-${Date.now()}`;
    const reversalTx: AccountingTransaction = {
      id: reversalId,
      pieceReference: `CONTRE-${original.pieceReference}`,
      date: new Date().toISOString().split('T')[0],
      type: original.type === 'recette' ? 'depense' : 'recette', // Inverted direction
      category: original.category,
      accountCode: original.accountCode,
      description: `CONTREPASSATION D'ANNULATION : ${original.pieceReference} - Motif : ${reason}`,
      amountUSD: original.amountUSD,
      amountCDF: original.amountCDF,
      paymentAccount: original.paymentAccount,
      beneficiaryOrPayer: `Régularisation ${original.beneficiaryOrPayer}`,
      performedBy,
      requiresDoubleSignature: false,
      validationStatus: 'valide'
    };

    let serverRef: string;
    try {
      serverRef = await rpcReverseTx(original.pieceReference, reason);
    } catch (e) {
      const message = isRpcMissing(e)
        ? 'Contrepassation indisponible : la RPC erp_reverse_tx doit être déployée.'
        : e instanceof Error ? e.message : String(e);
      return { success: false, error: message };
    }

    const persistedReversal = {
      ...reversalTx,
      id: serverRef,
      pieceReference: serverRef,
    };
    setTransactions(prev => [persistedReversal, ...prev]);

    return { success: true };
  };

  const createDailyCashClosure = async (closure: {
    currency: 'USD' | 'CDF';
    physicalCountedBalance: number;
    justification?: string;
    closedBy: string;
  }): Promise<DailyCashClosure> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Clôture financière indisponible : Supabase doit être configuré. Aucune clôture locale ou legacy ne sera créée.');
    }

    // La RPC calcule les mouvements, l'écart, le statut et la référence côté
    // serveur ; aucun montant théorique fourni par le navigateur n'est accepté.
    try {
      const persistedClosure = await createPgClosure({
        currency: closure.currency,
        counted: closure.physicalCountedBalance,
        justification: closure.justification,
      });
      const newClosure = { ...persistedClosure, closedBy: closure.closedBy };
      setCashClosures(prev => [newClosure, ...prev]);
      return newClosure;
    } catch (e) {
      console.error('[Supabase Wave 2] Clôture refusée :', e);
      throw e;
    }
  };

  // Visa DAF : la RPC trace l'approbation et l'audit en base ; l'écran relit
  // Postgres ensuite, jamais il ne décore le statut de la clôture.
  const validateCashClosure = async (closureId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Visa de clôture indisponible : Supabase doit être configuré. Aucun visa local n’est enregistré.');
    }
    await rpcValidateClosure(closureId);
    await loadErpDataSource('cashClosures');
  };

  // Solde d'ouverture : indispensable pour qu'une clôture puisse devenir conforme.
  const setOpeningBalance = async (
    account: string,
    currency: 'USD' | 'CDF',
    amount: number,
  ): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error("Solde d'ouverture indisponible : Supabase doit être configuré. Aucun solde local n’est enregistré.");
    }
    await rpcSetOpeningBalance(account, currency, amount);
  };

  // TÂCHES & RAPPORTS — Wave 2 : les nouvelles tâches prennent un UUID PG
  // comme id canonique (même id dans le miroir Firestore).
  const addTask = async (task: Omit<ProjectTask, 'id' | 'createdAt'>) => {
    let newId = `tsk-${Date.now()}`;
    if (isSupabaseConfigured()) {
      try {
        newId = await createPgTask({
          projectCode: task.projectCode,
          title: task.title,
          description: task.description,
          priority: task.priority,
        });
        await logAudit('ERP_TASK_CREATED', 'erp_tasks', newId, { title: task.title });
      } catch (e) {
        console.error('[Supabase Wave 2] Création tâche refusée :', e);
        throw e;
      }
    }
    const newTask: ProjectTask = {
      ...task,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);

    setFirestoreDocument('erp_tasks', newId, newTask)
      .catch(e => console.warn('[Firebase LEGACY mirror] Task persist notice:', e));

    logAuditEvent({
      action: 'ERP_TASK_CREATED',
      resource: 'erp_tasks',
      resourceId: newId,
      details: `Tâche créée : ${newTask.title} (${newTask.projectCode})`
    });
    platformSession.logDomainEvent('tache', `Tâche créée : ${newTask.title} (${newTask.projectCode})`);
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const completedAt = status === 'termine' ? new Date().toISOString().split('T')[0] : undefined;
    // Wave 2 — tâches PG (uuid) via Supabase ; tâches legacy (tsk-*) en Firestore seul.
    if (isSupabaseConfigured() && isPgId(taskId)) {
      try {
        await setPgTaskStatus(taskId, status, completedAt);
        await logAudit('ERP_TASK_STATUS_UPDATED', 'erp_tasks', taskId, { status });
      } catch (e) {
        console.error('[Supabase Wave 2] Statut tâche refusé :', e);
        throw e;
      }
    }
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status,
          ...(completedAt ? { completedAt } : {})
        };
      }
      return t;
    }));

    updateFirestoreDocument('erp_tasks', taskId, {
      status,
      ...(completedAt ? { completedAt } : {})
    }).catch(e => console.warn('[Firebase LEGACY mirror] Task status update notice:', e));
  };

  const addDailyFieldReport = (report: Omit<DailyFieldReport, 'id' | 'signedAt'>) => {
    const newReport: DailyFieldReport = {
      ...report,
      id: `rep-${Date.now()}`,
      signedAt: new Date().toLocaleString('fr-FR')
    };
    setFieldReports(prev => [newReport, ...prev]);
  };

  // PRÊTS DE MATÉRIEL (TRAÇABILITÉ QUI, QUOI, QUAND, ÉTAT)
  const issueEquipmentLoan = (loan: Omit<EquipmentLoanRecord, 'id' | 'voucherNumber' | 'status'>): string => {
    const voucher = `BON-PRET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLoan: EquipmentLoanRecord = {
      ...loan,
      id: `loan-${Date.now()}`,
      voucherNumber: voucher,
      status: 'en_cours'
    };
    setLoanRecords(prev => [newLoan, ...prev]);

    sendMultichannelNotice({
      channel: 'sms',
      targetRecipient: loan.borrowerPhone,
      recipientName: loan.borrowerName,
      subject: `Prêt Matériel ${voucher}`,
      content: `VIVA ERP : Bon de prêt ${voucher} émis pour ${loan.equipmentName}. Restitution attendue le ${loan.expectedReturnDate}.`,
      category: 'alerte_securite'
    });

    return voucher;
  };

  const returnEquipmentLoan = (
    loanId: string,
    returnCondition: EquipmentLoanRecord['returnCondition'],
    inspectedBy: string,
    damageCostUSD?: number
  ) => {
    setLoanRecords(prev => prev.map(l => {
      if (l.id === loanId) {
        const isDamaged = returnCondition === 'degrade' || returnCondition === 'en_panne';
        return {
          ...l,
          actualReturnDate: new Date().toLocaleString('fr-FR'),
          returnCondition,
          status: isDamaged ? 'incident_signale' : 'restitue',
          damageCostUSD: damageCostUSD || 0,
          inspectedBy
        };
      }
      return l;
    }));
  };

  const addMaintenanceLog = (log: Omit<MaintenanceLog, 'id'>) => {
    const newLog: MaintenanceLog = {
      ...log,
      id: `maint-${Date.now()}`
    };
    setMaintenanceLogs(prev => [newLog, ...prev]);
  };

  // COMMUNICATION MULTICANAL
  const sendMultichannelNotice = (notice: Omit<MultichannelNotice, 'id' | 'sentAt' | 'status'>) => {
    const newNotice: MultichannelNotice = {
      ...notice,
      id: `not-${Date.now()}`,
      sentAt: new Date().toLocaleString('fr-FR'),
      status: 'delivre'
    };
    setNotices(prev => [newNotice, ...prev]);
  };

  const syncOfflineData = async () => {
    setLastSyncTimestamp(new Date().toISOString());
  };

  return (
    <EnterpriseErpContext.Provider
      value={{
        employees,
        updateEmployeePosition,
        crmClients,
        crmInteractions,
        addCrmClient,
        updateCrmClientStatus,
        addCrmInteraction,
        transactions,
        cashClosures,
        exchangeRate: USD_TO_CDF_RATE,
        addTransaction,
        approveTransactionManager,
        validateTransactionDaf,
        validateTransactionDafOtp,
        reverseTransaction,
        createDailyCashClosure,
        validateCashClosure,
        setOpeningBalance,
        tasks,
        fieldReports,
        addTask,
        updateTaskStatus,
        addDailyFieldReport,
        loanRecords,
        maintenanceLogs,
        issueEquipmentLoan,
        returnEquipmentLoan,
        addMaintenanceLog,
        notices,
        sendMultichannelNotice,
        isOnline,
        lastSyncTimestamp,
        syncOfflineData,
        erpDataHealth,
        reloadErpDataSource,
        reloadAllErpDataSources
      }}
    >
      {children}
    </EnterpriseErpContext.Provider>
  );
};

export const useEnterpriseErp = () => {
  const context = useContext(EnterpriseErpContext);
  if (!context) {
    throw new Error('useEnterpriseErp must be used within an EnterpriseErpProvider');
  }
  return context;
};
