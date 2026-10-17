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

export async function loadFromOfflineStore<T>(storeName: string, defaultItems: T[]): Promise<T[]> {
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
          // Check localStorage fallback
          const local = localStorage.getItem(`viva_erp_${storeName}`);
          if (local) {
            try {
              resolve(JSON.parse(local));
              return;
            } catch (e) {}
          }
          resolve(defaultItems);
        }
      };
      request.onerror = () => {
        const local = localStorage.getItem(`viva_erp_${storeName}`);
        if (local) {
          try {
            resolve(JSON.parse(local));
            return;
          } catch (e) {}
        }
        resolve(defaultItems);
      };
    });
  } catch (err) {
    const local = localStorage.getItem(`viva_erp_${storeName}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return defaultItems;
  }
}
