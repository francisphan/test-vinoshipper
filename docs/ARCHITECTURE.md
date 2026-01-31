# Peyto - Architecture Overview

A cross-platform desktop application for managing wine inventory across multiple Vinoshipper producer accounts using natural language AI commands.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Tauri Desktop App                      │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  Frontend (React + TypeScript + Vite)        │ │
│  │  - Chat Interface                             │ │
│  │  - Inventory Management UI                    │ │
│  │  - Client Switcher                            │ │
│  │  - Settings & Configuration                   │ │
│  └───────────────────────────────────────────────┘ │
│                        ↕                            │
│  ┌───────────────────────────────────────────────┐ │
│  │  Backend (Rust)                               │ │
│  │  - Tauri Core                                 │ │
│  │  - IPC Bridge                                 │ │
│  │  - System Integration                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
           ↓                            ↓
    ┌──────────────┐           ┌───────────────┐
    │  Claude API  │           │  Vinoshipper  │
    │  (Anthropic) │           │      API      │
    └──────────────┘           └───────────────┘
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
- **Claude API** (Anthropic) - AI assistant for natural language processing
- **Vinoshipper API** - Wine inventory management platform

## Project Structure

```
peyto/
├── package.json                 # Node dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript configuration
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
│   │   ├── ChatInterface.tsx   # AI chat interface
│   │   └── InventoryPanel.tsx  # Inventory display & logs
│   ├── hooks/                  # Custom React hooks
│   │   ├── useClients.ts       # Client state management
│   │   ├── useInventory.ts     # Inventory state
│   │   ├── useMessages.ts      # Chat messages
│   │   ├── useSyncLogs.ts      # Sync activity logs
│   │   └── useConfiguration.ts # App configuration
│   ├── services/               # Business logic
│   │   ├── claudeService.ts    # Claude API integration
│   │   ├── mockClaudeService.ts # Demo mode simulation
│   │   ├── agentService.ts     # Agent action handling
│   │   └── syncService.ts      # Inventory sync operations
│   ├── utils/                  # Utility functions
│   │   └── csvParser.ts        # CSV parsing
│   └── client/                 # API clients
│       └── VinoshipperClient.ts # Vinoshipper API wrapper
├── src-tauri/                  # Tauri backend
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # Tauri configuration
│   ├── build.rs                # Build script
│   ├── src/
│   │   ├── main.rs             # Rust entry point
│   │   └── lib.rs              # Tauri app initialization
│   └── icons/                  # App icons (various sizes)
├── public/                     # Static assets
│   └── assets/
│       └── wine-icon.svg       # App logo
└── docs/                       # Documentation
    ├── ARCHITECTURE.md         # This file
    ├── DEV.md                  # Development guide
    └── CREDENTIALS.md          # API credentials guide
```

## Data Flow

### 1. User Input Flow
```
User types message
    ↓
ChatInterface component captures input
    ↓
claudeService.sendMessage()
    ↓
Claude API (streaming response)
    ↓
agentService.processAction() (if action detected)
    ↓
syncService / VinoshipperClient
    ↓
Vinoshipper API
    ↓
Update local state & UI
```

### 2. CSV Import Flow
```
User uploads CSV
    ↓
csvParser.parseInventoryCsv()
    ↓
User confirms via AI chat
    ↓
syncService.syncInventory()
    ↓
VinoshipperClient.batchUpdateInventory()
    ↓
API calls to Vinoshipper (with retry logic)
    ↓
Log results in activity panel
```

### 3. Multi-Client Management
```
User adds client in Settings
    ↓
Stored in localStorage
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

#### ChatInterface.tsx
- Message input and display
- Streaming Claude API responses
- File upload for CSV imports
- Message history

#### InventoryPanel.tsx
- Current inventory display
- Sync activity logs
- Real-time updates

#### ClientManager.tsx
- Add/remove Vinoshipper accounts
- Store API credentials (key:secret format)
- Fulfillment center selection

### Services

#### claudeService.ts
- Integrates with Anthropic Claude API
- Handles streaming responses
- Builds context-aware prompts with inventory data
- Parses agent actions from responses

#### VinoshipperClient.ts
- HTTP client for Vinoshipper API
- Basic authentication (key:secret)
- Retry logic with exponential backoff
- Error handling and normalization
- Methods: getInventory, updateInventory, createProduct, batchUpdateInventory

#### syncService.ts
- Orchestrates inventory synchronization
- Compares CSV with current Vinoshipper inventory
- Determines create vs update operations
- Batch processing with progress tracking

#### agentService.ts
- Parses Claude responses for action indicators
- Executes inventory sync operations
- Handles client switching
- Coordinates between AI and Vinoshipper API

### Data Storage

**Browser localStorage:**
- `claude_api_key` - Anthropic API key
- `clients` - Array of Vinoshipper client configurations
  ```json
  [
    {
      "id": "uuid",
      "name": "Client Name",
      "apiKey": "key:secret",
      "fulfillment": "Fulfillment Center"
    }
  ]
  ```

**No persistent backend database** - all data stored client-side or fetched from APIs on demand.

## Security Considerations

### Credential Storage
- API keys stored in browser localStorage (encrypted by browser)
- Never transmitted except to authorized APIs
- Keys can be cleared by user

### API Communication
- All API calls over HTTPS
- Vinoshipper: Basic auth with key:secret
- Claude: Bearer token authentication

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
- Mock data and simulated responses
- Full UI exploration
- Testing without costs

### Production Mode
- Requires Claude API key (Anthropic)
- Requires Vinoshipper API credentials per client
- Real AI processing
- Actual inventory management

## Future Enhancements

Potential improvements:
- **Auto-updates** - Tauri updater for seamless releases
- **Local database** - SQLite for offline inventory cache
- **Multi-user support** - Team collaboration features
- **Advanced analytics** - Inventory reports and insights
- **Webhook integration** - Real-time Vinoshipper updates
- **Mobile companion** - React Native app with shared backend
