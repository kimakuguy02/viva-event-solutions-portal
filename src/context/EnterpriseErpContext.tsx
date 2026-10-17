import React, { createContext, useContext, useState, useEffect } from 'react';
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
  INITIAL_EMPLOYEES,
  INITIAL_CRM_CLIENTS,
  INITIAL_CRM_INTERACTIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_CASH_CLOSURES,
  INITIAL_TASKS,
  INITIAL_FIELD_REPORTS,
  INITIAL_LOAN_RECORDS,
  INITIAL_MAINTENANCE_LOGS,
  INITIAL_NOTICES,
  USD_TO_CDF_RATE,
  DOUBLE_SIGNATURE_THRESHOLD_USD,
  DOUBLE_SIGNATURE_THRESHOLD_CDF
} from '../data/enterpriseErpData';
import { saveToOfflineStore, loadFromOfflineStore } from '../services/offlineDb';
import { platformSession } from '../services/platformSession';
import { isSupabaseConfigured } from '../services/supabase';
import { logAudit } from '../services/supabase/auditService';
import {
  isPgId,
  fetchTransactions as fetchPgTransactions,
  createTransaction as createPgTransaction,
  rpcApproveManager,
  rpcValidateDaf,
  rpcReverseTx,
  isRpcMissing,
  fetchTasks as fetchPgTasks,
  createTask as createPgTask,
  setTaskStatus as setPgTaskStatus,
  createClosure as createPgClosure,
  fetchClosures as fetchPgClosures,
  fetchCrmClients as fetchPgCrmClients,
  saveCrmClient as savePgCrmClient,
} from '../services/supabase/erpService';
import { 
  setFirestoreDocument, 
  updateFirestoreDocument, 
  subscribeFirestoreCollection, 
  logAuditEvent,
  auth
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface EnterpriseErpContextType {
  // Organigramme & Personnel
  employees: EmployeeProfile[];
  updateEmployeePosition: (empId: string, updatedPos: Partial<EmployeeProfile['jobPosition']>) => void;

  // CRM (Clients & Prospects)
  crmClients: CrmClient[];
  crmInteractions: CrmInteraction[];
  addCrmClient: (client: Omit<CrmClient, 'id' | 'code' | 'totalRevenueUSD' | 'contractsCount' | 'lastInteractionDate'>) => void;
  updateCrmClientStatus: (clientId: string, status: CrmClient['status']) => void;
  addCrmInteraction: (interaction: Omit<CrmInteraction, 'id'>) => void;

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
  }) => Promise<{ id: string; requiresDoubleSignature: boolean }>;
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
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [crmClients, setCrmClients] = useState<CrmClient[]>(() => {
    const saved = localStorage.getItem('viva_erp_crm_clients');
    return saved ? JSON.parse(saved) : INITIAL_CRM_CLIENTS;
  });

  const [crmInteractions, setCrmInteractions] = useState<CrmInteraction[]>(() => {
    const saved = localStorage.getItem('viva_erp_crm_interactions');
    return saved ? JSON.parse(saved) : INITIAL_CRM_INTERACTIONS;
  });

  const [transactions, setTransactions] = useState<AccountingTransaction[]>(() => {
    const saved = localStorage.getItem('viva_erp_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [cashClosures, setCashClosures] = useState<DailyCashClosure[]>(() => {
    const saved = localStorage.getItem('viva_erp_cash_closures');
    return saved ? JSON.parse(saved) : INITIAL_CASH_CLOSURES;
  });

  const [tasks, setTasks] = useState<ProjectTask[]>(() => {
    const saved = localStorage.getItem('viva_erp_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [fieldReports, setFieldReports] = useState<DailyFieldReport[]>(() => {
    const saved = localStorage.getItem('viva_erp_field_reports');
    return saved ? JSON.parse(saved) : INITIAL_FIELD_REPORTS;
  });

  const [loanRecords, setLoanRecords] = useState<EquipmentLoanRecord[]>(() => {
    const saved = localStorage.getItem('viva_erp_loan_records');
    return saved ? JSON.parse(saved) : INITIAL_LOAN_RECORDS;
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('viva_erp_maintenance_logs');
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_LOGS;
  });

  const [notices, setNotices] = useState<MultichannelNotice[]>(() => {
    const saved = localStorage.getItem('viva_erp_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  // Load from IndexedDB on startup
  useEffect(() => {
    loadFromOfflineStore('erp_transactions', INITIAL_TRANSACTIONS).then(data => setTransactions(data));
    loadFromOfflineStore('erp_closures', INITIAL_CASH_CLOSURES).then(data => setCashClosures(data));
    loadFromOfflineStore('erp_tasks', INITIAL_TASKS).then(data => setTasks(data));
    loadFromOfflineStore('erp_reports', INITIAL_FIELD_REPORTS).then(data => setFieldReports(data));
    loadFromOfflineStore('erp_loans', INITIAL_LOAN_RECORDS).then(data => setLoanRecords(data));
    loadFromOfflineStore('erp_clients', INITIAL_CRM_CLIENTS).then(data => setCrmClients(data));
    loadFromOfflineStore('erp_interactions', INITIAL_CRM_INTERACTIONS).then(data => setCrmInteractions(data));
    loadFromOfflineStore('erp_notices', INITIAL_NOTICES).then(data => setNotices(data));
  }, []);

  // Wave 2 — overlay Supabase (SSOT) : PG gagne par clé stable
  // (piece_reference, code, uuid) ; legacy conservé en transition.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    (async () => {
      try {
        const [pgTx, pgTasks, pgClients, pgClosures] = await Promise.all([
          fetchPgTransactions().catch(e => {
            console.warn('[Supabase Wave 2] Transactions indisponibles :', e);
            return [];
          }),
          fetchPgTasks().catch(e => {
            console.warn('[Supabase Wave 2] Tâches ERP indisponibles :', e);
            return [];
          }),
          fetchPgCrmClients().catch(e => {
            console.warn('[Supabase Wave 2] Clients indisponibles :', e);
            return [];
          }),
          fetchPgClosures().catch(e => {
            console.warn('[Supabase Wave 2] Clôtures indisponibles :', e);
            return [];
          }),
        ]);
        if (cancelled) return;
        if (pgTx.length > 0) {
          setTransactions(prev => {
            const overlay = new Map<string, AccountingTransaction>();
            for (const t of pgTx) overlay.set(t.pieceReference, t);
            const merged = prev.map(t => overlay.get(t.pieceReference) ?? t);
            for (const t of pgTx) {
              if (!merged.some(x => x.pieceReference === t.pieceReference)) merged.push(t);
            }
            return merged;
          });
        }
        if (pgTasks.length > 0) {
          setTasks(prev => {
            const overlay = new Map<string, ProjectTask>();
            for (const t of pgTasks) overlay.set(t.id, t);
            const merged = prev.map(t => overlay.get(t.id) ?? t);
            for (const t of pgTasks) {
              if (!merged.some(x => x.id === t.id)) merged.push(t);
            }
            return merged;
          });
        }
        if (pgClients.length > 0) {
          setCrmClients(prev => {
            const overlay = new Map<string, CrmClient>();
            for (const c of pgClients) overlay.set(c.code, c);
            const merged = prev.map(c => overlay.get(c.code) ?? c);
            for (const c of pgClients) {
              if (!merged.some(x => x.code === c.code)) merged.push(c);
            }
            return merged;
          });
        }
        if (pgClosures.length > 0) {
          setCashClosures(prev => {
            const ids = new Set(prev.map(c => c.id));
            return [...prev, ...pgClosures.filter(c => !ids.has(c.id))];
          });
        }
      } catch (e) {
        console.warn('[Supabase Wave 2] Overlay ERP indisponible :', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Real-time synchronization with Firestore for ERP transactions & tasks
  useEffect(() => {
    let unsubTxs: (() => void) | undefined;
    let unsubTasks: (() => void) | undefined;
    let unsubCrm: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubTxs) { unsubTxs(); unsubTxs = undefined; }
      if (unsubTasks) { unsubTasks(); unsubTasks = undefined; }
      if (unsubCrm) { unsubCrm(); unsubCrm = undefined; }

      // Only subscribe to protected collections when user has an active session and staff/admin role
      const isStaffOrAdmin = user && (
        user.email?.endsWith('@viva-eventsolutions.cd') ||
        user.email === 'misterk1502@gmail.com'
      );

      if (isStaffOrAdmin) {
        try {
          unsubTxs = subscribeFirestoreCollection<AccountingTransaction>('erp_transactions', (items) => {
            if (items && items.length > 0) {
              setTransactions(prev => {
                const incomingIds = new Set(items.map(t => t.id));
                const nonOverlapping = prev.filter(p => !incomingIds.has(p.id));
                return [...items, ...nonOverlapping];
              });
            }
          });

          unsubTasks = subscribeFirestoreCollection<ProjectTask>('erp_tasks', (items) => {
            if (items && items.length > 0) {
              setTasks(prev => {
                const incomingIds = new Set(items.map(t => t.id));
                const nonOverlapping = prev.filter(p => !incomingIds.has(p.id));
                return [...items, ...nonOverlapping];
              });
            }
          });

          unsubCrm = subscribeFirestoreCollection<CrmClient>('crm_clients', (items) => {
            if (items && items.length > 0) {
              setCrmClients(prev => {
                const incomingIds = new Set(items.map(c => c.id));
                const nonOverlapping = prev.filter(p => !incomingIds.has(p.id));
                return [...items, ...nonOverlapping];
              });
            }
          });
        } catch (err) {
          console.warn('[Firebase ERP] Realtime subscriber notice:', err);
        }
      }
    });

    return () => {
      if (unsubTxs) unsubTxs();
      if (unsubTasks) unsubTasks();
      if (unsubCrm) unsubCrm();
      unsubscribeAuth();
    };
  }, []);

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

  const addCrmInteraction = (interaction: Omit<CrmInteraction, 'id'>) => {
    const newInter: CrmInteraction = {
      ...interaction,
      id: `inter-${Date.now()}`
    };
    setCrmInteractions(prev => [newInter, ...prev]);

    // Update client's last interaction date
    setCrmClients(prev => prev.map(c => {
      if (c.id === interaction.clientId) {
        return { ...c, lastInteractionDate: interaction.date.split(' ')[0] };
      }
      return c;
    }));
  };

  // COMPTABILITÉ & TRÉSORERIE (RÈGLE DOUBLE SIGNATURE STRICTE)
  // Wave 2 : persistance Supabase d'abord (trigger 011 verrouille le statut
  // initial) ; la validation OTP reste un flux client à RPC-ifier (Phase 5).
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
    const amountCDF = tx.amountUSD * USD_TO_CDF_RATE;
    // RÈGLE ANTI-FRAUDE : Décaissement > 100 USD (ou > 285 000 CDF) = Double Signature (Manager + OTP DAF)
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
      validationStatus: requiresDouble ? 'en_attente_manager' : 'valide',
      attachmentUrl: tx.attachmentUrl
    };

    setTransactions(prev => [newTx, ...prev]);

    // Wave 2 — SSOT Supabase d'abord (trigger 011 verrouille le statut initial).
    if (isSupabaseConfigured()) {
      try {
        await createPgTransaction({
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
        // Retrait optimiste : la persistance serveur fait foi.
        setTransactions(prev => prev.filter(t => t.id !== newId));
        console.error('[Supabase Wave 2] Création transaction refusée :', e);
        throw e;
      }
    }

    // Persist to Firestore (LEGACY mirror). Best-effort.
    setFirestoreDocument('erp_transactions', newId, newTx)
      .catch(e => console.warn('[Firebase LEGACY mirror] Transaction persist notice:', e));

    logAuditEvent({
      action: 'ERP_TRANSACTION_CREATED',
      resource: 'erp_transactions',
      resourceId: newId,
      details: `${newTx.type.toUpperCase()} : ${newTx.amountUSD} USD - ${newTx.description} (${requiresDouble ? 'Double signature requise' : 'Validation immédiate'})`
    });

    return { id: newTx.id, requiresDoubleSignature: requiresDouble };
  };

  const approveTransactionManager = async (txId: string, managerName: string) => {
    const target = transactions.find(t => t.id === txId);
    // RPC serveur d'abord (018) ; sans RPC distant, repli legacy explicite (non sécurisé).
    if (isSupabaseConfigured() && target) {
      try {
        await rpcApproveManager(target.pieceReference);
        await logAudit('ERP_TRANSACTION_MANAGER_APPROVED', 'erp_transactions', target.pieceReference, {
          manager: managerName,
        });
      } catch (e) {
        console.warn(
          isRpcMissing(e)
            ? '[Supabase] RPC erp_approve_manager absente (018 non appliquée), repli legacy NON SÉCURISÉ :'
            : '[Supabase] Visa manager refusé :',
          e,
        );
        if (!isRpcMissing(e)) throw e;
      }
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

    updateFirestoreDocument('erp_transactions', txId, {
      validationStatus: 'en_attente_otp_daf',
      managerApprovedBy: managerName
    }).catch(e => console.warn('[Firebase ERP] Manager approval persist notice:', e));

    logAuditEvent({
      action: 'ERP_TRANSACTION_MANAGER_APPROVED',
      resource: 'erp_transactions',
      resourceId: txId,
      details: `Visa Manager apposé par : ${managerName}`
    });
  };

  // Validation DAF via RPC serveur (018) : séparation initiateur/manager/DAF
  // vérifiée en base sur auth.uid(). Sans RPC distant : repli legacy explicite
  // (non sécurisé) en attendant 018. L'OTP simulé côté client est SUPPRIMÉ :
  // la validation est une attestation nominative (canal OTP réel = phase ultérieure).
  const validateTransactionDaf = async (txId: string): Promise<boolean> => {
    const targetTx = transactions.find(t => t.id === txId);
    if (!targetTx) return false;

    if (isSupabaseConfigured()) {
      try {
        await rpcValidateDaf(targetTx.pieceReference);
        await logAudit('ERP_TRANSACTION_DOUBLE_SIGNATURE_COMPLETE', 'erp_transactions', targetTx.pieceReference, {});
      } catch (e) {
        console.warn(
          isRpcMissing(e)
            ? '[Supabase] RPC erp_validate_daf absente (018 non appliquée), repli legacy NON SÉCURISÉ :'
            : '[Supabase] Validation DAF refusée :',
          e,
        );
        if (!isRpcMissing(e)) return false;
      }
    }

    const verifiedAt = new Date().toLocaleString('fr-FR');

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

    // Persist validation to Firestore (LEGACY mirror) & Lock document
    updateFirestoreDocument('erp_transactions', txId, {
      validationStatus: 'valide',
      dafOtpVerifiedAt: verifiedAt
    }).catch(e => console.warn('[Firebase LEGACY mirror] DAF validation persist notice:', e));

    logAuditEvent({
      action: 'ERP_TRANSACTION_DOUBLE_SIGNATURE_COMPLETE',
      resource: 'erp_transactions',
      resourceId: txId,
      details: `Double signature complétée. Transaction verrouillée et immuable.`
    });

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

    setTransactions(prev => [reversalTx, ...prev]);

    // RPC serveur d'abord (018) : contre-écriture liée, statut décidé serveur.
    if (isSupabaseConfigured()) {
      try {
        const serverRef = await rpcReverseTx(original.pieceReference, reason);
        await logAudit('ERP_TRANSACTION_REVERSED_COUNTERPASS', 'erp_transactions', serverRef, {
          reason,
          performedBy,
        });
      } catch (e) {
        console.warn(
          isRpcMissing(e)
            ? '[Supabase] RPC erp_reverse_tx absente (018 non appliquée), repli legacy NON SÉCURISÉ :'
            : '[Supabase] Contrepassation refusée :',
          e,
        );
        if (!isRpcMissing(e)) {
          setTransactions(prev => prev.filter(t => t.id !== reversalId));
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      }
    }

    await setFirestoreDocument('erp_transactions', reversalId, reversalTx);

    logAuditEvent({
      action: 'ERP_TRANSACTION_REVERSED_COUNTERPASS',
      resource: 'erp_transactions',
      resourceId: reversalId,
      details: `Contrepassation de la transaction ${original.pieceReference} effectuée par ${performedBy}. Motif: ${reason}`
    });

    return { success: true };
  };

  const createDailyCashClosure = async (closure: {
    currency: 'USD' | 'CDF';
    physicalCountedBalance: number;
    justification?: string;
    closedBy: string;
  }): Promise<DailyCashClosure> => {
    const today = new Date().toISOString().split('T')[0];

    const relevantTxs = transactions.filter(t => {
      const isToday = t.date === today;
      const isAccount = closure.currency === 'USD' ? t.paymentAccount === 'caisse_usd' : t.paymentAccount === 'caisse_cdf';
      return isToday && isAccount && t.validationStatus === 'valide';
    });

    const receipts = relevantTxs.filter(t => t.type === 'recette').reduce((acc, t) => acc + (closure.currency === 'USD' ? t.amountUSD : t.amountCDF), 0);
    const expenses = relevantTxs.filter(t => t.type === 'depense').reduce((acc, t) => acc + (closure.currency === 'USD' ? t.amountUSD : t.amountCDF), 0);
    
    const baseBalance = closure.currency === 'USD' ? 12000 : 18000000;
    const theoretical = baseBalance + receipts - expenses;
    const discrepancy = closure.physicalCountedBalance - theoretical;

    const newClosure: DailyCashClosure = {
      id: `clot-${Date.now()}`,
      date: today,
      currency: closure.currency,
      theoreticalBalance: theoretical,
      physicalCountedBalance: closure.physicalCountedBalance,
      discrepancy: discrepancy,
      justification: closure.justification || (discrepancy === 0 ? "Caisse parfaitement conforme et soldée." : "Écart déclaré et soumis à visa comptable."),
      closedBy: closure.closedBy,
      pvReference: `PV-CLOT-${closure.currency}-${today.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      status: discrepancy === 0 ? 'conforme' : (closure.justification ? 'ecart_justifie' : 'anomalie'),
      closedAt: new Date().toLocaleString('fr-FR')
    };

    setCashClosures(prev => [newClosure, ...prev]);

    // Wave 2 — SSOT Supabase d'abord (insert réservé erp.validate par RLS).
    if (isSupabaseConfigured()) {
      try {
        await createPgClosure({
          date: newClosure.date,
          currency: newClosure.currency,
          theoretical: newClosure.theoreticalBalance,
          counted: newClosure.physicalCountedBalance,
          discrepancy: newClosure.discrepancy,
          justification: newClosure.justification,
          pvReference: newClosure.pvReference,
          status: newClosure.status,
        });
        await logAudit('ERP_CASH_CLOSURE_RECORDED', 'cash_closures', newClosure.id, {
          pv: newClosure.pvReference,
        });
      } catch (e) {
        setCashClosures(prev => prev.filter(c => c.id !== newClosure.id));
        console.error('[Supabase Wave 2] Clôture refusée :', e);
        throw e;
      }
    }

    setFirestoreDocument('erp_closures', newClosure.id, newClosure)
      .catch(e => console.warn('[Firebase LEGACY mirror] Closure persist notice:', e));

    logAuditEvent({
      action: 'ERP_CASH_CLOSURE_RECORDED',
      resource: 'erp_closures',
      resourceId: newClosure.id,
      details: `Clôture caisse ${newClosure.currency} (${newClosure.pvReference}) : Écart ${discrepancy}`
    });

    return newClosure;
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
        syncOfflineData
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
