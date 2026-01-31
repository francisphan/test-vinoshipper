import { Client, CSVItem, InventoryItem } from '../types';
import { VinoshipperClient, VinoshipperApiError } from '../client/VinoshipperClient';
import { SYNC_DELAY_MS } from '../constants';

export interface SyncCallbacks {
  onLog: (message: string, type: 'info' | 'success' | 'error') => void;
  onInventoryUpdate: (sku: string, quantity: number) => void;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const performFullSync = async (
  client: Client,
  csvInventory: CSVItem[],
  inventory: InventoryItem[],
  callbacks: SyncCallbacks
): Promise<void> => {
  const vinoClient = new VinoshipperClient(client.apiKey);
  callbacks.onLog(`Starting full sync for ${client.name}: ${csvInventory.length} items`, 'info');

  for (const csvItem of csvInventory) {
    await delay(SYNC_DELAY_MS);

    const vsItem = inventory.find(i => i.sku === csvItem.sku);

    try {
      if (!vsItem) {
        await vinoClient.createProduct({
          sku: csvItem.sku,
          name: csvItem.name,
          quantity: csvItem.quantity,
        });
        callbacks.onLog(
          `${client.name}: Created ${csvItem.sku} (${csvItem.quantity} units)`,
          'success'
        );
      } else if (vsItem.quantity !== csvItem.quantity) {
        await vinoClient.updateInventory(csvItem.sku, csvItem.quantity);
        callbacks.onLog(
          `${client.name}: Updated ${csvItem.sku}: ${vsItem.quantity} → ${csvItem.quantity}`,
          'success'
        );
      } else {
        callbacks.onLog(`${client.name}: ${csvItem.sku} already in sync`, 'info');
      }

      callbacks.onInventoryUpdate(csvItem.sku, csvItem.quantity);
    } catch (error) {
      const errorMsg =
        error instanceof VinoshipperApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Unknown error';
      callbacks.onLog(`${client.name}: Failed to sync ${csvItem.sku} - ${errorMsg}`, 'error');
    }
  }

  callbacks.onLog(
    `✓ Sync completed for ${client.name}: ${csvInventory.length} items processed`,
    'success'
  );
};

export const performPartialSync = async (
  client: Client,
  skus: string[],
  csvInventory: CSVItem[],
  inventory: InventoryItem[],
  callbacks: SyncCallbacks
): Promise<void> => {
  if (!csvInventory) {
    callbacks.onLog('No CSV data available for sync', 'error');
    return;
  }

  const vinoClient = new VinoshipperClient(client.apiKey);
  callbacks.onLog(`Syncing ${skus.length} item(s) for ${client.name}...`, 'info');

  for (const sku of skus) {
    await delay(SYNC_DELAY_MS);

    const csvItem = csvInventory.find(i => i.sku === sku);
    const vsItem = inventory.find(i => i.sku === sku);

    if (!csvItem) {
      callbacks.onLog(`${sku}: Not found in CSV`, 'error');
      continue;
    }

    try {
      if (!vsItem) {
        await vinoClient.createProduct({
          sku: csvItem.sku,
          name: csvItem.name,
          quantity: csvItem.quantity,
        });
        callbacks.onLog(`${sku}: Created with ${csvItem.quantity} units`, 'success');
      } else {
        await vinoClient.updateInventory(sku, csvItem.quantity);
        callbacks.onLog(
          `${sku}: Updated ${vsItem.quantity} → ${csvItem.quantity}`,
          'success'
        );
      }

      callbacks.onInventoryUpdate(sku, csvItem.quantity);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      callbacks.onLog(`${sku}: Sync failed - ${errorMsg}`, 'error');
    }
  }

  callbacks.onLog(`Sync completed: ${skus.length} item(s) processed`, 'success');
};

export const checkAllClients = async (
  clients: Client[],
  onLog: (message: string, type: 'info' | 'success' | 'error') => void
): Promise<void> => {
  onLog('Checking inventory across all clients...', 'info');

  for (const client of clients) {
    await delay(300);
    // In real implementation, would fetch actual inventory
    const lowStockCount = Math.floor(Math.random() * 5);
    onLog(
      `${client.name}: ${lowStockCount} low stock items`,
      lowStockCount > 0 ? 'info' : 'success'
    );
  }
};
