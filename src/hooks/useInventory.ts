import { useState, useCallback } from 'react';
import { InventoryItem, CSVItem } from '../types';
import { VinoshipperClient, VinoshipperApiError } from '../client/VinoshipperClient';
import { MOCK_INVENTORY } from '../constants';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [csvInventory, setCsvInventory] = useState<CSVItem[] | null>(null);
  const [csvFileName, setCsvFileName] = useState('');

  const loadInventory = useCallback(async (apiKey: string): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const client = new VinoshipperClient(apiKey);
      const data = await client.getInventory();
      setInventory(data);
      return { success: true, count: data.length };
    } catch (error) {
      console.error('Failed to load inventory:', error);

      let errorMessage = 'Unknown error';
      if (error instanceof VinoshipperApiError) {
        errorMessage = error.message;
      }

      // Fallback to mock data
      setInventory(MOCK_INVENTORY);
      return { success: false, count: MOCK_INVENTORY.length, error: errorMessage };
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
    loadInventory,
    updateInventoryItem,
    clearCsvInventory,
  };
};
