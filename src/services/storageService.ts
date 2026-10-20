// Supabase Storage est prioritaire ; Firebase reste un repli legacy soumis à ses règles.
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, storage } from './firebase';
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

  if (supabase) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Session Supabase inaccessible : ${sessionError.message}`);
    }

    const session = sessionData.session;
    if (session) {
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
  }

  // Repli uniquement pour les sessions Firebase legacy. Une session Supabase
  // active ne bascule jamais vers Firebase en cas de refus des policies RLS.
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Connexion requise pour téléverser un fichier.');
  }

  const folderPath = {
    photos: `media/${user.uid}/photos`,
    signatures: `signatures/${user.uid}`,
    documents: `documents/${user.uid}`,
    pv_clotures: `erp/${user.uid}/pv_clotures`,
  }[folder];
  const storagePath = `${folderPath}/${year}/${timestamp}_${cleanName}`;
  const fileRef = ref(storage, storagePath);
  let uploadedRef: typeof fileRef | null = null;

  try {
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });
    uploadedRef = snapshot.ref;

    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      id: `file-${timestamp}`,
      name: file.name,
      size: file.size,
      type: file.type,
      storageUrl: downloadUrl,
      storageBucket: storage.app.options.storageBucket,
      storagePath,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    let cleanupNotice = '';
    if (uploadedRef) {
      try {
        await deleteObject(uploadedRef);
        cleanupNotice = ' Le fichier téléversé a été supprimé.';
      } catch (cleanupError) {
        cleanupNotice = ` Le fichier peut rester présent : suppression impossible (${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}).`;
      }
    }
    console.error('[Firebase Storage] Upload refusé :', error);
    throw new Error(
      `Téléversement impossible : ${error instanceof Error ? error.message : String(error)}.${cleanupNotice}`
    );
  }
}

export async function deleteEnterpriseStorageFile(
  storagePathOrUrl: string,
  storageBucket?: string
): Promise<boolean> {
  const supabaseBuckets = ['media', 'signatures', 'client_docs', 'erp'];
  if (storageBucket && supabaseBuckets.includes(storageBucket)) {
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
      .from(storageBucket)
      .remove([storagePathOrUrl]);
    if (error) {
      throw new Error(`Suppression Supabase refusée : ${error.message}`);
    }
    return true;
  }

  try {
    await deleteObject(ref(storage, storagePathOrUrl));
    return true;
  } catch (error) {
    console.error('[Firebase Storage] Suppression refusée :', error);
    throw new Error(`Suppression du fichier impossible : ${error instanceof Error ? error.message : String(error)}.`);
  }
}
