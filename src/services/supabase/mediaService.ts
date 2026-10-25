// Service Médias & YouTube — Wave 2 (suite). SSOT = public.media_items,
// public.youtube_config, public.youtube_videos.
// Écarts de fidélité connus (miroir legacy les conserve) : caption, projectName,
// realizationDate, uploadedBy n'ont pas de colonne PG dédiée — une colonne
// metadata JSONB sera ajoutée à la migration des données (vague suivante).
// Fichiers binaires : buckets Supabase (vague Storage) ; ici seules métadonnées.
import { requireSupabase } from '../supabase';
import { deleteEnterpriseStorageFile } from '../storageService';
import type { MediaItem, YouTubeChannelConfig } from '../../types/cmsAndErp';

function resolveStorageLocation(
  url: string,
  storageBucket?: string,
  storagePath?: string,
): { storageBucket?: string; storagePath?: string } {
  if (storageBucket && storagePath) return { storageBucket, storagePath };
  if (!url.startsWith('http')) return { storageBucket, storagePath };

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { storageBucket, storagePath };
  }

  const supabaseMediaPrefix = '/storage/v1/object/public/media/';
  const supabasePathIndex = parsedUrl.pathname.indexOf(supabaseMediaPrefix);
  if (supabasePathIndex >= 0) {
    return {
      storageBucket: 'media',
      storagePath: decodeURIComponent(parsedUrl.pathname.slice(supabasePathIndex + supabaseMediaPrefix.length)),
    };
  }

  const firebaseObject = parsedUrl.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
  if (firebaseObject) {
    return {
      storageBucket: firebaseObject[1],
      storagePath: decodeURIComponent(firebaseObject[2]),
    };
  }

  return { storageBucket, storagePath };
}

export function pgToMedia(p: Record<string, unknown>): MediaItem {
  const url = String(p.public_url ?? '');
  const location = resolveStorageLocation(
    url,
    undefined,
    typeof p.storage_path === 'string' ? p.storage_path : undefined,
  );
  const metadata = (p.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: String(p.id),
    title: String(p.title ?? ''),
    description: String(p.description ?? ''),
    caption: (metadata.caption as string) ?? undefined,
    type: (p.media_type as MediaItem['type']) ?? 'photo',
    category: (p.category as MediaItem['category']) ?? 'general',
    url,
    storageBucket: location.storageBucket,
    storagePath: location.storagePath,
    thumbnailUrl: (p.thumbnail_url as string) ?? undefined,
    youtubeVideoId: (p.youtube_video_id as string) ?? undefined,
    projectName: (metadata.projectName as string) ?? undefined,
    realizationDate: (metadata.realizationDate as string) ?? undefined,
    isFeatured: Boolean(p.is_featured ?? false),
    order: Number(p.position ?? 0),
    status: (p.status as MediaItem['status']) ?? 'draft',
    uploadedAt: String(p.created_at ?? ''),
    uploadedBy: (metadata.uploadedBy as string) ?? '',
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
  const location = resolveStorageLocation(m.url, m.storageBucket, m.storagePath);
  const payload = {
    storage_path: location.storagePath ?? (m.url.startsWith('http') ? '' : m.url),
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
    metadata: {
      caption: m.caption ?? null,
      projectName: m.projectName ?? null,
      realizationDate: m.realizationDate ?? null,
      uploadedBy: m.uploadedBy,
    },
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
  let query = sb.from('media_items').select('*');
  query = idOrUrl.startsWith('http')
    ? query.eq('public_url', idOrUrl)
    : query.eq('id', idOrUrl);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error(`Lecture du média avant suppression impossible : ${error.message}`);
  if (!data) throw new Error('Média introuvable ou non autorisé.');

  const media = pgToMedia(data as Record<string, unknown>);
  if (media.storageBucket && media.storagePath) {
    await deleteEnterpriseStorageFile(media.storagePath, media.storageBucket);
  }

  const { data: deleted, error: deleteError } = await sb
    .from('media_items')
    .delete()
    .eq('id', media.id)
    .select('id');
  if (deleteError) throw new Error(`Suppression de la fiche média refusée : ${deleteError.message}`);
  if (!deleted?.length) throw new Error('Fiche média introuvable ou suppression non autorisée.');
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
