# Development Setup

## Prerequisites

- Node.js (v18 or higher recommended)
- npm

## Installation

Install project dependencies:

```bash
npm install
```

## Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

The server will start at `http://localhost:5173` (or the next available port).

---

## Running Modes

### Demo Mode (No API Keys Required)

To explore the application without any API keys:

1. Start the dev server: `npm run dev`
2. Open `http://localhost:5173` in your browser
3. On the Settings screen, click **"Try Demo Mode (No API Keys Required)"**
4. The app will load with sample wine producer accounts and simulated AI responses

Demo mode is great for:
- Exploring the UI and features
- Testing the application flow
- Development and debugging without API costs

**Limitations in Demo Mode:**
- AI responses are simulated (not real Claude API calls)
- Inventory data is mock data
- Sync operations are simulated

### Production Mode (Real API Keys)

To use the full application with real functionality:

1. Start the dev server: `npm run dev`
2. Open `http://localhost:5173` in your browser
3. On the Settings screen, enter your **Claude API Key** (from [Anthropic Console](https://console.anthropic.com/))
4. Click **"Manage Clients"** and add your Vinoshipper client accounts:
   - Client Name (e.g., "My Winery")
   - Vinoshipper API Key:Secret
   - Select fulfillment center
5. Click **"Save & Connect"**

**Required API Keys:**
| Key | Source | Purpose |
|-----|--------|---------|
| Claude API Key | [console.anthropic.com](https://console.anthropic.com/) | AI assistant functionality |
| Vinoshipper API Key:Secret | Vinoshipper account | Inventory management |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (runs TypeScript compiler + Vite build) |
| `npm run preview` | Preview production build locally |

## Project Structure

```
src/
├── VinoshipperAgent.tsx    # Main application component
├── index.ts                # Main export
├── types.ts                # TypeScript interfaces
├── constants.ts            # Configuration constants
├── components/             # React components
│   ├── Header.tsx
│   ├── Settings.tsx
│   ├── ClientManager.tsx
│   ├── ChatInterface.tsx
│   └── InventoryPanel.tsx
├── hooks/                  # Custom React hooks
│   ├── useClients.ts
│   ├── useInventory.ts
│   ├── useMessages.ts
│   ├── useSyncLogs.ts
│   └── useConfiguration.ts
├── services/               # Business logic services
│   ├── claudeService.ts    # Real Claude API integration
│   ├── mockClaudeService.ts # Demo mode simulated responses
│   ├── agentService.ts
│   └── syncService.ts
├── utils/                  # Utility functions
│   └── csvParser.ts
└── client/                 # API client
    └── VinoshipperClient.ts
```

## Configuration Storage

Configuration is stored in browser localStorage:
- `claude_api_key` - Your Anthropic API key
- `clients` - Array of Vinoshipper client configurations

To reset all configuration, clear your browser's localStorage for the development URL.
