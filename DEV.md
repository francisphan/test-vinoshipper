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
│   ├── claudeService.ts
│   ├── agentService.ts
│   └── syncService.ts
├── utils/                  # Utility functions
│   └── csvParser.ts
└── client/                 # API client
    └── VinoshipperClient.ts
```

## Configuration

The application requires the following configuration (set via the Settings UI):

1. **Claude API Key** - Your Anthropic API key for AI assistant functionality
2. **Client Accounts** - Vinoshipper client credentials (API Key:Secret format)

Configuration is stored in browser localStorage.
