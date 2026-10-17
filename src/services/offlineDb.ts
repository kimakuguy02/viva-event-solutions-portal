// Service de Persistance Locale & Mode Hors Ligne (IndexedDB + Fallback LocalStorage)
// Conforme ERP Entreprise VIVA EVENT SOLUTIONS SARLU

const DB_NAME = 'viva_enterprise_erp_db';
const DB_VERSION = 1;
const STORES = [
  'erp_transactions',
  'erp_closures',
  'erp_tasks',
  'erp_reports',
  'erp_loans',
  'erp_clients',
  'erp_interactions',
  'erp_notices'
];

let dbPromise: Promise<IDBDatabase> | null = null;

function getIndexedDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB non disponible'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

export async function saveToOfflineStore<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
  try {
    const db = await getIndexedDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Clear & put
    store.clear();
    items.forEach(item => store.put(item));

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        // Also sync to localStorage as redundant safe cache
        localStorage.setItem(`viva_erp_${storeName}`, JSON.stringify(items));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Fallback standard localStorage
    localStorage.setItem(`viva_erp_${storeName}`, JSON.stringify(items));
  }
}

/* Le cache local n'est qu'un cache : Supabase est la source de vérité.
   Une absence d'entrée doit donc rendre un tableau vide, jamais un jeu de
   démonstration — les seeds ERP (factures, clients, salaires) sont fictifs et
   rendaient un grand livre inventé indistinguable du réel. */
export async function loadFromOfflineStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getIndexedDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.length > 0) {
          resolve(request.result as T[]);
        } else {
          resolve(readLocalStorageStore<T>(storeName));
        }
      };
      request.onerror = () => resolve(readLocalStorageStore<T>(storeName));
    });
  } catch (err) {
    return readLocalStorageStore<T>(storeName);
  }
}

function readLocalStorageStore<T>(storeName: string): T[] {
  const local = localStorage.getItem(`viva_erp_${storeName}`);
  if (!local) return [];
  try {
    const parsed = JSON.parse(local);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

/* Les caches IndexedDB et localStorage ont pu être remplis avec les seeds
   fictifs avant ce correctif. Ils sont jetables : chaque écriture ERP part
   d'abord vers Supabase, donc purger le cache ne perd aucune donnée réelle.
   Le purge ne se fait qu'une fois par version de cache, sinon le mode hors
   ligne perdrait son utilité. */
const CACHE_VERSION_KEY = 'viva_erp_cache_version';
const CACHE_VERSION = '3';

export async function ensureErpCacheVersion(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(CACHE_VERSION_KEY) === CACHE_VERSION) return;

  STORES.forEach(storeName => localStorage.removeItem(`viva_erp_${storeName}`));
  // Faux journal d'audit : adresses IP inventées, écrivait sans jamais toucher
  // la base. Retiré pour qu'un journal affiche « rien » plutôt que du décor.
  localStorage.removeItem('viva_audit_logs');
  // Faux annuaire staff et faux visiteurs : comptes inventés avec privilèges
  // (god_mode) et trafic de démonstration présenté comme de l'audience réelle.
  localStorage.removeItem('viva_managed_users');
  localStorage.removeItem('viva_visitor_sessions');
  try {
    const db = await getIndexedDB();
    await Promise.all(STORES.map(storeName => new Promise<void>((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    })));
  } catch {
    /* IndexedDB indisponible : le purge localStorage suffit. */
  }
  localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
}
