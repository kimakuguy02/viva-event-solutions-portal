// Service Médias & YouTube — Wave 2 (suite). SSOT = public.media_items,
// public.youtube_config, public.youtube_videos.
// Écarts de fidélité connus (miroir legacy les conserve) : caption, projectName,
// realizationDate, uploadedBy n'ont pas de colonne PG dédiée — une colonne
// metadata JSONB sera ajoutée à la migration des données (vague suivante).
// Fichiers binaires : buckets Supabase (vague Storage) ; ici seules métadonnées.
import { requireSupabase } from '../supabase';
import type { MediaItem, YouTubeChannelConfig } from '../../types/cmsAndErp';

export function pgToMedia(p: Record<string, unknown>): MediaItem {
  return {
    id: String(p.id),
    title: String(p.title ?? ''),
    description: String(p.description ?? ''),
    type: (p.media_type as MediaItem['type']) ?? 'photo',
    category: (p.category as MediaItem['category']) ?? 'general',
    url: String(p.public_url ?? ''),
    thumbnailUrl: (p.thumbnail_url as string) ?? undefined,
    youtubeVideoId: (p.youtube_video_id as string) ?? undefined,
    isFeatured: Boolean(p.is_featured ?? false),
    order: Number(p.position ?? 0),
    status: (p.status as MediaItem['status']) ?? 'draft',
    uploadedAt: String(p.created_at ?? ''),
    uploadedBy: '',
  };
}

export async function fetchMedia(): Promise<MediaItem[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('media_items').select('*').order('position');
  if (error) throw new Error(`Lecture médias impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(pgToMedia);
}

export async function saveMedia(m: MediaItem): Promise<void> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const payload = {
    storage_path: m.url.startsWith('http') ? '' : m.url,
    public_url: m.url,
    thumbnail_url: m.thumbnailUrl ?? null,
    media_type: m.type,
    title: m.title,
    description: m.description,
    category: m.category,
    youtube_video_id: m.youtubeVideoId ?? null,
    is_featured: m.isFeatured,
    position: m.order,
    visibility: 'public',
    status: m.status,
  };
  // Appariement par id puis URL publique (stable cross-systèmes).
  let pgId: string | null = null;
  const byId = await sb.from('media_items').select('id').eq('id', m.id).limit(1);
  if (!byId.error && (byId.data ?? []).length > 0) {
    pgId = ((byId.data ?? []) as { id: string }[])[0].id;
  } else {
    const byUrl = await sb.from('media_items').select('id').eq('public_url', m.url).limit(1);
    if (!byUrl.error && (byUrl.data ?? []).length > 0) {
      pgId = ((byUrl.data ?? []) as { id: string }[])[0].id;
    } else if (byId.error && byUrl.error) {
      throw new Error(`Écriture média refusée : ${byUrl.error.message}`);
    }
  }
  if (pgId) {
    const { error } = await sb.from('media_items').update(payload).eq('id', pgId);
    if (error) throw new Error(`Écriture média refusée : ${error.message}`);
  } else {
    const { error } = await sb.from('media_items').insert(payload);
    if (error) throw new Error(`Écriture média refusée : ${error.message}`);
  }
}

export async function deleteMedia(idOrUrl: string): Promise<void> {
  const sb = requireSupabase();
  const byId = await sb.from('media_items').delete().eq('id', idOrUrl);
  if (!byId.error) return;
  const byUrl = await sb.from('media_items').delete().eq('public_url', idOrUrl);
  if (byUrl.error) throw new Error(`Suppression média refusée : ${byUrl.error.message}`);
  // NOTE : suppression du fichier Storage couplée à la vague Storage (pas de faux succès).
}

export async function fetchYouTubeConfig(): Promise<YouTubeChannelConfig | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('youtube_config').select('*').eq('id', 'main').maybeSingle();
  if (error) throw new Error(`Lecture config YouTube impossible : ${error.message}`);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    youtubeChannelUrl: String(row.channel_url ?? ''),
    youtubeChannelId: String(row.channel_id ?? ''),
    youtubeChannelName: String(row.channel_name ?? ''),
    youtubeChannelDescription: String(row.channel_description ?? ''),
    isChannelEnabled: Boolean(row.is_enabled ?? false),
  };
}

export async function saveYouTubeConfig(cfg: YouTubeChannelConfig): Promise<void> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const { error } = await sb.from('youtube_config').upsert(
    {
      id: 'main',
      channel_url: cfg.youtubeChannelUrl,
      channel_id: cfg.youtubeChannelId,
      channel_name: cfg.youtubeChannelName,
      channel_description: cfg.youtubeChannelDescription,
      is_enabled: cfg.isChannelEnabled,
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(`Écriture config YouTube refusée : ${error.message}`);
}
