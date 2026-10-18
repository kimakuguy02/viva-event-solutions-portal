// Services Formulaires & Organisation — Wave 2 (suite).
// SSOT = public.forms / form_fields / form_submissions / org_units.
// Pierre angulaire : soumissions publiques = insert RLS prévu ; lecture croisée
// réservée staff (forms.manage). Organisation hiérarchique par parent_id.
import { requireSupabase } from '../supabase';
import type { DynamicForm, FormSubmission, OrganizationUnit } from '../../types/cmsAndErp';

/* ---------- FORMS ---------- */

export async function fetchForms(): Promise<DynamicForm[]> {
  const sb = requireSupabase();
  const { data: forms, error } = await sb.from('forms').select('*').order('name');
  if (error) throw new Error(`Lecture formulaires impossible : ${error.message}`);
  const { data: fields, error: fErr } = await sb.from('form_fields').select('*').order('position');
  if (fErr) throw new Error(`Lecture champs impossible : ${fErr.message}`);
  const byForm = new Map<string, Record<string, unknown>[]>();
  for (const f of ((fields ?? []) as Record<string, unknown>[])) {
    const key = String(f.form_id);
    const arr = byForm.get(key);
    if (arr) arr.push(f);
    else byForm.set(key, [f]);
  }
  return ((forms ?? []) as Record<string, unknown>[]).map((f) => ({
    id: String(f.code ?? f.id),
    pgId: String(f.id),
    name: String(f.name ?? ''),
    description: String(f.description ?? ''),
    targetAudience: (f.target_audience as DynamicForm['targetAudience']) ?? 'public',
    allowedRoles: [],
    status: (f.status as DynamicForm['status']) ?? 'actif',
    fields: (byForm.get(String(f.id)) ?? []).map((ff) => ({
      id: String(ff.id),
      name: String(ff.name),
      label: String(ff.label),
      type: ff.field_type as never,
      placeholder: (ff.placeholder as string) ?? undefined,
      required: Boolean(ff.is_required),
      options: (ff.options as string[]) ?? undefined,
      order: Number(ff.position ?? 0),
    })),
    createdAt: String(f.created_at ?? ''),
    updatedAt: String(f.updated_at ?? ''),
    submissionsCount: 0,
  })) as DynamicForm[];
}

export async function saveForm(form: DynamicForm): Promise<void> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const { data: existing } = await sb.from('forms').select('id').eq('code', form.id).maybeSingle();
  let pgId: string;
  if (existing) {
    const { error } = await sb
      .from('forms')
      .update({
        name: form.name,
        description: form.description,
        target_audience: form.targetAudience,
        status: form.status,
      })
      .eq('code', form.id);
    if (error) throw new Error(`Écriture formulaire refusée : ${error.message}`);
    pgId = (existing as { id: string }).id;
  } else {
    const { data, error } = await sb
      .from('forms')
      .insert({
        code: form.id,
        name: form.name,
        description: form.description,
        target_audience: form.targetAudience,
        status: form.status,
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`Écriture formulaire refusée : ${error?.message}`);
    pgId = (data as { id: string }).id;
  }
  // Champs : remplacement complet (suppression + réinsertion ordonnée)
  const { error: dErr } = await sb.from('form_fields').delete().eq('form_id', pgId);
  if (dErr) throw new Error(`Champs formulaire refusés : ${dErr.message}`);
  if (form.fields.length > 0) {
    const { error: iErr } = await sb.from('form_fields').insert(
      form.fields.map((f, i) => ({
        form_id: pgId,
        name: f.name,
        label: f.label,
        field_type: f.type,
        placeholder: f.placeholder ?? null,
        is_required: f.required,
        options: f.options ?? [],
        position: f.order ?? i,
      })),
    );
    if (iErr) throw new Error(`Champs formulaire refusés : ${iErr.message}`);
  }
}

export async function deleteForm(code: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from('forms').delete().eq('code', code);
  if (error) throw new Error(`Suppression formulaire refusée : ${error.message}`);
}

export async function submitForm(
  formPgId: string,
  formName: string,
  data: Record<string, unknown>,
  identity: { email: string; name: string },
): Promise<string> {
  const sb = requireSupabase();
  // Soumission publique : insert RLS prévu (pas de session exigée).
  const { data: row, error } = await sb
    .from('form_submissions')
    .insert({
      form_id: formPgId,
      data,
      submitted_email: identity.email,
      submitted_name: identity.name,
      status: 'soumis',
    })
    .select('id')
    .single();
  if (error || !row) throw new Error(`Soumission refusée : ${error?.message}`);
  return (row as { id: string }).id;
}

export async function fetchSubmissions(): Promise<FormSubmission[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('form_submissions')
    .select('*, forms!inner(name)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(`Lecture soumissions impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    formId: String(r.form_id),
    formName: String((r.forms as { name: string })?.name ?? ''),
    data: (r.data as Record<string, unknown>) ?? {},
    submittedBy: String(r.submitted_by ?? ''),
    submittedByEmail: String(r.submitted_email ?? ''),
    submittedByName: String(r.submitted_name ?? ''),
    status: (r.status as FormSubmission['status']) ?? 'soumis',
    submittedAt: String(r.created_at ?? ''),
  }));
}

/* ---------- ORG UNITS ---------- */

export function pgToUnit(p: Record<string, unknown>): OrganizationUnit {
  return {
    id: String(p.code ?? p.id),
    parentId: null, // résolu à la migration des données (UUID parent)
    type: (p.unit_type as OrganizationUnit['type']) ?? 'service',
    code: String(p.code ?? ''),
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    order: Number(p.position ?? 0),
    status: (p.is_active as boolean) === false ? 'inactif' : 'actif',
    responsibleName: (p.manager_name as string) ?? undefined,
    responsibleEmail: (p.manager_email as string) ?? undefined,
    responsiblePhone: (p.manager_phone as string) ?? undefined,
    responsiblePhotoUrl: (p.photo_url as string) ?? undefined,
    location: (p.location as string) ?? undefined,
    createdAt: String(p.created_at ?? ''),
    updatedAt: String(p.updated_at ?? ''),
  };
}

export async function fetchOrgUnits(): Promise<OrganizationUnit[]> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  // Table = personnel (coordonnees des responsables) ; vue = vitrine, meme shape
  // hors PII. Sans cette bascule, un visiteur anonymes ne recevrait qu'un 42501.
  const source = session?.session ? 'org_units' : 'v_org_units_public';
  const { data, error } = await sb.from(source).select('*').order('position');
  if (error) throw new Error(`Lecture organisation impossible : ${error.message}`);
  const rows = ((data ?? []) as Record<string, unknown>[]);
  const idByCode = new Map(rows.map((r) => [String(r.id), String(r.code ?? r.id)]));
  void idByCode;
  return rows.map(pgToUnit);
}

export async function saveOrgUnits(units: OrganizationUnit[]): Promise<void> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const existing = await sb.from('org_units').select('code');
  if (existing.error) throw new Error(`Écriture organisation refusée : ${existing.error.message}`);
  const known = new Set(((existing.data ?? []) as { code: string }[]).map((r) => r.code));
  for (const u of units) {
    const payload = {
      code: u.code ?? u.id,
      name: u.name,
      description: u.description,
      unit_type: u.type,
      manager_name: u.responsibleName ?? null,
      manager_email: u.responsibleEmail ?? null,
      manager_phone: u.responsiblePhone ?? null,
      photo_url: u.responsiblePhotoUrl ?? null,
      location: u.location ?? null,
      position: u.order,
      is_active: u.status === 'actif',
    };
    const code = String(payload.code);
    const { error } = known.has(code)
      ? await sb.from('org_units').update(payload).eq('code', code)
      : await sb.from('org_units').insert({ ...payload, parent_id: null });
    if (error) throw new Error(`Écriture unité '${code}' refusée : ${error.message}`);
    known.add(code);
  }
  for (const row of (existing.data ?? []) as { code: string }[]) {
    if (!units.some((u) => (u.code ?? u.id) === row.code)) {
      const { error } = await sb.from('org_units').delete().eq('code', row.code);
      if (error) throw new Error(`Suppression unité '${row.code}' refusée : ${error.message}`);
    }
  }
}
