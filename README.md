# Vinoshipper Multi-Client Manager

<p align="center">
  <img src="public/assets/wine-icon.svg" alt="Wine Icon" width="120" height="120">
</p>

<p align="center">
  <strong>AI-powered inventory management for wine producers on Vinoshipper</strong>
</p>

---

## Overview

Vinoshipper Multi-Client Manager is a React application that helps wine sales consultants manage inventory across multiple Vinoshipper client accounts. It features an AI assistant (powered by Claude) that can sync inventory from CSV files, switch between clients, and monitor stock levels.

## Features

- **Multi-Client Support** - Manage multiple wine producer accounts from a single interface
- **AI Assistant** - Natural language interface for inventory operations
- **CSV Import** - Upload inventory files and sync to Vinoshipper
- **Real-time Sync** - Update Vinoshipper inventory with CSV as the source of truth
- **Activity Logging** - Track all sync operations and changes
- **Demo Mode** - Try the app without API keys using simulated data

## Getting Started

See [DEV.md](DEV.md) for detailed setup and development instructions.

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open `http://localhost:5173` and either:
- Enter your Claude API key + Vinoshipper credentials, or
- Click **"Try Demo Mode"** to explore without API keys

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Claude API** - AI assistant

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
│   ├── ChatInterface.tsx    # AI chat interface
│   └── InventoryPanel.tsx   # Inventory display & logs
├── hooks/
│   ├── useClients.ts        # Client state management
│   ├── useInventory.ts      # Inventory state management
│   ├── useMessages.ts       # Chat messages state
│   ├── useSyncLogs.ts       # Sync logs state
│   └── useConfiguration.ts  # App configuration state
├── services/
│   ├── claudeService.ts     # Claude API integration
│   ├── mockClaudeService.ts # Demo mode responses
│   ├── agentService.ts      # Agent action handling
│   └── syncService.ts       # Inventory sync operations
├── utils/
│   └── csvParser.ts         # CSV parsing utility
└── client/
    └── VinoshipperClient.ts # Vinoshipper API client
```

## Credits

Wine icon from [Reshot](https://www.reshot.com/) - Free for commercial use.
