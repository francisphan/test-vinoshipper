# Vinoshipper Multi-Client Manager

<p align="center">
  <img src="public/assets/wine-icon.svg" alt="Wine Icon" width="120" height="120">
</p>

<p align="center">
  <strong>Simple, fast CSV-based inventory sync for wine producers on Vinoshipper</strong>
</p>

---

## Overview

Vinoshipper Multi-Client Manager is a lightweight desktop app that helps wine sales consultants sync inventory across multiple Vinoshipper accounts. Upload a CSV, click sync, and you're done.

## Features

- **Multi-Client Support** - Manage multiple wine producer accounts from a single interface
- **CSV Import** - Upload inventory files and sync to Vinoshipper with one click
- **Direct Actions** - Clear buttons for sync, compare, and checking all clients
- **Detailed Inventory Table** - View SKU, name, category, vintage, bottle size, price, quantity, and status
- **Inventory Caching** - Cached per-client inventory with "Last updated" timestamp; serves offline when the API is unreachable
- **Real-time Sync** - Update Vinoshipper inventory with CSV as the source of truth
- **Activity Logging** - Track all sync operations and changes
- **Secure Storage** - OS-native credential storage (Keychain/Credential Manager)
- **Demo Mode** - Try the app without Vinoshipper credentials

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build desktop app
npm run tauri:build
```

Then open `http://localhost:5173` and either:
- Add your Vinoshipper client credentials, or
- Click **"Try Demo Mode"** to explore with sample data

## How It Works

1. **Add Clients** - Configure Vinoshipper accounts in Settings
2. **Upload CSV** - Drag and drop or select your inventory CSV
3. **Review** - Compare CSV with current Vinoshipper inventory
4. **Sync** - Click "Sync All" to update Vinoshipper
5. **Monitor** - View activity logs to track changes

## Documentation

- **[Development Guide](docs/DEV.md)** - Setup and development instructions
- **[Architecture Overview](docs/ARCHITECTURE.md)** - Technical architecture and design
- **[API Credentials](docs/CREDENTIALS.md)** - How to get Vinoshipper API keys
- **[Testing Guide](docs/TESTING.md)** - Running and writing tests

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tauri** - Desktop app framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
src/
├── main.tsx                 # App entry point
├── index.ts                 # Main export
├── index.css                # Global styles
├── VinoshipperAgent.tsx     # Main application component
├── types.ts                 # TypeScript interfaces
├── constants.ts             # Configuration constants
├── components/
│   ├── Header.tsx           # App header with client selector
│   ├── Settings.tsx         # Configuration UI
│   ├── ClientManager.tsx    # Client add/remove UI
│   ├── SimpleActionBar.tsx  # Direct action buttons
│   └── InventoryPanel.tsx   # Inventory display & logs
├── hooks/
│   ├── useClients.ts        # Client state management
│   ├── useInventory.ts      # Inventory state management
│   └── useSyncLogs.ts       # Sync logs state
├── services/
│   ├── keyringService.ts    # Secure credential storage
│   ├── syncService.ts       # Inventory sync operations
│   └── inventoryCache.ts    # Per-client inventory cache
├── utils/
│   └── csvParser.ts         # CSV parsing utility
└── client/
    └── VinoshipperClient.ts # Vinoshipper API client
```

## Alternative: AI-Powered Version

Want natural language commands instead of buttons? Check out the **[Claude AI Chat branch](../../tree/feature/claude-ai-chat)** for an AI-powered interface:

```bash
git checkout feature/claude-ai-chat
```

The AI version includes:
- Natural language chat interface
- Commands like "sync all items" or "switch to Demo Winery"
- Powered by Claude API (requires API key, ~$5-20/month)

## Security

Credentials are stored securely using OS-native credential managers:
- **Windows**: Credential Manager
- **macOS**: Keychain
- **Linux**: Secret Service

No credentials are ever stored in plaintext or exposed to web contexts.

## Credits

Wine icon from [Reshot](https://www.reshot.com/) - Free for commercial use.
