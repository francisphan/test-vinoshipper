# Peyto - Architecture Overview

A cross-platform desktop application for managing wine inventory across multiple Vinoshipper producer accounts via direct CSV-based sync.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Tauri Desktop App                      │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  Frontend (React + TypeScript + Vite)        │ │
│  │  - Inventory Table                            │ │
│  │  - CSV Upload & Sync Actions                  │ │
│  │  - Client Switcher                            │ │
│  │  - Settings & Configuration                   │ │
│  └───────────────────────────────────────────────┘ │
│                        ↕                            │
│  ┌───────────────────────────────────────────────┐ │
│  │  Backend (Rust)                               │ │
│  │  - Tauri Core                                 │ │
│  │  - IPC Bridge                                 │ │
│  │  - OS Keyring (Credential Storage)            │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
                         ↓
                ┌───────────────┐
                │  Vinoshipper  │
                │      API      │
                └───────────────┘
```

## Why Tauri?

**Tauri** is a modern alternative to Electron that:
- Uses native OS webview (no bundled Chromium)
- Results in ~10MB installers vs ~100MB+ for Electron
- Lower memory footprint (~50MB vs ~150MB+)
- Better security model with Rust backend
- Faster startup times
- Native system integration

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Tauri 2.x** - Desktop app framework
- **Rust** - Systems programming language for backend
- **Cargo** - Rust package manager

### External APIs
- **Vinoshipper API** - Wine inventory management platform

## Project Structure

```
peyto/
├── package.json                 # Node dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest test configuration
├── src/                        # Frontend source
│   ├── main.tsx                # App entry point
│   ├── index.css               # Global styles
│   ├── VinoshipperAgent.tsx    # Main app component
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Configuration constants
│   ├── components/             # React components
│   │   ├── Header.tsx          # App header with client selector
│   │   ├── Settings.tsx        # Configuration UI
│   │   ├── ClientManager.tsx   # Client management
│   │   ├── SimpleActionBar.tsx # Direct action buttons
│   │   └── InventoryPanel.tsx  # Inventory table & activity logs
│   ├── hooks/                  # Custom React hooks
│   │   ├── useClients.ts       # Client state management
│   │   ├── useInventory.ts     # Inventory state & caching
│   │   ├── useSyncLogs.ts      # Sync activity logs
│   │   └── useConfiguration.ts # App configuration
│   ├── services/               # Business logic
│   │   ├── keyringService.ts   # OS credential storage (Tauri bridge)
│   │   ├── syncService.ts      # Inventory sync operations
│   │   └── inventoryCache.ts   # localStorage inventory cache
│   ├── utils/                  # Utility functions
│   │   └── csvParser.ts        # CSV parsing
│   └── client/                 # API clients
│       └── VinoshipperClient.ts # Vinoshipper API wrapper
├── src-tauri/                  # Tauri backend
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # Tauri configuration
│   ├── build.rs                # Build script
│   └── src/
│       ├── main.rs             # Rust entry point
│       └── lib.rs              # Tauri commands (keyring)
├── public/                     # Static assets
│   └── assets/
│       └── wine-icon.svg       # App logo
└── docs/                       # Documentation
    ├── ARCHITECTURE.md         # This file
    ├── DEV.md                  # Development guide
    ├── CREDENTIALS.md          # API credentials guide
    ├── TESTING.md              # Testing documentation
    └── INSTALLATION.md         # Installation guide
```

## Data Flow

### 1. CSV Import & Sync Flow
```
User uploads CSV
    ↓
csvParser.parseCSV()
    ↓
User clicks "Compare" or "Sync All"
    ↓
syncService.performFullSync()
    ↓
VinoshipperClient (create/update per SKU)
    ↓
Vinoshipper API (with retry logic)
    ↓
Update local state & activity log
```

### 2. Inventory Fetch & Cache Flow
```
User selects client / app initializes
    ↓
useInventory.loadInventory(clientId, apiKey)
    ↓
VinoshipperClient.getInventory()
    ↓
On success → cache to localStorage, display in table
On failure → serve from cache (if available)
    ↓
InventoryPanel renders table with "Last updated" timestamp
```

### 3. Multi-Client Management
```
User adds client in Settings
    ↓
Stored in OS keyring (via Tauri IPC)
    ↓
Client selector in Header
    ↓
Switch active client
    ↓
All API calls use active client's credentials
```

## Key Components

### Frontend Components

#### VinoshipperAgent.tsx
Main application component that orchestrates:
- Configuration state management
- Demo mode vs production mode
- Client selection
- Integration of all child components

#### InventoryPanel.tsx
- Tabular inventory display with columns: SKU, Name, Category, Vintage, Size, Price, Qty, Status
- Color-coded quantity indicators (red/orange/green)
- CSV mismatch alerts
- "Last updated" relative timestamp
- Sync activity log

#### SimpleActionBar.tsx
- Upload CSV button
- Sync All to Vinoshipper
- Compare Inventory
- Check All Clients

#### ClientManager.tsx
- Add/remove Vinoshipper accounts
- Store API credentials (key:secret format)
- Fulfillment center selection

### Services

#### VinoshipperClient.ts
- HTTP client for Vinoshipper API
- Basic authentication (key:secret)
- Retry logic with exponential backoff
- Error handling and normalization
- Normalizes product fields: price, category, vintage, bottleSize, status
- Methods: getInventory, updateInventory, createProduct, batchUpdateInventory

#### syncService.ts
- Orchestrates inventory synchronization
- Compares CSV with current Vinoshipper inventory
- Determines create vs update operations
- Batch processing with progress tracking

#### inventoryCache.ts
- localStorage-based cache keyed by client ID
- Stores inventory items with a `fetchedAt` timestamp
- Serves cached data when the API is unreachable
- Functions: getInventoryCache, setInventoryCache, clearInventoryCache

#### keyringService.ts
- Bridges frontend to Tauri's OS keyring plugin
- Falls back to localStorage in browser dev mode
- One-time migration from localStorage to secure keyring

### Data Storage

**OS Keyring (Desktop):**
- `clients` - JSON array of Vinoshipper client configurations
- `storage_migrated` - Migration flag

**localStorage (Browser fallback & cache):**
- `inventory_cache_{clientId}` - Cached inventory per client with timestamp

**No persistent backend database** - all data stored client-side or fetched from APIs on demand.

## Security Considerations

### Credential Storage
- **Desktop (Tauri)**: OS-native keyring (Keychain / Credential Manager / Secret Service)
- **Browser/Dev fallback**: localStorage
- API keys never transmitted except to Vinoshipper
- Keys can be cleared by removing clients in Settings

### API Communication
- All API calls over HTTPS
- Vinoshipper: Basic auth with key:secret

### Tauri Security
- Content Security Policy configured
- Limited API surface to frontend
- Rust backend provides memory safety
- No eval() or dynamic code execution

## Build & Distribution

### Development
```bash
npm run dev          # Web version
npm run tauri:dev    # Desktop app with hot reload
```

### Production Build
```bash
npm run tauri:build  # Creates installers for current platform
```

### Platform-Specific Builds
GitHub Actions workflow builds for:
- **macOS** (Intel + Apple Silicon): `.dmg` installers
- **Windows**: `.msi` and `.exe` installers
- **Linux**: `.deb` and `.AppImage` packages

### Output Artifacts
Generated in `src-tauri/target/release/bundle/`:
- macOS: `dmg/` and `macos/`
- Windows: `msi/` and `nsis/`
- Linux: `deb/` and `appimage/`

## Operating Modes

### Demo Mode
- No API keys required
- Sample client accounts created
- API calls fail gracefully (empty inventory or cache)
- Full UI exploration

### Production Mode
- Requires Vinoshipper API credentials per client
- Real inventory management
- Cached data available when offline

## Future Enhancements

Potential improvements:
- **Auto-updates** - Tauri updater for seamless releases
- **Local database** - SQLite for richer offline support
- **Multi-user support** - Team collaboration features
- **Advanced analytics** - Inventory reports and insights
- **Webhook integration** - Real-time Vinoshipper updates
