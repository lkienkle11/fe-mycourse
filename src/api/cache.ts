/**
 * Dual-environment caching layer.
 *
 * - Server  → module-level Map (in-process memory, persists across requests).
 * - Client  → IndexedDB (survives page reloads, respects TTL on reads).
 *
 * DEFAULT_CACHE_MS is the baseline TTL that is ALWAYS applied when caching
 * is not explicitly disabled. User-supplied extra seconds are added on top.
 */

export const DEFAULT_CACHE_MS = 1_000;

// ---------------------------------------------------------------------------
// Server-side in-memory cache
// ---------------------------------------------------------------------------

interface ServerEntry {
  data: unknown;
  expiresAt: number;
}

const serverCacheMap = new Map<string, ServerEntry>();

export function getServerCache<T>(key: string): T | null {
  const entry = serverCacheMap.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    serverCacheMap.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setServerCache(
  key: string,
  data: unknown,
  ttlMs: number,
): void {
  serverCacheMap.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ---------------------------------------------------------------------------
// Client-side IndexedDB cache
// ---------------------------------------------------------------------------

const IDB_NAME = "api-cache";
const IDB_STORE = "responses";
const IDB_VERSION = 1;

interface IDBEntry {
  key: string;
  data: unknown;
  expiresAt: number;
}

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!_dbPromise) {
    _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "key" });
        }
      };

      req.onsuccess = () => resolve(req.result);

      req.onerror = () => {
        _dbPromise = null;
        reject(req.error);
      };
    });
  }
  return _dbPromise;
}

export async function getClientCache<T>(cacheKey: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise<T | null>((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(cacheKey);

      req.onsuccess = () => {
        const entry = req.result as IDBEntry | undefined;
        if (!entry) return resolve(null);

        if (Date.now() > entry.expiresAt) {
          // Evict stale entry asynchronously — non-blocking for the caller
          const delTx = db.transaction(IDB_STORE, "readwrite");
          delTx.objectStore(IDB_STORE).delete(cacheKey);
          return resolve(null);
        }

        resolve(entry.data as T);
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setClientCache(
  cacheKey: string,
  data: unknown,
  ttlMs: number,
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const entry: IDBEntry = {
        key: cacheKey,
        data,
        expiresAt: Date.now() + ttlMs,
      };
      const req = tx.objectStore(IDB_STORE).put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Cache writes are best-effort; never let a write failure surface to callers
  }
}
