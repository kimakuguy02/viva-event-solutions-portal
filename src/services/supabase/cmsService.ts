// Service CMS — Wave 2. SSOT = public.cms_sections (+cms_versions).
// Mapping TS CmsSectionItem <-> PG (snake_case). Les ids Firestore historiques
// (chaînes) cohabitent en transition ; les nouveaux ids sont des UUID PG.
import { requireSupabase } from '../supabase';
import type { CmsSectionItem, CmsVersion } from '../../types/cmsAndErp';

interface PgSection {
  id: string;
  page: string;
  category: string | null;
  section: string | null;
  component: string | null;
  content_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  primary_button_text: string | null;
  secondary_button_text: string | null;
  field_type: string | null;
  status: string | null;
  language: string | null;
  author_label: string | null;
  published_title: string | null;
  published_subtitle: string | null;
  published_content: string | null;
  published_primary_button_text: string | null;
  published_secondary_button_text: string | null;
  updated_at: string | null;
}

export function pgToSection(p: PgSection): CmsSectionItem {
  return {
    id: p.id,
    page: p.page,
    category: (p.category ?? 'GENERAL') as CmsSectionItem['category'],
    section: p.section ?? '',
    component: p.component ?? '',
    contentKey: p.content_key,
    title: p.title ?? '',
    subtitle: p.subtitle ?? undefined,
    content: p.content ?? '',
    primaryButtonText: p.primary_button_text ?? undefined,
    secondaryButtonText: p.secondary_button_text ?? undefined,
    type: ((p.field_type ?? 'text') as CmsSectionItem['type']),
    status: ((p.status ?? 'draft') as CmsSectionItem['status']),
    language: ((p.language ?? 'fr') as CmsSectionItem['language']),
    lastModified: p.updated_at ?? new Date().toISOString(),
    author: p.author_label ?? '',
    publishedTitle: p.published_title ?? undefined,
    publishedSubtitle: p.published_subtitle ?? undefined,
    publishedContent: p.published_content ?? undefined,
    publishedPrimaryButtonText: p.published_primary_button_text ?? undefined,
    publishedSecondaryButtonText: p.published_secondary_button_text ?? undefined,
    versions: [],
  };
}

export function sectionToPg(s: CmsSectionItem): Record<string, unknown> {
  return {
    page: s.page,
    category: s.category ?? 'GENERAL',
    section: s.section,
    component: s.component,
    content_key: s.contentKey,
    title: s.title,
    subtitle: s.subtitle ?? null,
    content: s.content,
    primary_button_text: s.primaryButtonText ?? null,
    secondary_button_text: s.secondaryButtonText ?? null,
    field_type: s.type,
    status: s.status,
    language: s.language,
    author_label: s.author,
  };
}

export async function fetchSections(): Promise<CmsSectionItem[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('cms_sections').select('*').order('page').order('content_key');
  if (error) throw new Error(`Lecture CMS impossible : ${error.message}`);
  const sections = (data ?? []).map(pgToSection);
  // L'historique est réservé au staff : un visiteur ne doit pas bloquer la
  // lecture de tout le CMS parce que la requête annexe est refusée par RLS.
  const { data: session } = await sb.auth.getSession();
  if (!session.session) return sections;
  // Versions jointes (une requête par section serait N+1 : on les charge en bloc)
  const { data: versions, error: vErr } = await sb
    .from('cms_versions')
    .select('*')
    .order('created_at', { ascending: false });
  if (vErr) {
    // L'historique est secondaire : son refus ne doit pas vider la vitrine.
    console.warn(`[CMS] Historique indisponible : ${vErr.message}`);
    return sections;
  }
  const bySection = new Map<string, CmsVersion[]>();
  for (const v of (versions ?? []) as Record<string, string>[]) {
    const arr = bySection.get(v.section_id) ?? [];
    arr.push({
      versionId: v.id,
      timestamp: v.created_at,
      author: v.author_label ?? '',
      title: v.title ?? '',
      content: v.content ?? '',
      oldValue: v.old_value,
      newValue: v.new_value,
    });
    bySection.set(v.section_id, arr);
  }
  for (const s of sections) s.versions = bySection.get(s.id) ?? [];
  return sections;
}

export async function upsertSection(s: CmsSectionItem): Promise<CmsSectionItem> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const payload = sectionToPg(s);
  // id client exclu : UUID généré PG pour les créations ; update par content_key stable
  const { data: existing } = await sb.from('cms_sections').select('id').eq('content_key', s.contentKey).maybeSingle();
  let id: string;
  if (existing) {
    const { error } = await sb.from('cms_sections').update(payload).eq('content_key', s.contentKey);
    if (error) throw new Error(`Écriture CMS refusée : ${error.message}`);
    id = (existing as { id: string }).id;
  } else {
    const { data, error } = await sb.from('cms_sections').insert(payload).select('id').single();
    if (error) throw new Error(`Écriture CMS refusée : ${error.message}`);
    id = (data as { id: string }).id;
  }
  const { data: row, error: rErr } = await sb.from('cms_sections').select('*').eq('id', id).single();
  if (rErr || !row) throw new Error('Confirmation de lecture CMS impossible.');
  return pgToSection(row as PgSection);
}

export async function deleteSection(contentKey: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from('cms_sections').delete().eq('content_key', contentKey);
  if (error) throw new Error(`Suppression CMS refusée : ${error.message}`);
}

export async function addVersion(sectionId: string, v: { title: string; content: string; oldValue?: string; newValue?: string; author: string }): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from('cms_versions').insert({
    section_id: sectionId,
    version_label: `v-${Date.now()}`,
    title: v.title,
    content: v.content,
    old_value: v.oldValue ?? null,
    new_value: v.newValue ?? null,
    author_label: v.author,
  });
  if (error) throw new Error(`Version CMS refusée : ${error.message}`);
}

export async function publishSection(sectionId: string, published: Partial<PgSection>): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from('cms_sections')
    .update({ ...published, status: 'published', published_at: new Date().toISOString() })
    .eq('id', sectionId);
  if (error) throw new Error(`Publication CMS refusée : ${error.message}`);
}
