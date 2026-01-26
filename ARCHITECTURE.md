# Vinoshipper AI Agent - Desktop Application

A standalone desktop app users can download and run to manage their Vinoshipper account through natural language.

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Electron Desktop App              │
│  ┌───────────────────────────────┐  │
│  │  React UI (Chat Interface)    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Main Process (Node.js)       │  │
│  │  - Vinoshipper API Client     │  │
│  │  - Claude API Integration     │  │
│  │  - Local Storage (SQLite)     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Tech Stack

**Framework:** Electron (packages web tech into native apps)
- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js (Electron main process)
- **AI:** Anthropic Claude API
- **Database:** SQLite (local user data)
- **Packaging:** electron-builder (creates installers)

## Project Structure

```
vinoshipper-agent/
├── package.json
├── electron.js                 # Main Electron process
├── src/
│   ├── App.jsx                # React UI
│   ├── components/
│   │   ├── ChatInterface.jsx
│   │   ├── InventoryView.jsx
│   │   └── SettingsPanel.jsx
│   ├── services/
│   │   ├── vinoshipper.js    # Vinoshipper API client
│   │   ├── claude.js         # Claude AI integration
│   │   └── storage.js        # Local database
│   └── utils/
│       └── agent.js          # AI agent logic
├── public/
│   └── index.html
└── build/                     # Build configurations
    ├── icon.png
    └── entitlements.mac.plist
```

## Key Implementation Files

### 1. package.json

```json
{
  "name": "vinoshipper-agent",
  "version": "1.0.0",
  "description": "AI-powered Vinoshipper assistant",
  "main": "electron.js",
  "scripts": {
    "start": "electron .",
    "dev": "concurrently \"npm run start\" \"npm run react-start\"",
    "react-start": "vite",
    "build": "vite build && electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.yourcompany.vinoshipper-agent",
    "productName": "Vinoshipper Agent",
    "files": ["electron.js", "dist/**/*", "node_modules/**/*"],
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  },
  "dependencies": {
    "electron-store": "^8.1.0",
    "better-sqlite3": "^9.2.2",
    "@anthropic-ai/sdk": "^0.27.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "vite": "^5.0.0",
    "concurrently": "^8.2.2"
  }
}
```

### 2. electron.js (Main Process)

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const VinoshipperClient = require('./src/services/vinoshipper');
const ClaudeAgent = require('./src/services/claude');

const store = new Store();
let mainWindow;
let vinoshipperClient;
let claudeAgent;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'build/icon.png')
  });

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // Initialize clients with stored credentials
  const vsApiKey = store.get('vinoshipper.apiKey');
  const claudeApiKey = store.get('claude.apiKey');
  
  if (vsApiKey) {
    vinoshipperClient = new VinoshipperClient(vsApiKey);
  }
  if (claudeApiKey) {
    claudeAgent = new ClaudeAgent(claudeApiKey, vinoshipperClient);
  }
});

// IPC handlers for renderer process
ipcMain.handle('save-credentials', async (event, { vsApiKey, claudeApiKey }) => {
  store.set('vinoshipper.apiKey', vsApiKey);
  store.set('claude.apiKey', claudeApiKey);
  
  vinoshipperClient = new VinoshipperClient(vsApiKey);
  claudeAgent = new ClaudeAgent(claudeApiKey, vinoshipperClient);
  
  return { success: true };
});

ipcMain.handle('send-message', async (event, message) => {
  if (!claudeAgent) {
    return { error: 'Please configure your API keys in settings' };
  }
  
  try {
    const response = await claudeAgent.processMessage(message);
    return { response };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('get-inventory', async () => {
  if (!vinoshipperClient) {
    return { error: 'Vinoshipper not configured' };
  }
  
  try {
    const inventory = await vinoshipperClient.getInventory();
    return { inventory };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('sync-inventory', async (event, items) => {
  if (!vinoshipperClient) {
    return { error: 'Vinoshipper not configured' };
  }
  
  try {
    const results = await vinoshipperClient.syncInventory(items);
    return { results };
  } catch (error) {
    return { error: error.message };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 3. src/services/claude.js (AI Agent Logic)

```javascript
const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAgent {
  constructor(apiKey, vinoshipperClient) {
    this.client = new Anthropic({ apiKey });
    this.vinoshipperClient = vinoshipperClient;
    this.conversationHistory = [];
  }

  async processMessage(userMessage) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Create system prompt with current inventory context
    const systemPrompt = await this.buildSystemPrompt();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: this.conversationHistory
      });

      const assistantMessage = response.content[0].text;
      
      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Check if Claude wants to perform actions
      await this.executeActions(assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async buildSystemPrompt() {
    let inventoryData = '';
    
    try {
      const inventory = await this.vinoshipperClient.getInventory();
      inventoryData = JSON.stringify(inventory, null, 2);
    } catch (error) {
      inventoryData = 'Unable to fetch inventory data';
    }

    return `You are an AI assistant helping manage a Vinoshipper account. You can:
- Check inventory levels
- Sync inventory between systems
- Search for products
- Update product quantities
- Generate reports

Current inventory data:
${inventoryData}

When the user asks you to perform actions, respond with clear confirmation of what you'll do, then use the appropriate function calls.

For sync operations, use the format:
SYNC_ACTION: [{"sku": "WINE-001", "quantity": 50}]

Be conversational and helpful. Ask clarifying questions if needed.`;
  }

  async executeActions(message) {
    // Parse sync actions from Claude's response
    const syncMatch = message.match(/SYNC_ACTION:\s*(\[.*?\])/s);
    if (syncMatch) {
      try {
        const items = JSON.parse(syncMatch[1]);
        await this.vinoshipperClient.syncInventory(items);
      } catch (error) {
        console.error('Sync action failed:', error);
      }
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

module.exports = ClaudeAgent;
```

### 4. src/services/vinoshipper.js (API Client)

```javascript
const axios = require('axios');

class VinoshipperClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.vinoshipper.com/v1'; // Replace with actual endpoint
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getInventory() {
    try {
      const response = await this.client.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('Vinoshipper API error:', error);
      throw new Error('Failed to fetch inventory from Vinoshipper');
    }
  }

  async getProduct(sku) {
    try {
      const response = await this.client.get(`/products/${sku}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch product ${sku}`);
    }
  }

  async updateInventory(sku, quantity) {
    try {
      const response = await this.client.put(`/inventory/${sku}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update inventory for ${sku}`);
    }
  }

  async syncInventory(items) {
    const results = [];
    
    for (const item of items) {
      try {
        const result = await this.updateInventory(item.sku, item.quantity);
        results.push({ sku: item.sku, success: true, data: result });
      } catch (error) {
        results.push({ sku: item.sku, success: false, error: error.message });
      }
    }
    
    return results;
  }

  async searchProducts(query) {
    try {
      const response = await this.client.get('/products', {
        params: { search: query }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to search products');
    }
  }
}

module.exports = VinoshipperClient;
```

### 5. preload.js (Secure IPC Bridge)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveCredentials: (credentials) => ipcRenderer.invoke('save-credentials', credentials),
  sendMessage: (message) => ipcRenderer.invoke('send-message', message),
  getInventory: () => ipcRenderer.invoke('get-inventory'),
  syncInventory: (items) => ipcRenderer.invoke('sync-inventory', items)
});
```

## Building & Distribution

### Development
```bash
npm install
npm run dev
```

### Build for Distribution
```bash
# macOS
npm run build:mac      # Creates .dmg installer

# Windows
npm run build:win      # Creates .exe installer

# Linux
npm run build:linux    # Creates AppImage and .deb
```

### Output Files
- **macOS:** `dist/Vinoshipper Agent-1.0.0.dmg`
- **Windows:** `dist/Vinoshipper Agent Setup 1.0.0.exe`
- **Linux:** `dist/Vinoshipper-Agent-1.0.0.AppImage`

## Distribution Options

### 1. Direct Download (Simplest)
- Host installers on your website
- Users download and install manually
- No app store approval needed

### 2. Auto-Updates
Add `electron-updater`:
```javascript
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

### 3. App Stores (Optional)
- **Mac App Store:** Requires Apple Developer account ($99/year)
- **Microsoft Store:** Requires developer account
- **Snapcraft (Linux):** Free distribution

## Security Considerations

1. **API Key Storage:** Uses electron-store with encryption
2. **Context Isolation:** Enabled for security
3. **No Node Integration:** Renderer process isolated
4. **Code Signing:** Required for macOS/Windows distribution

## User Experience

### First Launch
1. User downloads installer
2. Runs setup wizard
3. Enters Vinoshipper API key
4. Enters Anthropic API key (or you provide it)
5. App connects and fetches initial inventory
6. Ready to use!

### Daily Use
1. Open app
2. Type natural language requests
3. AI agent handles Vinoshipper operations
4. View results in real-time

## Monetization Options

- **Free Version:** Limited requests per month
- **Pro Version:** Unlimited + advanced features
- **License Keys:** One-time purchase or subscription
- **Managed Service:** You provide the Claude API key

## Next Steps

Would you like me to:
1. **Create the complete React UI** for the desktop app?
2. **Add authentication/licensing system** for paid distribution?
3. **Build an auto-update mechanism** for seamless updates?
4. **Create installation/setup wizard** for first-time users?