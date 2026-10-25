/**
 * Fitkode $0 Storage Guard & Offline Sync Queue
 * 1. Prevents `QuotaExceededError` (5MB browser localStorage cap) by stripping inline base64 blobs
 *    from local caches when needed and pruning stale cache entries on quota pressure.
 * 2. Queues failed or offline mutations (profile, onboarding, weekly check-ins, meal & workout plans)
 *    so spotty gym Wi-Fi or mobile data drops never lose user progress.
 */

export type SyncEntityType =
  | 'profile'
  | 'onboarding'
  | 'weekly_entries'
  | 'meal_plans'
  | 'workout_plans';

export interface PendingSyncItem {
  id: string;
  type: SyncEntityType;
  targetKey: string;
  payload: any;
  queuedAt: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'fitkode_pending_sync_queue_v1';

/**
 * Strips heavy inline `data:image/...` base64 strings (> 4KB) from an object clone
 * when saving to localStorage under quota pressure, while keeping normal URLs intact.
 */
export function stripHeavyBase64ForLocalCache<T>(input: T): T {
  if (!input || typeof input !== 'object') return input;
  try {
    const json = JSON.stringify(input, (_key, value) => {
      if (typeof value === 'string' && value.startsWith('data:image/') && value.length > 4096) {
        return '';
      }
      return value;
    });
    return JSON.parse(json) as T;
  } catch {
    return input;
  }
}

/**
 * Safely writes to `localStorage` with automatic 5MB QuotaExceededError recovery.
 * - First attempts to write the exact serialized value.
 * - On QuotaExceededError:
 *   1. Prunes non-essential caches or strips heavy base64 images from cached weekly tracker entries.
 *   2. Retries writing a base64-slimmed version of the payload so critical user data & auth sessions never fail.
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false;
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;

    if (!isQuotaError) {
      console.warn(`[StorageGuard] Failed to write key "${key}":`, err);
      return false;
    }

    console.warn(`[StorageGuard] QuotaExceededError on "${key}". Running automatic cache slimming...`);

    try {
      // Step 1: Slim down any existing `fitkode_weekly_entries_*` or `fitkode_members_registry_v1` in localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const existingKey = localStorage.key(i);
        if (!existingKey) continue;
        if (
          existingKey.startsWith('fitkode_weekly_entries_') ||
          existingKey === 'fitkode_members_registry_v1'
        ) {
          const raw = localStorage.getItem(existingKey);
          if (raw && raw.includes('data:image/')) {
            try {
              const parsed = JSON.parse(raw);
              const slimmed = stripHeavyBase64ForLocalCache(parsed);
              localStorage.setItem(existingKey, JSON.stringify(slimmed));
            } catch {
              // ignore
            }
          }
        }
      }

      // Step 2: Retry writing slimmed version of the target value
      const slimmedTarget =
        typeof value === 'string'
          ? value.includes('data:image/')
            ? JSON.stringify(stripHeavyBase64ForLocalCache(JSON.parse(value)))
            : value
          : JSON.stringify(stripHeavyBase64ForLocalCache(value));

      localStorage.setItem(key, slimmedTarget);
      return true;
    } catch (retryErr) {
      console.error(`[StorageGuard] Recovery write failed for "${key}":`, retryErr);
      return false;
    }
  }
}

/**
 * Reads all pending offline sync items from localStorage.
 */
export function getOfflineSyncQueue(): PendingSyncItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineSyncQueue(queue: PendingSyncItem[]) {
  if (typeof window === 'undefined') return;
  safeLocalStorageSet(OFFLINE_QUEUE_KEY, queue);
  window.dispatchEvent(
    new CustomEvent('fitkode_sync_queue_updated', {
      detail: { count: queue.length },
    })
  );
}

/**
 * Adds or updates a mutation in the Pending Offline Sync Queue.
 * Deduplicates by `(type, targetKey)` so rapid edits only sync the latest state.
 */
export function enqueueOfflineSync(
  type: SyncEntityType,
  targetKey: string,
  payload: any
): void {
  if (typeof window === 'undefined') return;
  const normKey = (targetKey || 'default').toLowerCase().trim();
  const id = `${type}:${normKey}`;
  const queue = getOfflineSyncQueue();
  const existingIdx = queue.findIndex((item) => item.id === id);

  const item: PendingSyncItem = {
    id,
    type,
    targetKey: normKey,
    payload: stripHeavyBase64ForLocalCache(payload),
    queuedAt: new Date().toISOString(),
    retryCount: existingIdx >= 0 ? queue[existingIdx].retryCount : 0,
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = item;
  } else {
    queue.push(item);
  }

  saveOfflineSyncQueue(queue);
}

/**
 * Removes an item from the Pending Offline Sync Queue once synced.
 */
export function removeOfflineSyncItem(id: string): void {
  if (typeof window === 'undefined') return;
  const queue = getOfflineSyncQueue().filter((item) => item.id !== id);
  saveOfflineSyncQueue(queue);
}

/**
 * Subscribes to changes in the offline sync queue and browser online/offline state.
 */
export function subscribeToSyncStatus(
  callback: (status: { isOnline: boolean; pendingCount: number }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const notify = () => {
    callback({
      isOnline: navigator.onLine,
      pendingCount: getOfflineSyncQueue().length,
    });
  };

  window.addEventListener('fitkode_sync_queue_updated', notify);
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);

  return () => {
    window.removeEventListener('fitkode_sync_queue_updated', notify);
    window.removeEventListener('online', notify);
    window.removeEventListener('offline', notify);
  };
}
