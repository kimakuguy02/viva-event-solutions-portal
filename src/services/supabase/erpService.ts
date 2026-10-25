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
  CrmInteraction,
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

export interface StoredTxStatus {
  pieceReference: string;
  requiresDoubleSignature: boolean;
  validationStatus: AccountingTransaction['validationStatus'];
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
}): Promise<StoredTxStatus | null> {
  const sb = requireSupabase();
  const uid = await sessionUid();
  // Statut initial et seuil : le trigger 026 décide en base à partir des montants ;
  // la valeur envoyée ici n'est qu'une intention sans effet d'autorité.
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
    attachment_path: input.attachmentPath ?? null,
  });
  if (error) throw new Error(`Écriture transaction refusée : ${error.message}`);

  // Relecture : l'écran n'affiche que ce que la base a réellement retenu. null =
  // écriture acceptée mais non relisible par ce rôle (RLS select) ; l'appelant
  // doit recharger la liste au lieu d'inventer un statut.
  const { data, error: readError } = await sb
    .from('erp_transactions')
    .select('*')
    .eq('piece_reference', input.pieceReference)
    .maybeSingle();
  if (readError) throw new Error(`Écriture enregistrée mais relue avec erreur : ${readError.message}`);
  if (!data) return null;
  const stored = pgToTx(data as Record<string, unknown>);
  return {
    pieceReference: stored.pieceReference,
    requiresDoubleSignature: stored.requiresDoubleSignature,
    validationStatus: stored.validationStatus,
  };
}

export async function setTxValidation(
  pieceReference: string,
  patch: { validationStatus: AccountingTransaction['validationStatus'] },
): Promise<void> {
  // DEPRECATED (vague RPC) : conservé pour compatibilité transitoire, ne plus utiliser.
  // Les transitions passent par rpcApproveManager / rpcValidateDaf ci-dessous.
  return rpcApproveManager(pieceReference);
}

/** Détecte une RPC absente afin de remonter une erreur explicite sans repli local. */
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
  if (!isPgId(closureId)) throw new Error('Clôture locale : seule une clôture enregistrée en base peut être visée.');
  const { error } = await sb.rpc('closure_validate', { p_id: closureId });
  if (error) throw new Error(`Validation clôture refusée : ${error.message}`);
}

export interface OpeningBalance {
  account: string;
  currency: 'USD' | 'CDF';
  amount: number;
}

export async function fetchOpeningBalances(): Promise<OpeningBalance[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('opening_balances').select('account,currency,amount');
  if (error) throw new Error(`Lecture soldes d'ouverture impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    account: String(row.account),
    currency: (row.currency as OpeningBalance['currency']) ?? 'USD',
    amount: Number(row.amount ?? 0),
  }));
}

/** Solde d'ouverture d'un compte : seule la RPC 027 écrit (RLS = lecture seule). */
export async function rpcSetOpeningBalance(
  account: string,
  currency: 'USD' | 'CDF',
  amount: number,
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc('opening_balance_set', {
    p_account: account,
    p_currency: currency,
    p_amount: amount,
  });
  if (error) {
    if (isRpcMissing(error)) {
      throw new Error("Solde d'ouverture indisponible : la RPC opening_balance_set (migration 027) doit être déployée.");
    }
    throw new Error(`Solde d'ouverture refusé : ${error.message}`);
  }
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
  currency: 'USD' | 'CDF';
  counted: number;
  justification?: string;
}): Promise<DailyCashClosure> {
  const sb = requireSupabase();
  await sessionUid();
  const { data, error } = await sb.rpc('closure_create', {
    p_currency: input.currency,
    p_counted: input.counted,
    p_justification: input.justification?.trim() || null,
  });
  if (error) {
    if (isRpcMissing(error)) {
      throw new Error('Clôture indisponible : la RPC closure_create (migration 023) doit être déployée.');
    }
    throw new Error(`Écriture clôture refusée : ${error.message}`);
  }
  if (!data || typeof data !== 'object') {
    throw new Error('La base n’a pas retourné la clôture créée.');
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    date: String(row.closure_date ?? ''),
    currency: (row.currency as DailyCashClosure['currency']) ?? input.currency,
    theoreticalBalance: Number(row.theoretical_balance ?? 0),
    physicalCountedBalance: Number(row.counted_balance ?? 0),
    discrepancy: Number(row.discrepancy ?? 0),
    justification: String(row.justification ?? ''),
    closedBy: String(row.closed_by ?? ''),
    pvReference: String(row.pv_reference ?? ''),
    status: (row.status as DailyCashClosure['status']) ?? 'anomalie',
    closedAt: String(row.created_at ?? ''),
    validatedBy: row.validated_by ? String(row.validated_by) : undefined,
    validatedAt: row.validated_at ? String(row.validated_at) : undefined,
  };
}

export async function fetchClosures(): Promise<DailyCashClosure[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('cash_closures').select('*').order('closure_date', { ascending: false }).limit(100);
  if (error) throw new Error(`Lecture clôtures impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(c => ({
    id: String(c.id),
    date: String(c.closure_date ?? ''),
    currency: (c.currency as DailyCashClosure['currency']) ?? 'USD',
    theoreticalBalance: Number(c.theoretical_balance ?? 0),
    physicalCountedBalance: Number(c.counted_balance ?? 0),
    discrepancy: Number(c.discrepancy ?? 0),
    justification: String(c.justification ?? ''),
    closedBy: String(c.closed_by ?? ''),
    pvReference: String(c.pv_reference ?? ''),
    status: (c.status as DailyCashClosure['status']) ?? 'anomalie',
    closedAt: String(c.created_at ?? ''),
    validatedBy: c.validated_by ? String(c.validated_by) : undefined,
    validatedAt: c.validated_at ? String(c.validated_at) : undefined,
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

/* ---------- CRM INTERACTIONS ---------- */

// La table PG n'accepte pas les libellés UI 'visite_terrain' / 'devis_transmis'.
// Mapping bijectif sur les seules valeurs que l'UI peut produire.
const TO_DB_TYPE: Record<CrmInteraction['type'], string> = {
  appel: 'appel',
  reunion: 'reunion',
  email: 'email',
  visite_terrain: 'visite',
  devis_transmis: 'note',
  autre: 'autre',
};

const FROM_DB_TYPE: Record<string, CrmInteraction['type']> = {
  appel: 'appel',
  reunion: 'reunion',
  email: 'email',
  visite: 'visite_terrain',
  visite_terrain: 'visite_terrain',
  note: 'devis_transmis',
  devis_transmis: 'devis_transmis',
  autre: 'autre',
};

function interactionDate(value: unknown): string {
  const raw = String(value ?? '');
  if (!raw) return '';
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? raw
    : parsed.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function pgToCrmInteraction(
  row: Record<string, unknown>,
  client?: { code: string; name: string }
): CrmInteraction {
  return {
    id: String(row.id ?? ''),
    clientId: client?.code ?? '',
    clientName: client?.name ?? '',
    date: interactionDate(row.created_at),
    type: FROM_DB_TYPE[String(row.type ?? '')] ?? 'autre',
    authorName: String(row.author_label ?? ''),
    authorProfileId: (row.author_profile_id as string) ?? undefined,
    summary: String(row.summary ?? ''),
    nextAction: (row.next_action as string) || undefined,
    nextFollowUpDate: (row.due_at as string) || undefined,
  };
}

export async function fetchCrmInteractions(): Promise<CrmInteraction[]> {
  const sb = requireSupabase();
  const [interactions, clients] = await Promise.all([
    sb.from('crm_interactions').select('*').order('created_at', { ascending: false }).limit(300),
    sb.from('clients').select('id, code, name').limit(500),
  ]);
  if (interactions.error) throw new Error(`Lecture interactions impossible : ${interactions.error.message}`);
  if (clients.error) throw new Error(`Lecture clients CRM impossible : ${clients.error.message}`);

  const byId = new Map<string, { code: string; name: string }>();
  for (const c of (clients.data ?? []) as Record<string, unknown>[]) {
    byId.set(String(c.id), { code: String(c.code ?? ''), name: String(c.name ?? '') });
  }

  return ((interactions.data ?? []) as Record<string, unknown>[]).map((row) =>
    pgToCrmInteraction(row, byId.get(String(row.client_id)))
  );
}

export async function createCrmInteraction(input: {
  clientCode: string;
  type: CrmInteraction['type'];
  summary: string;
  nextAction?: string;
  nextFollowUpDate?: string;
}): Promise<CrmInteraction> {
  const sb = requireSupabase();
  await sessionUid();

  const summary = input.summary.trim();
  if (!summary) throw new Error('Le compte-rendu de l’échange est obligatoire.');

  const { data: clients, error: clientError } = await sb
    .from('clients')
    .select('id, code, name')
    .eq('code', input.clientCode)
    .limit(1);
  if (clientError) throw new Error(`Recherche du client impossible : ${clientError.message}`);
  const client = (clients ?? [])[0] as { id?: string; code?: string; name?: string } | undefined;
  if (!client?.id) throw new Error(`Client « ${input.clientCode} » introuvable ou non autorisé.`);

  const { data, error } = await sb
    .from('crm_interactions')
    .insert({
      client_id: client.id,
      type: TO_DB_TYPE[input.type] ?? 'autre',
      summary,
      next_action: input.nextAction?.trim() || null,
      due_at: input.nextFollowUpDate || null,
    })
    .select('*')
    .single();
  if (error) throw new Error(`Enregistrement de l’échange refusé : ${error.message}`);

  return pgToCrmInteraction(
    data as Record<string, unknown>,
    { code: String(client.code ?? ''), name: String(client.name ?? '') }
  );
}
