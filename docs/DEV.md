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

For the full desktop app with Tauri:

```bash
npm run tauri:dev
```

---

## Running Modes

### Demo Mode (No API Keys Required)

To explore the application without any API keys:

1. Start the dev server: `npm run dev`
2. Open `http://localhost:5173` in your browser
3. On the Settings screen, click **"Try Demo Mode"**
4. The app will load with sample wine producer accounts

Demo mode is great for:
- Exploring the UI and features
- Testing the application flow
- Development and debugging

**Limitations in Demo Mode:**
- API calls fail gracefully (inventory will be empty or served from cache)
- Sync operations will not reach Vinoshipper

### Production Mode (Real API Keys)

To use the full application with real functionality:

1. Start the dev server: `npm run dev`
2. Open `http://localhost:5173` in your browser
3. On the Settings screen, click **"Manage Clients"** and add your Vinoshipper client accounts:
   - Client Name (e.g., "My Winery")
   - Vinoshipper API Key:Secret
   - Select fulfillment center
4. Click **"Save & Connect"**

**Required API Keys:**
| Key | Source | Purpose |
|-----|--------|---------|
| Vinoshipper API Key:Secret | Vinoshipper account | Inventory management |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (TypeScript compiler + Vite build) |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests with Vitest |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run tauri:dev` | Start desktop app with hot reload |
| `npm run tauri:build` | Build desktop app installers |

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
│   ├── SimpleActionBar.tsx
│   └── InventoryPanel.tsx
├── hooks/                  # Custom React hooks
│   ├── useClients.ts
│   ├── useInventory.ts
│   ├── useSyncLogs.ts
│   └── useConfiguration.ts
├── services/               # Business logic services
│   ├── keyringService.ts   # OS-native credential storage
│   ├── syncService.ts      # Inventory sync operations
│   └── inventoryCache.ts   # localStorage inventory cache
├── utils/                  # Utility functions
│   └── csvParser.ts
└── client/                 # API client
    └── VinoshipperClient.ts
```

## Configuration Storage

**Desktop (Tauri):** Credentials are stored in the OS-native keyring (Keychain on macOS, Credential Manager on Windows, Secret Service on Linux).

**Browser dev mode:** Falls back to localStorage.

**Inventory cache:** Stored in localStorage keyed by client ID (`inventory_cache_{clientId}`), with a `fetchedAt` timestamp. Served when the Vinoshipper API is unreachable.

To reset all configuration:
- Remove clients in the Settings UI, or
- Clear your browser's localStorage for the development URL
