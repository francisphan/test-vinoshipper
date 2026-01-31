const DEMO_RESPONSES: Record<string, string> = {
  sync: `I'll sync all your inventory now.

ACTION:SYNC_ALL

This will update all items from your CSV to match Vinoshipper inventory.`,

  switch: `I'll switch to that client for you.

ACTION:SWITCH_CLIENT {CLIENT_NAME}

You're now viewing their inventory.`,

  check: `Let me check inventory across all your clients.

ACTION:CHECK_ALL_CLIENTS

I'll report back on any low stock items.`,

  default: `I'm here to help you manage your wine inventory across multiple Vinoshipper accounts. Here's what I can do:

- **Sync inventory**: "Sync all items" or "Sync WINE-001, WINE-002"
- **Switch clients**: "Switch to [client name]"
- **Check stock**: "Which clients have low stock?" or "Check all clients"
- **Compare**: "Compare CSV with Vinoshipper inventory"

What would you like to do?`,
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendDemoMessage = async (userMessage: string): Promise<string> => {
  // Simulate network delay
  await delay(800 + Math.random() * 700);

  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('sync all') || lowerMessage.includes('sync everything')) {
    return DEMO_RESPONSES.sync;
  }

  if (lowerMessage.includes('switch to') || lowerMessage.includes('change to')) {
    const clientMatch = userMessage.match(/(?:switch|change)\s+to\s+(.+)/i);
    const clientName = clientMatch ? clientMatch[1].trim() : 'Demo Winery';
    return DEMO_RESPONSES.switch.replace('{CLIENT_NAME}', clientName);
  }

  if (
    lowerMessage.includes('check all') ||
    lowerMessage.includes('all clients') ||
    lowerMessage.includes('low stock')
  ) {
    return DEMO_RESPONSES.check;
  }

  if (lowerMessage.includes('compare') || lowerMessage.includes('difference')) {
    return `Looking at your current inventory comparison:

**Items needing sync:**
- WINE-001 (Cabernet Sauvignon): CSV has 50, Vinoshipper has 45
- WINE-004 (Rosé): CSV has 12, Vinoshipper has 8

**Items in sync:**
- WINE-002 (Chardonnay): 32 units
- WINE-003 (Pinot Noir): 18 units

Would you like me to sync the items that differ?`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
    return DEMO_RESPONSES.default;
  }

  return `I understand you're asking about "${userMessage}".

In demo mode, I can simulate:
- Syncing inventory (say "sync all")
- Switching clients (say "switch to [name]")
- Checking all clients (say "check all clients")

This is a demonstration - connect real API keys for full functionality.`;
};
