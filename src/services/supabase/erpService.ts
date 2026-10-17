// Service ERP — Wave 2 (suite). SSOT = public.erp_transactions,
// public.erp_tasks, public.cash_closures, public.clients.
// Règles : statuts financiers via RLS + trigger 011 (double-signature non
// contournable à l'INSERT) ; immutabilité du 'valide' (trigger 005) ; les noms
// d'acteurs TS (display names) restent dans le miroir legacy — performed_by
// PG = uid de session. La résolution noms→uid viendra avec le RPC (Phase 5).
import { requireSupabase } from '../supabase';
import type {
  AccountingTransaction,
  ProjectTask,
  DailyCashClosure,
  CrmClient,
  TaskStatus,
} from '../../types/erp';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isPgId = (id: string) => UUID_RE.test(id);

async function sessionUid(): Promise<string> {
  const sb = requireSupabase();
  const { data } = await sb.auth.getSession();
  if (!data.session) throw new Error('Session requise.');
  return data.session.user.id;
}

/* ---------- TRANSACTIONS ---------- */

export function pgToTx(t: Record<string, unknown>): AccountingTransaction {
  return {
    id: String(t.piece_reference ?? t.id),
    pieceReference: String(t.piece_reference ?? ''),
    date: String(t.entry_date ?? ''),
    type: (t.direction as AccountingTransaction['type']) ?? 'depense',
    category: (t.category as AccountingTransaction['category']) ?? 'stock',
    accountCode: String(t.account_code ?? ''),
    description: String(t.description ?? ''),
    amountUSD: Number(t.amount_usd ?? 0),
    amountCDF: Number(t.amount_cdf ?? 0),
    paymentAccount: (t.payment_account as AccountingTransaction['paymentAccount']) ?? 'caisse_usd',
    beneficiaryOrPayer: String(t.counterparty ?? ''),
    performedBy: '',
    requiresDoubleSignature: Boolean(t.requires_double_signature ?? false),
    validationStatus: (t.validation_status as AccountingTransaction['validationStatus']) ?? 'en_attente_manager',
    attachmentUrl: (t.attachment_path as string) ?? undefined,
  };
}

export async function fetchTransactions(): Promise<AccountingTransaction[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('erp_transactions').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) throw new Error(`Lecture transactions impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(pgToTx);
}

export async function createTransaction(input: {
  type: 'recette' | 'depense';
  category: AccountingTransaction['category'];
  accountCode: string;
  description: string;
  amountUSD: number;
  amountCDF: number;
  paymentAccount: AccountingTransaction['paymentAccount'];
  beneficiaryOrPayer: string;
  requiresDoubleSignature: boolean;
  pieceReference: string;
  attachmentPath?: string;
}): Promise<{ pieceReference: string }> {
  const sb = requireSupabase();
  const uid = await sessionUid();
  // Statut initial : le trigger 011 + RLS décident (jamais 'valide' direct sans droit).
  const { error } = await sb.from('erp_transactions').insert({
    piece_reference: input.pieceReference,
    direction: input.type,
    category: input.category,
    account_code: input.accountCode,
    description: input.description,
    amount_usd: input.amountUSD,
    amount_cdf: input.amountCDF,
    payment_account: input.paymentAccount,
    counterparty: input.beneficiaryOrPayer,
    performed_by: uid,
    requires_double_signature: input.requiresDoubleSignature,
    validation_status: input.requiresDoubleSignature ? 'en_attente_manager' : 'valide',
    attachment_path: input.attachmentPath ?? null,
  });
  if (error) throw new Error(`Écriture transaction refusée : ${error.message}`);
  return { pieceReference: input.pieceReference };
}

export async function setTxValidation(
  pieceReference: string,
  patch: { validationStatus: AccountingTransaction['validationStatus'] },
): Promise<void> {
  // DEPRECATED (vague RPC) : conservé pour compatibilité transitoire, ne plus utiliser.
  // Les transitions passent par rpcApproveManager / rpcValidateDaf ci-dessous.
  return rpcApproveManager(pieceReference);
}

/** Erreur RPC absente distant (migration 018 non appliquée) : repli legacy explicite. */
export function isRpcMissing(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e ?? '');
  return msg.includes('PGRST202') || msg.includes('Could not find the function');
}

export async function rpcApproveManager(pieceReference: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc('erp_approve_manager', { p_piece: pieceReference });
  if (error) throw new Error(`Visa manager refusé : ${error.message}`);
}

export async function rpcValidateDaf(pieceReference: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc('erp_validate_daf', { p_piece: pieceReference });
  if (error) throw new Error(`Validation DAF refusée : ${error.message}`);
}

export async function rpcReverseTx(pieceReference: string, reason: string): Promise<string> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('erp_reverse_tx', { p_piece: pieceReference, p_reason: reason });
  if (error) throw new Error(`Contrepassation refusée : ${error.message}`);
  return String(data);
}

export async function rpcValidateClosure(closureId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc('closure_validate', { p_id: closureId });
  if (error) throw new Error(`Validation clôture refusée : ${error.message}`);
}

/* ---------- TASKS ---------- */

export function pgToTask(t: Record<string, unknown>): ProjectTask {
  return {
    id: String(t.id),
    projectCode: String(t.project_code ?? ''),
    title: String(t.title ?? ''),
    description: String(t.description ?? ''),
    assignedTo: '',
    priority: (t.priority as ProjectTask['priority']) ?? 'normale',
    status: (t.status as ProjectTask['status']) ?? 'a_faire',
    deadline: String(t.deadline ?? ''),
    createdAt: String(t.created_at ?? '').split('T')[0],
    completedAt: t.completed_at ? String(t.completed_at).split('T')[0] : undefined,
  } as ProjectTask;
}

export async function fetchTasks(): Promise<ProjectTask[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('erp_tasks').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) throw new Error(`Lecture tâches impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(pgToTask);
}

export async function createTask(input: {
  projectCode: string;
  title: string;
  description?: string;
  priority: ProjectTask['priority'];
}): Promise<string> {
  const sb = requireSupabase();
  const uid = await sessionUid();
  const { data, error } = await sb
    .from('erp_tasks')
    .insert({
      project_code: input.projectCode,
      title: input.title,
      description: input.description ?? '',
      priority: input.priority,
      status: 'a_faire',
      created_by: uid,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`Écriture tâche refusée : ${error?.message}`);
  return (data as { id: string }).id;
}

export async function setTaskStatus(pgUuid: string, status: TaskStatus, completedAt?: string): Promise<void> {
  const sb = requireSupabase();
  await sessionUid();
  const { data, error } = await sb
    .from('erp_tasks')
    .update({ status, completed_at: completedAt ?? null })
    .eq('id', pgUuid)
    .select('id');
  if (error) throw new Error(`Statut tâche refusé : ${error.message}`);
  if (!data || (data as unknown[]).length === 0) throw new Error('Tâche introuvable ou non autorisée.');
}

/* ---------- CLOSURES ---------- */

export async function createClosure(input: {
  date: string;
  currency: 'USD' | 'CDF';
  theoretical: number;
  counted: number;
  discrepancy: number;
  justification?: string;
  pvReference: string;
  status: string;
}): Promise<void> {
  const sb = requireSupabase();
  const uid = await sessionUid();
  const { error } = await sb.from('cash_closures').insert({
    closure_date: input.date,
    currency: input.currency,
    theoretical_balance: input.theoretical,
    counted_balance: input.counted,
    discrepancy: input.discrepancy,
    justification: input.justification ?? null,
    closed_by: uid,
    pv_reference: input.pvReference,
    status: input.status,
  });
  if (error) throw new Error(`Écriture clôture refusée : ${error.message}`);
}

export async function fetchClosures(): Promise<DailyCashClosure[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('cash_closures').select('*').order('closure_date', { ascending: false }).limit(100);
  if (error) throw new Error(`Lecture clôtures impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((c) => ({
    id: String(c.id),
    date: String(c.closure_date ?? ''),
    currency: (c.currency as DailyCashClosure['currency']) ?? 'USD',
    theoreticalBalance: Number(c.theoretical_balance ?? 0),
    physicalCountedBalance: Number(c.counted_balance ?? 0),
    discrepancy: Number(c.discrepancy ?? 0),
    justification: String(c.justification ?? ''),
    closedBy: '',
    pvReference: String(c.pv_reference ?? ''),
    status: (c.status as DailyCashClosure['status']) ?? 'conforme',
    closedAt: String(c.created_at ?? ''),
  }));
}

/* ---------- CRM CLIENTS ---------- */

export async function fetchCrmClients(): Promise<CrmClient[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('clients').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(`Lecture clients impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((c) => ({
    id: String(c.code ?? c.id),
    code: String(c.code ?? ''),
    name: String(c.name ?? ''),
    organization: String(c.organization ?? ''),
    category: (c.category as CrmClient['category']) ?? 'pme',
    status: (c.status as CrmClient['status']) ?? 'prospect',
    email: String(c.email ?? ''),
    phone: String(c.phone ?? ''),
    address: '',
    city: String(c.city ?? ''),
    totalRevenueUSD: Number(c.total_revenue_usd ?? 0),
    contractsCount: Number(c.contracts_count ?? 0),
    fidelityTier: 'standard',
    lastInteractionDate: String(c.created_at ?? '').split('T')[0],
    assignedManager: '',
    notes: String(c.notes ?? ''),
  }));
}

export async function saveCrmClient(c: {
  code: string;
  name: string;
  organization?: string;
  category: CrmClient['category'];
  status: CrmClient['status'];
  email?: string;
  phone?: string;
  city?: string;
  notes?: string;
}): Promise<void> {
  const sb = requireSupabase();
  await sessionUid();
  const payload = {
    code: c.code,
    name: c.name,
    organization: c.organization ?? '',
    category: c.category,
    status: c.status,
    email: c.email ?? '',
    phone: c.phone ?? '',
    city: c.city ?? '',
    notes: c.notes ?? '',
  };
  const { data: existing } = await sb.from('clients').select('id').eq('code', c.code).limit(1);
  if ((existing ?? []).length > 0) {
    const { error } = await sb.from('clients').update(payload).eq('code', c.code);
    if (error) throw new Error(`Écriture client refusée : ${error.message}`);
  } else {
    const { error } = await sb.from('clients').insert(payload);
    if (error) throw new Error(`Écriture client refusée : ${error.message}`);
  }
}
