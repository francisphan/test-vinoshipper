import { InventoryItem } from '../types';

interface CachedInventory {
  items: InventoryItem[];
  fetchedAt: string;
}

const CACHE_KEY_PREFIX = 'inventory_cache_';

function cacheKey(clientId: string): string {
  return `${CACHE_KEY_PREFIX}${clientId}`;
}

export function getInventoryCache(clientId: string): { items: InventoryItem[]; fetchedAt: Date } | null {
  try {
    const raw = localStorage.getItem(cacheKey(clientId));
    if (!raw) return null;

    const parsed: CachedInventory = JSON.parse(raw);
    return {
      items: parsed.items.map(item => ({
        ...item,
        lastSync: item.lastSync ? new Date(item.lastSync) : undefined,
      })),
      fetchedAt: new Date(parsed.fetchedAt),
    };
  } catch {
    return null;
  }
}

export function setInventoryCache(clientId: string, items: InventoryItem[]): void {
  try {
    const data: CachedInventory = {
      items,
      fetchedAt: new Date().toISOString(),
    };
    localStorage.setItem(cacheKey(clientId), JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function clearInventoryCache(clientId: string): void {
  localStorage.removeItem(cacheKey(clientId));
}
