import { supabase } from './supabase';

export interface UploadedFileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  storageUrl: string;
  storageBucket?: string;
  storagePath?: string;
  uploadedAt: string;
}

export async function uploadToEnterpriseStorage(
  file: File,
  folder: 'photos' | 'signatures' | 'documents' | 'pv_clotures' = 'documents'
): Promise<UploadedFileMetadata> {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const year = new Date().getFullYear();

  if (!supabase) {
    throw new Error('Téléversement impossible : service Supabase non configuré.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Session Supabase inaccessible : ${sessionError.message}`);
  }

  const session = sessionData.session;
  if (!session) {
    throw new Error('Connexion requise pour téléverser un fichier.');
  }

  const storageBucket = {
    photos: 'media',
    signatures: 'signatures',
    documents: 'client_docs',
    pv_clotures: 'erp',
  }[folder];
  const storagePath = `${session.user.id}/${year}/${timestamp}_${cleanName}`;
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });
  if (error) {
    throw new Error(`Téléversement Supabase refusé : ${error.message}`);
  }

  let storageUrl: string;
  if (storageBucket === 'media') {
    storageUrl = supabase.storage.from(storageBucket).getPublicUrl(data.path).data.publicUrl;
  } else {
    const { data: signedData, error: signedError } = await supabase.storage
      .from(storageBucket)
      .createSignedUrl(data.path, 60 * 60);
    if (signedError) {
      const { error: cleanupError } = await supabase.storage
        .from(storageBucket)
        .remove([data.path]);
      const cleanupNotice = cleanupError
        ? ` Le fichier téléversé n’a pas pu être supprimé : ${cleanupError.message}.`
        : ' Le fichier téléversé a été supprimé.';
      throw new Error(`Lien temporaire du fichier impossible : ${signedError.message}.${cleanupNotice}`);
    }
    storageUrl = signedData.signedUrl;
  }

  return {
    id: `file-${timestamp}`,
    name: file.name,
    size: file.size,
    type: file.type,
    storageUrl,
    storageBucket,
    storagePath: data.path,
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteEnterpriseStorageFile(
  storagePathOrUrl: string,
  storageBucket?: string
): Promise<boolean> {
  const supabaseBuckets = ['media', 'signatures', 'client_docs', 'erp'];
  const targetBucket = storageBucket && supabaseBuckets.includes(storageBucket) ? storageBucket : 'media';

  if (!supabase) {
    throw new Error('Suppression impossible : client Supabase non configuré.');
  }
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Session Supabase inaccessible : ${sessionError.message}`);
  }
  if (!sessionData.session) {
    throw new Error('Session Supabase requise pour supprimer ce fichier.');
  }
  const { error } = await supabase.storage
    .from(targetBucket)
    .remove([storagePathOrUrl]);
  if (error) {
    throw new Error(`Suppression Supabase refusée : ${error.message}`);
  }
  return true;
}
