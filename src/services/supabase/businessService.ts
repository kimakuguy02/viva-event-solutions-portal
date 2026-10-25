// Service Projets & Devis — Wave 2 (suite). SSOT = public.projects,
// public.quotes (+quote_items). Champs TS riches sans colonne PG (requirements,
// breakdown, milestones…) conservés via miroir legacy ; montants cœur persistés
// en numeric avec CHECK. submitted_by = session serveur, jamais le navigateur.
import { requireSupabase } from '../supabase';
import type { Project, QuoteRequest } from '../../types';

/* ---------- PROJECTS ---------- */

export function pgToProject(p: Record<string, unknown>): Project {
  return {
    id: String(p.code ?? p.id),
    code: String(p.code ?? ''),
    title: String(p.title ?? ''),
    client: String(p.client_label ?? ''),
    clientId: (p.client_id as string) ?? undefined,
    type: String(p.event_type ?? ''),
    startDate: String(p.start_date ?? ''),
    endDate: String(p.end_date ?? ''),
    location: String(p.location ?? ''),
    budgetUSD: Number(p.budget_usd ?? 0),
    progressPercent: Number(p.progress_percent ?? 0),
    status: (p.status as Project['status']) ?? 'conception',
    departmentsAssigned: [],
    leadManager: String(p.lead_label ?? ''),
    vipProtocolRequired: false,
    securityClearance: 'standard',
    metrics: { attendeesExpected: 0, equipmentCount: 0, partnerCollegesMobilized: 0 },
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Lecture projets impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(pgToProject);
}

export async function saveProject(p: Project): Promise<void> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const payload = {
    code: p.code,
    title: p.title,
    client_label: p.client,
    event_type: p.type || '',
    location: p.location || '',
    start_date: p.startDate || null,
    end_date: p.endDate || null,
    budget_usd: Number(p.budgetUSD) || 0,
    progress_percent: Number(p.progressPercent) || 0,
    status: p.status,
    lead_label: p.leadManager || '',
  };
  const { data: existing } = await sb.from('projects').select('id').eq('code', p.code).limit(1);
  const rows = (existing ?? []) as { id: string }[];
  if (rows.length > 0) {
    const { error } = await sb.from('projects').update(payload).eq('code', p.code);
    if (error) throw new Error(`Écriture projet refusée : ${error.message}`);
  } else {
    const { error } = await sb.from('projects').insert(payload);
    if (error) throw new Error(`Écriture projet refusée : ${error.message}`);
  }
}

/* ---------- QUOTES ---------- */

export function pgToQuote(q: Record<string, unknown>): QuoteRequest {
  return {
    id: String(q.reference_number ?? q.id),
    referenceNumber: String(q.reference_number ?? ''),
    clientName: String(q.client_name ?? ''),
    clientOrganization: '',
    clientEmail: String(q.client_email ?? ''),
    clientPhone: '',
    eventType: 'entreprise',
    eventName: String(q.event_name ?? ''),
    eventDate: String(q.event_date ?? ''),
    location: String(q.location ?? ''),
    estimatedAttendees: Number(q.attendees ?? 0),
    selectedDepartmentIds: [],
    requirements: {
      scenicAudioLight: false, ledScreensAndBroadcast: false, hybridStreaming: false,
      simultaneousTranslation: false, vipTransportAndEscort: false,
      highSecurityAndCrowdControl: false, cateringAndCocktail: false,
      tentsAndPowerGen: false, audiovisual4kProduction: false,
      decorationAndFloral: false,
    },
    customNotes: '',
    estimatedBudgetUSD: Number(q.total_usd ?? 0),
    status: (q.status as QuoteRequest['status']) ?? 'submitted',
    createdAt: String(q.created_at ?? '').split('T')[0],
    priority: 'normale',
  };
}

export async function fetchQuotes(): Promise<QuoteRequest[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('quotes').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(`Lecture devis impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(pgToQuote);
}

// La référence est mintée côté serveur (submit_quote) : le navigateur ne peut
// plus choisir un numéro, un statut ou un total arbitraire.
export async function insertQuote(q: {
  clientName: string;
  clientEmail: string;
  eventName: string;
  eventDate?: string;
  location?: string;
  attendees?: number;
  budgetUSD?: number;
}): Promise<string> {
  const sb = requireSupabase();
  const budget = Number(q.budgetUSD) || 0;
  const { data, error } = await sb.rpc('submit_quote', {
    p_client_name: q.clientName,
    p_client_email: q.clientEmail,
    p_event_name: q.eventName,
    p_event_date: q.eventDate || null,
    p_location: q.location || '',
    p_attendees: Number(q.attendees) || 0,
    p_budget_usd: budget,
  });
  if (error) throw new Error(`Soumission devis refusée : ${error.message}`);
  const reference = typeof data === 'string' ? data : '';
  if (!reference) throw new Error('Soumission devis refusée : référence absente.');
  return reference;
}

export async function updateQuoteStatus(referenceNumber: string, status: QuoteRequest['status']): Promise<void> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const { error } = await sb.from('quotes').update({ status }).eq('reference_number', referenceNumber);
  if (error) throw new Error(`Statut devis refusé : ${error.message}`);
}
