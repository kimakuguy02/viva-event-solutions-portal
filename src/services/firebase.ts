import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
  type QueryConstraint
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/* CRITICAL: The app will break without this line */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on startup
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('[Firebase] Firestore connection test successful.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firebase] Please check your Firebase configuration.');
    } else {
      console.warn('[Firebase] Connection ping test handled:', error instanceof Error ? error.message : error);
    }
    return false;
  }
}

// Auto-run connection test when module loads
testConnection().catch(() => {});

/**
 * High-level helper for Firestore writes with standard error handling
 */
export async function setFirestoreDocument<T extends object>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  try {
    await setDoc(docRef, data as Record<string, any>);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

/**
 * High-level helper for Firestore updates with standard error handling
 */
export async function updateFirestoreDocument<T extends object>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  try {
    await updateDoc(docRef, data as Record<string, any>);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${docId}`);
  }
}

/**
 * High-level helper for Firestore deletes with standard error handling
 */
export async function deleteFirestoreDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

/**
 * High-level helper for Firestore collection read
 */
export async function getFirestoreCollection<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  try {
    const q = constraints.length > 0
      ? query(collection(db, collectionName), ...constraints)
      : collection(db, collectionName);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
}

/**
 * Real-time listener helper with standard error handling
 */
export function subscribeFirestoreCollection<T>(
  collectionName: string,
  onNext: (items: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const q = constraints.length > 0 
    ? query(collection(db, collectionName), ...constraints) 
    : collection(db, collectionName);

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T));
      onNext(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  );
}

/**
 * High-level helper to fetch a single Firestore document by ID
 */
export async function getFirestoreDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as T;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
  }
}

/**
 * Immutable Append-Only Audit Log Writer (Direct to Firestore /audit_logs)
 */
export async function logAuditEvent(params: {
  action: string;
  resource: string;
  resourceId?: string;
  userEmail?: string;
  details?: string;
  device?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const currentUser = auth.currentUser;
  const userEmail = params.userEmail || currentUser?.email || 'visitor@viva-eventsolutions.cd';
  const timestamp = new Date().toISOString();

  try {
    await setDoc(doc(db, 'audit_logs', logId), {
      id: logId,
      timestamp,
      userEmail,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || '',
      actorUid: currentUser?.uid || 'anonymous',
      ipAddress: 'client-secure',
      device: params.device || (typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 150) : 'Web App'),
      details: params.details || '',
      metadata: params.metadata || {}
    });
  } catch (err) {
    console.warn('[Firebase] Non-fatal audit log notification:', err);
  }
}

