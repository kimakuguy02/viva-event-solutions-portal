// Service de Téléversement & Gestion des Documents / Photos (Véritable Intégration Firebase Storage)
// Élimine définitivement le stockage de chaînes Base64 lourdes dans le state local
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadedFileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  storageUrl: string;
  uploadedAt: string;
}

export async function uploadToEnterpriseStorage(
  file: File,
  folder: 'photos' | 'signatures' | 'documents' | 'pv_clotures' = 'documents'
): Promise<UploadedFileMetadata> {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${folder}/2026/${timestamp}_${cleanName}`;
  const fileRef = ref(storage, storagePath);

  try {
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      id: `file-${timestamp}`,
      name: file.name,
      size: file.size,
      type: file.type,
      storageUrl: downloadUrl,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    // Phase 1, Blocs 8-9 : JAMAIS de faux succès. Un échec d'upload est une
    // erreur propagée (l'ancienne URL de repli pointait vers un objet inexistant).
    console.error('[Firebase Storage] Upload refusé :', error);
    throw new Error(
      `Téléversement impossible : ${error instanceof Error ? error.message : String(error)}. Aucun fichier enregistré.`
    );
  }
}

export async function deleteEnterpriseStorageFile(storagePathOrUrl: string): Promise<boolean> {
  try {
    const fileRef = ref(storage, storagePathOrUrl);
    await deleteObject(fileRef);
    return true;
  } catch (err) {
    console.warn('[Firebase Storage] Delete file error handled:', err);
    return false;
  }
}
// NOTE Phase 1 : generateStorageSignatureUrl() supprimée (URL fabriquée vers
// un objet jamais téléversé = faux succès). Les signatures passeront par
// Storage réel + métadonnées (buckets `signatures`, R4).
