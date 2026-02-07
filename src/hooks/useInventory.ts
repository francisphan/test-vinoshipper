import { useState, useCallback } from 'react';
import { InventoryItem, CSVItem } from '../types';
import { VinoshipperClient, VinoshipperApiError } from '../client/VinoshipperClient';
import { getInventoryCache, setInventoryCache } from '../services/inventoryCache';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [csvInventory, setCsvInventory] = useState<CSVItem[] | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadInventory = useCallback(async (clientId: string, apiKey: string): Promise<{ success: boolean; count: number; fromCache?: boolean; error?: string }> => {
    try {
      const client = new VinoshipperClient(apiKey);
      const data = await client.getInventory();
      setInventory(data);
      setLastFetched(new Date());
      setInventoryCache(clientId, data);
      return { success: true, count: data.length };
    } catch (error) {
      console.error('Failed to load inventory:', error);

      let errorMessage = 'Unknown error';
      if (error instanceof VinoshipperApiError) {
        errorMessage = error.message;
      }

      // Try to load from cache
      const cached = getInventoryCache(clientId);
      if (cached) {
        setInventory(cached.items);
        setLastFetched(cached.fetchedAt);
        return { success: false, count: cached.items.length, fromCache: true, error: errorMessage };
      }

      // No cache available
      setInventory([]);
      setLastFetched(null);
      return { success: false, count: 0, error: errorMessage };
    }
  }, []);

  const updateInventoryItem = useCallback((sku: string, quantity: number) => {
    setInventory(prev => {
      const existing = prev.find(i => i.sku === sku);
      if (existing) {
        return prev.map(i =>
          i.sku === sku
            ? { ...i, quantity, lastSync: new Date() }
            : i
        );
      } else {
        const csvItem = prev.find(i => i.sku === sku);
        return [...prev, { sku, name: csvItem?.name || sku, quantity, lastSync: new Date() }];
      }
    });
  }, []);

  const clearCsvInventory = useCallback(() => {
    setCsvInventory(null);
    setCsvFileName('');
  }, []);

  return {
    inventory,
    setInventory,
    csvInventory,
    setCsvInventory,
    csvFileName,
    setCsvFileName,
    lastFetched,
    loadInventory,
    updateInventoryItem,
    clearCsvInventory,
  };
};
