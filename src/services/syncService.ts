// Service de Synchronisation Bi-directionnelle & Cache Contrôlé (Architecture Offline-First Production)
// IndexedDB = Cache Local + File d'attente de Synchronisation
// Base Centrale Serveur = Source Unique de Vérité

import { ApiClient } from './apiClient';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'error';

export interface QueuedMutation {
  id: string;
  /** Identifiant stable d'idempotence (Phase 2.2) : le serveur ignore les
   *  réémissions du même operationId (contrat sync_operations). */
  operationId: string;
  entity: string;
  action: 'create' | 'update' | 'delete' | 'updateAll';
  data: any;
  clientTimestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

const DB_NAME = 'viva_sync_engine_db';
const DB_VERSION = 2;
const QUEUE_STORE = 'sync_queue';
const CACHE_STORE = 'entity_cache';

let dbPromise: Promise<IDBDatabase> | null = null;

function getSyncDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB non supporté'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

type SyncStatusListener = (status: SyncStatus, pendingCount: number) => void;

class SyncServiceClass {
  private status: SyncStatus = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
  private pendingCount: number = 0;
  private listeners: Set<SyncStatusListener> = new Set();
  private isSyncing: boolean = false;
  private lastSyncTime: string = '1970-01-01T00:00:00.000Z';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('online');
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });

      // Count pending on start
      this.refreshPendingCount();

      // Periodically sync every 45s when online
      setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.flushQueue();
        }
      }, 45000);
    }
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.pendingCount);
    return () => this.listeners.delete(listener);
  }

  private setStatus(newStatus: SyncStatus): void {
    this.status = newStatus;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => fn(this.status, this.pendingCount));
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getPendingCount(): number {
    return this.pendingCount;
  }

  // Enqueue mutation in IndexedDB (idempotente par operationId stable)
  public async queueMutation(entity: string, action: QueuedMutation['action'], data: any): Promise<void> {
    const base = `${entity}:${action}:${JSON.stringify(data?.id ?? data)}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    const mutation: QueuedMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      operationId: `op-${hash.toString(36)}-${Date.now().toString(36)}`,
      entity,
      action,
      data,
      clientTimestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };

    try {
      const db = await getSyncDb();
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      tx.objectStore(QUEUE_STORE).put(mutation);
      await new Promise((res, rej) => {
        tx.oncomplete = res;
        tx.onerror = rej;
      });
      await this.refreshPendingCount();
    } catch (e) {
      // LocalStorage fallback
      const queue = JSON.parse(localStorage.getItem('viva_sync_queue') || '[]');
      queue.push(mutation);
      localStorage.setItem('viva_sync_queue', JSON.stringify(queue));
      this.pendingCount = queue.length;
      this.notifyListeners();
    }

    // Attempt instant sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.flushQueue();
    }
  }

  private async refreshPendingCount(): Promise<void> {
    try {
      const db = await getSyncDb();
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const req = tx.objectStore(QUEUE_STORE).count();
      req.onsuccess = () => {
        this.pendingCount = req.result;
        this.notifyListeners();
      };
    } catch {
      const queue = JSON.parse(localStorage.getItem('viva_sync_queue') || '[]');
      this.pendingCount = queue.length;
      this.notifyListeners();
    }
  }

  // Flush queue to server
  public async flushQueue(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.isSyncing = true;
    this.setStatus('syncing');

    try {
      const db = await getSyncDb();
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const req = tx.objectStore(QUEUE_STORE).getAll();

      const mutations: QueuedMutation[] = await new Promise((res, rej) => {
        req.onsuccess = () => res(req.result || []);
        req.onerror = rej;
      });

      if (mutations.length > 0) {
        // Send to server
        const res = await ApiClient.pushSync(mutations);

        if (res.success) {
          // Clear successfully processed items from IndexedDB
          const clearTx = db.transaction(QUEUE_STORE, 'readwrite');
          clearTx.objectStore(QUEUE_STORE).clear();
          await new Promise(res => { clearTx.oncomplete = res; });
          localStorage.removeItem('viva_sync_queue');
        }
      }

      // Pull latest server delta
      await this.pullServerData();

      this.pendingCount = 0;
      this.setStatus('synced');
    } catch (err) {
      console.warn("[SyncService] Sync failed:", err);
      this.setStatus('error');
      // Compteur de tentatives (contrat R4-28) : conservé en file pour retry.
      try {
        const db = await getSyncDb();
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const all: QueuedMutation[] = await new Promise((res, rej) => {
          const q = store.getAll();
          q.onsuccess = () => res(q.result || []);
          q.onerror = rej;
        });
        for (const m of all) {
          store.put({ ...m, retryCount: (m.retryCount ?? 0) + 1, status: 'failed' });
        }
        await new Promise(res => { tx.oncomplete = res; });
      } catch {
        /* file conservée telle quelle */
      }
    } finally {
      this.isSyncing = false;
      this.refreshPendingCount();
    }
  }

  // Pull delta from central server database
  public async pullServerData(): Promise<any> {
    try {
      const token = ApiClient.getToken();
      if (!token) {
        return null;
      }
      const res = await ApiClient.pullSync(this.lastSyncTime);
      if (res && res.data) {
        this.lastSyncTime = res.serverTime;
        // Save to IndexedDB cache
        const db = await getSyncDb();
        const tx = db.transaction(CACHE_STORE, 'readwrite');
        const store = tx.objectStore(CACHE_STORE);

        Object.keys(res.data).forEach(key => {
          store.put({ key, value: res.data[key], timestamp: res.serverTime });
        });

        return res.data;
      }
    } catch (err) {
      console.warn("[SyncService] Failed to pull delta:", err);
    }
    return null;
  }

  // Cache getter helper
  public async getCached<T>(key: string): Promise<T | null> {
    try {
      const db = await getSyncDb();
      const tx = db.transaction(CACHE_STORE, 'readonly');
      const req = tx.objectStore(CACHE_STORE).get(key);
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
}

export const syncService = new SyncServiceClass();
