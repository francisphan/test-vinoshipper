import { Client, InventoryItem, CSVItem } from '../types';

export const buildSystemPrompt = (
  clients: Client[],
  selectedClient: Client,
  inventory: InventoryItem[],
  csvInventory: CSVItem[] | null
): string => {
  const vinoshipperData = inventory
    .map(item => `${item.sku}: ${item.name} - ${item.quantity} units`)
    .join('\n');

  let csvData = 'No CSV uploaded yet';
  if (csvInventory) {
    csvData = csvInventory
      .map(item => `${item.sku}: ${item.name} - ${item.quantity} units`)
      .join('\n');
  }

  const clientList = clients.map(c => c.name).join(', ');

  return `You are an AI assistant managing inventory for The Vines - a wine sales consulting company managing multiple wine producer accounts on Vinoshipper.

Current Context:
- Managing ${clients.length} client account(s): ${clientList}
- Currently viewing: ${selectedClient.name}
- Fulfillment center: ${selectedClient.fulfillment}

Current Vinoshipper Inventory for ${selectedClient.name}:
${vinoshipperData}

CSV Inventory (Source of Truth):
${csvData}

You can help with:
- Switching between client accounts: "Switch to [client name]"
- Comparing CSV inventory with Vinoshipper
- Syncing CSV quantities to Vinoshipper (CSV is authoritative)
- Finding products and checking stock levels
- Cross-client operations: "Which clients have low stock?"

When asked to switch clients, respond with: ACTION:SWITCH_CLIENT [client_name]
When asked to sync, respond with: ACTION:SYNC_ALL or ACTION:SYNC [SKU1,SKU2]
When asked about all clients, respond with: ACTION:CHECK_ALL_CLIENTS

Be conversational and help manage their multi-client operations efficiently.`;
};

export interface AgentActionCallbacks {
  onSwitchClient: (clientName: string) => void;
  onCheckAllClients: () => Promise<void>;
  onSyncAll: () => Promise<void>;
  onSyncPartial: (skus: string[]) => Promise<void>;
  onError: (message: string) => void;
}

export const executeAgentActions = async (
  message: string,
  callbacks: AgentActionCallbacks
): Promise<void> => {
  // Switch client
  const switchMatch = message.match(/ACTION:SWITCH_CLIENT\s+(.+)/i);
  if (switchMatch) {
    const clientName = switchMatch[1].trim();
    callbacks.onSwitchClient(clientName);
    return;
  }

  // Check all clients
  if (message.includes('ACTION:CHECK_ALL_CLIENTS')) {
    await callbacks.onCheckAllClients();
    return;
  }

  // Sync all
  if (message.includes('ACTION:SYNC_ALL')) {
    await callbacks.onSyncAll();
    return;
  }

  // Sync specific items
  const syncMatch = message.match(/ACTION:SYNC\s+\[([\w-,\s]+)\]/);
  if (syncMatch) {
    const skus = syncMatch[1].split(',').map(s => s.trim());
    await callbacks.onSyncPartial(skus);
  }
};
