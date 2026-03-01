# Omni LIVE Tools - Technical Documentation

> **Last Updated:** February 2026  
> **Purpose:** This document provides all the technical information needed to understand, maintain, and extend the Omni LIVE Tools application.

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Backend Deep Dive](#5-backend-deep-dive)
6. [Frontend Deep Dive](#6-frontend-deep-dive)
7. [Electron (Desktop App)](#7-electron-desktop-app)
8. [Communication Flow](#8-communication-flow)
9. [Configuration](#9-configuration)
10. [Testing](#10-testing)
11. [Build & Deployment](#11-build--deployment)
12. [How to Create New Features](#12-how-to-create-new-features)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Overview

Omni LIVE Tools is a multi-platform chat reader and poll application for **TikTok LIVE**, **Twitch**, **YouTube Live**, and **Kick** streams. It can run as:

- **Web Server Mode:** Backend serves the frontend, accessible via browser
- **Desktop App Mode:** Electron wraps everything into a standalone desktop application

### Main Features
- Real-time chat reading from TikTok, Twitch, YouTube, and Kick
- Message queue for organizing messages to read during streams
- Featured message overlay for displaying messages on OBS with pop-out window support
- Pop-out OBS windows for chat, gifts, and queue
- Search/filter to quickly find specific messages
- SuperChat highlighting with auto-queue for YouTube
- Member highlighting for channel subscribers across all platforms
- Gift tracking with streak detection and timeout handling
- Interactive polls where viewers vote by typing numbers (with flash animation on vote changes)
- Poll profiles for saving and loading poll configurations (with auto-save)
- Customizable results font size for polls (1x to 3x)
- Duplicate options validation with warning display
- Per-option autocomplete history (up to 20 items per option)
- OBS overlay support for streaming software
- Smart connection modal (auto-closes when all selected platforms connect)
- Stream end notifications and reconnection handling
- Multi-language support (PT-BR, EN, and ES)

---

## 2. Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| TypeScript | 5.x | Type-safe JavaScript |
| Express | 4.x | HTTP server framework |
| Socket.IO | 4.x | Real-time WebSocket communication |
| tiktok-live-connector | 2.x | TikTok LIVE API connection |
| @twurple/chat | 8.x | Twitch chat API |
| youtubei.js | 16.x | YouTube Live chat API (InnerTube) |
| @retconned/kick-js | 0.5.x | Kick chat API |
| Jest | 29.x | Unit testing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 6.x | Build tool & dev server |
| TailwindCSS | 3.x | Utility-first CSS framework |
| React Router DOM | 6.x | Client-side routing |
| Socket.IO Client | 4.x | WebSocket client |
| Vitest | 4.x | Unit testing |

### Desktop
| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 33.x | Desktop app framework |
| electron-builder | 25.x | Packaging & distribution |

---

## 3. Architecture

The project follows **Clean Architecture** principles in the backend, separating concerns into distinct layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION                            │
│  (HTTP Server, Socket Handlers, Express Routes)                 │
├─────────────────────────────────────────────────────────────────┤
│                         APPLICATION                             │
│  (Services: ConnectionService, RateLimiter, Statistics)         │
├─────────────────────────────────────────────────────────────────┤
│                           DOMAIN                                │
│  (Entities, Interfaces, Enums - Business Rules)                 │
├─────────────────────────────────────────────────────────────────┤
│                       INFRASTRUCTURE                            │
│  (TikTok Wrapper, Twitch Wrapper, Rate Limiter Repository)      │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Presentation** | `backend/presentation/` | HTTP endpoints, Socket.IO event handlers, user interface communication |
| **Application** | `backend/application/` | Business logic orchestration, use cases, services |
| **Domain** | `backend/domain/` | Core business entities, interfaces (contracts), enums |
| **Infrastructure** | `backend/infrastructure/` | External service integrations (TikTok, Twitch, Rate Limiter) |

### Dependency Rule
Dependencies always point **inward**:
- Presentation → Application → Domain ← Infrastructure
- Domain has NO dependencies on other layers
- Infrastructure implements Domain interfaces

---

## 4. Folder Structure

```
omni-live-tools/
├── backend/                    # Node.js backend server
│   ├── main.ts                 # Application entry point
│   ├── package.json            # Backend dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── jest.config.js          # Test configuration
│   ├── __tests__/              # Test files
│   │   ├── setup.ts            # Test setup/mocks
│   │   ├── unit/               # Unit tests (mirrors src structure)
│   │   └── integration/        # Integration tests
│   ├── application/            # APPLICATION LAYER
│   │   └── services/           # Business logic services
│   │       ├── ConnectionService.ts
│   │       ├── RateLimiterService.ts
│   │       └── StatisticsService.ts
│   ├── config/                 # Configuration management
│   │   └── env.ts              # Environment variables loader
│   ├── domain/                 # DOMAIN LAYER
│   │   ├── entities/           # Business entities (ConnectionState, TikTokUser, etc.)
│   │   ├── enums/              # Event types, status codes
│   │   └── repositories/       # Repository interfaces (contracts)
│   ├── infrastructure/         # INFRASTRUCTURE LAYER
│   │   ├── rate-limiter/       # In-memory rate limiter
│   │   ├── tiktok/             # TikTok connection wrappers
│   │   ├── twitch/             # Twitch connection wrapper
│   │   └── youtube/            # YouTube Live connection wrapper
│   ├── presentation/           # PRESENTATION LAYER
│   │   ├── handlers/           # Socket event handlers
│   │   └── server/             # HTTP/WebSocket server
│   ├── shared/                 # Shared utilities
│   │   ├── logger.ts           # Logging utilities
│   │   └── utils.ts            # Helper functions
│   └── types/                  # TypeScript type declarations
│
├── frontend/                   # React frontend
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.ts          # Vite build config
│   ├── tailwind.config.js      # TailwindCSS config
│   ├── tsconfig.json           # TypeScript config
│   ├── index.html              # HTML entry point
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Root component with routing
│       ├── index.css           # Global styles
│       ├── __tests__/          # Frontend tests
│       ├── components/         # React components
│       │   ├── common/         # Shared/reusable components
│       │   ├── chat/           # Chat-related components
│       │   ├── poll/           # Poll-related components
│       │   └── layout/         # Layout components (Header, etc.)
│       ├── pages/              # Page components (routes)
│       │   ├── HomePage.tsx    # Main landing page
│       │   ├── ChatPage.tsx    # Chat reader page
│       │   ├── PollPage.tsx    # Poll creation page
│       │   ├── OverlayPage.tsx # OBS overlay settings
│       │   └── ObsOverlayPage.tsx # Actual OBS overlay
│       ├── hooks/              # Custom React hooks
│       │   ├── useTikTokConnection.ts
│       │   ├── useTwitchConnection.ts
│       │   ├── useYouTubeConnection.ts
│       │   ├── useMultiPlatformConnection.ts
│       │   ├── usePoll.ts
│       │   └── useToast.tsx
│       ├── i18n/               # Internationalization
│       │   ├── LanguageContext.tsx
│       │   └── translations/   # Language files (en.ts, pt-BR.ts, es.ts)
│       ├── types/              # TypeScript types
│       ├── constants/          # App constants
│       └── utils/              # Utility functions
│
├── electron/                   # Electron desktop app
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # Preload script (security)
│   ├── tsconfig.json           # TypeScript config
│   └── build-resources/        # Icons and assets for builds
│
├── dist-frontend/              # Built frontend (served by backend)
├── docs/                       # Documentation
├── release/                    # Built Electron installers
├── scripts/                    # Helper scripts
│
├── package.json                # Root package (Electron deps)
├── electron-builder.yml        # Electron build configuration
├── Makefile                    # Development commands
└── README.md                   # Project readme
```

---

## 5. Backend Deep Dive

### Entry Point (`main.ts`)

The `Application` class bootstraps everything:

```typescript
// 1. Load configuration from environment variables
const envConfig = loadConfig();

// 2. Create infrastructure (rate limiter repository)
const rateLimiterRepository = new InMemoryRateLimiterRepository(config);

// 3. Create application services
const rateLimiterService = new RateLimiterService(rateLimiterRepository, ...);
const statisticsService = new StatisticsService();

// 4. Create and start the HTTP/Socket server
const server = new HttpSocketServer(serverConfig, rateLimiterService, statisticsService);
server.start();
```

### Domain Layer

**Entities** (`domain/entities/`):
- `ConnectionState` - Represents a connection's state (roomId, isConnected, etc.)
- `ConnectionOptions` - Options for connecting (sessionId, etc.)
- `TikTokUser`, `TwitchUser`, `YouTubeUser`, `KickUser` - User data structures

**Enums** (`domain/enums/`):
- `PlatformType` - TIKTOK, TWITCH, YOUTUBE, KICK
- `TikTokEventType` - CHAT, GIFT, LIKE, MEMBER, etc.
- `TwitchEventType` - CHAT, SUB, CHEER, etc.
- `YouTubeEventType` - CHAT, SUPERCHAT, MEMBER, STREAM_END
- `SocketEventType` - Events emitted to frontend

**Repository Interfaces** (`domain/repositories/`):
- `ITikTokConnectionRepository` - Contract for TikTok connections
- `IRateLimiterRepository` - Contract for rate limiting

### Infrastructure Layer

**TikTok** (`infrastructure/tiktok/`):
- `TikTokConnectionWrapper` - Wraps `tiktok-live-connector` library
- `TikFinityConnectionWrapper` - Fallback connection via TikFinity WebSocket

**Twitch** (`infrastructure/twitch/`):
- `TwitchConnectionWrapper` - Wraps `@twurple/chat` library

**YouTube** (`infrastructure/youtube/`):
- `YouTubeConnectionWrapper` - Wraps `youtubei.js` library for YouTube Live chat

**Kick** (`infrastructure/kick/`):
- `KickConnectionWrapper` - Wraps `@retconned/kick-js` library for Kick chat
- **Requires Google Chrome or Chromium** installed on the system (uses puppeteer internally)
- Connection timeout is 120 seconds (puppeteer can be slow on Windows)
- Uses "first-message" fallback if the 'ready' event doesn't fire
- Shows a warning message to users that connections may take up to 2 minutes

**Rate Limiter** (`infrastructure/rate-limiter/`):
- `InMemoryRateLimiterRepository` - In-memory rate limiting storage

### Presentation Layer

**HttpSocketServer** (`presentation/server/`):
- Express server for serving static files
- Socket.IO server for real-time communication
- Handles SPA routing (serves index.html for all routes)

**SocketHandler** (`presentation/handlers/`):
- Handles socket events (`setUniqueId`, `setTwitchChannel`, etc.)
- Manages individual client connections
- Forwards platform events to connected clients

### Key Events Flow

```
Client                    Server                      TikTok/Twitch
  │                          │                              │
  │──setUniqueId/channel────▶│                              │
  │                          │──────connect────────────────▶│
  │                          │◀─────connected──────────────│
  │◀─tiktokConnected/────────│                              │
  │  twitchConnected         │                              │
  │                          │◀─────chat/gift/etc.─────────│
  │◀─────chat/gift/etc.──────│                              │
```

---

## 6. Frontend Deep Dive

### Entry Point

```tsx
// main.tsx - Mounts the React app
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

// App.tsx - Sets up providers and routing
<ErrorBoundary>
  <LanguageProvider>
    <ToastProvider>
      <ConnectionProvider>
        <PollProvider>
          <BrowserRouter>
            <Routes>...</Routes>
          </BrowserRouter>
        </PollProvider>
      </ConnectionProvider>
    </ToastProvider>
  </LanguageProvider>
</ErrorBoundary>
```

### Pages

| Page | Route | Description |
|------|-------|-------------|
| `HomePage` | `/` | Landing page with feature cards |
| `ChatPage` | `/chat` | Real-time chat display with message queue |
| `PollPage` | `/poll` | Create and manage polls |
| `OverlayPage` | `/overlay` | OBS overlay configuration with platform toggles |
| `ObsOverlayPage` | `/obs` | OBS Browser Source page (supports shared connection mode) |
| `ObsFeaturedMessagePage` | `/obs-featured` | Featured message overlay for OBS |
| `ObsChatPage` | `/obs-chat` | OBS pop-out window for chat messages |
| `ObsGiftsPage` | `/obs-gifts` | OBS pop-out window for gifts |
| `ObsQueuePage` | `/obs-queue` | OBS pop-out window for message queue |
| `PollResultsPage` | `/poll-results` | Poll results popup window |

### Key Hooks

| Hook | Purpose |
|------|---------|
| `useTikTokConnection` | Manages TikTok socket connection and events |
| `useTwitchConnection` | Manages Twitch socket connection and events |
| `useYouTubeConnection` | Manages YouTube socket connection and events |
| `useKickConnection` | Manages Kick socket connection and events |
| `useMultiPlatformConnection` | Combines TikTok + Twitch + YouTube + Kick connections, platform events room |
| `useConnectionContext` | Global connection state (React Context) |
| `useFeaturedMessage` | Manages featured message overlay via Socket.IO |
| `usePoll` | Poll creation, voting, timer logic |
| `usePollContext` | Global poll state management (React Context) - enables poll pop-out to work across pages |
| `usePollProfile` | Manages poll profiles (save/load/auto-save) |
| `usePollSync` | Syncs poll state across browser tabs |
| `useToast` | Toast notification system |
| `useLanguage` | i18n translation hook |

### Component Organization

**Common Components** (`components/common/`):
- `ConnectionModal` - Modal for connecting to platforms with smart auto-close behavior:
  - Auto-closes only when ALL selected platforms are connected
  - Manual close (X button) available when at least one platform is connected
  - Updates selected platforms to only connected ones on manual dismiss
  - Supports both controlled (from header) and uncontrolled (initial) modes
- `ConnectionForm` - Form inputs for connection
- `SplashScreen` - Initial loading animation
- `ToastContainer` - Toast notifications
- `ErrorBoundary` - React error boundary
- `Username` - Platform-aware display name component that shows the user's nickname (falling back to handle) with clickable profile links (TikTok → `tiktok.com/@user`, Twitch → `twitch.tv/user`, YouTube → `youtube.com/channel/{channelId}`, Kick → `kick.com/{user}`)
- `AnimatedBorder` - Decorative animated border effect for poll results

**Layout Components** (`components/layout/`):
- `Header` - App header with navigation and controls
- `Footer` - App footer with version display and social links

**Feature Components**:
- `components/chat/` - Chat message display components (ChatContainer, ChatMessage, ChatQueueContainer, GiftContainer)
- `components/poll/` - Poll UI components:
  - `PollSetup` - Poll configuration form with question, options, timer, and profile management
  - `PollOptionCard` - Individual poll option with vote count, percentage, and flash animation
  - `PollResults` - Real-time poll results display
  - `PollQuestion` - Poll question display with inline editing
  - `PollStatusBar` - Poll timer and status indicator
  - `PollControlButtons` - Start/reset poll controls
  - `CountdownOverlay` - Countdown animation overlay
  - `VoteLog` - Optional detailed vote history log
  - `AutocompleteInput` - Autocomplete for recent poll options (shows up to 10 suggestions)
  - `SpotlightTrophyCelebration` - Winner celebration animation

### State Management

The app uses **React Context** for global state:

1. **ConnectionContext** (`hooks/useConnectionContext.tsx`):
   - Stores connection status for TikTok/Twitch/YouTube/Kick
   - Provides `connect()`, `disconnect()` functions
   - Tracks `isAnyConnected` and `areAllSelectedConnected` states
   - Manages `selectedPlatforms` array for multi-platform selection
   - Controls connection modal visibility (`showConnectionModal`, `connectionModalDismissed`)

2. **PollContext** (`hooks/usePollContext.tsx`):
   - Global poll state that persists across page navigation
   - Registers chat handlers at app level for vote processing
   - Broadcasts poll state/config to pop-out windows via BroadcastChannel
   - Enables poll pop-out to work even when navigating away from PollPage

3. **ToastContext** (`hooks/useToast.tsx`):
   - Toast notification queue
   - `showToast()` function

4. **LanguageContext** (`i18n/LanguageContext.tsx`):
   - Current language (PT-BR, EN, or ES)
   - Translation function `t`

### Styling

- **TailwindCSS** for utility classes
- Custom theme colors in `tailwind.config.js`:
  - `tiktok-red`, `tiktok-cyan` - Brand colors
- Global styles in `index.css`
- Animations defined via Tailwind and custom CSS

### Path Aliases

Vite is configured with `@` alias:
```typescript
// Import from anywhere using @
import { useToast } from '@/hooks';
import { ChatMessage } from '@/types';
```

### Constants

Centralized constants are defined in `frontend/src/constants/`:

**Poll Constants** (`constants/poll.ts`):
```typescript
// Storage keys (using platform-agnostic prefix)
export const STORAGE_KEYS = {
  SETUP_CONFIG: 'omni-poll-setupConfig',
  FULL_OPTIONS: 'omni-poll-fullOptions',
  AUTO_RECONNECT: 'omni-poll-autoReconnect',
  QUESTION_HISTORY: 'omni-poll-questionHistory',
  OPTION_HISTORY: 'omni-poll-optionHistory',
  PROFILES: 'omni-poll-profiles',
  SELECTED_PROFILE: 'omni-poll-selectedProfile',
} as const;

// Timer settings
export const POLL_TIMER = {
  DEFAULT: 30,
  MIN: 10,
  MAX: 300,
  STEP: 30,
};

// Font size settings for poll results
export const POLL_FONT_SIZE = {
  DEFAULT: 1.5,
  MIN: 1,
  MAX: 3.5,
  STEP: 0.5,
};

// Options settings
export const POLL_OPTIONS = {
  TOTAL: 6,
  MIN_SELECTED: 2,
};

// History settings (question and option autocomplete)
export const QUESTION_HISTORY = { MAX_ITEMS: 20 };
export const OPTION_HISTORY = { MAX_ITEMS: 20 };

// Profile settings
export const POLL_PROFILES = { MAX_PROFILES: 20 };
```

**Storage Utilities** (`utils/storage.ts`):
- `safeGetItem(key)` - Safely get from localStorage with error handling
- `safeSetItem(key, value)` - Safely set to localStorage with error handling
- `safeRemoveItem(key)` - Safely remove from localStorage
- `cleanupOldStorage()` - Clean up deprecated storage keys

---

## 7. Electron (Desktop App)

### How It Works

1. **Electron starts** → runs `electron/main.ts`
2. **Backend server starts** → requires `backend/dist/main.js`
3. **Waits for server** → polls `http://localhost:8081` until ready
4. **Opens BrowserWindow** → loads the backend URL

### Main Process (`electron/main.ts`)

```typescript
// Start backend server
require('../../backend/dist/main');

// Wait for server to be ready
await waitForServer('http://localhost:8081');

// Create browser window
const mainWindow = new BrowserWindow({
  width: 1280,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});

mainWindow.loadURL('http://localhost:8081');
```

### Build Configuration (`electron-builder.yml`)

- **macOS:** Builds `.zip` for x64 and arm64
- **Windows:** Builds `.exe` installer (NSIS) and portable
- **Linux:** Builds AppImage and .deb
- **Asar Packaging:** Disabled (`asar: false`) due to ESM/CJS module resolution issues with kick-js and its puppeteer dependencies

### Building

```bash
make electron-dist
# Outputs to ./release/
```

---

## 8. Communication Flow

### Socket.IO Events

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `setUniqueId` | `(uniqueId, options)` | Connect to TikTok |
| `setTwitchChannel` | `(channel)` | Connect to Twitch |
| `setYouTubeVideo` | `(videoId)` | Connect to YouTube Live |
| `setKickChannel` | `(channel)` | Connect to Kick |
| `disconnectTikTok` | - | Disconnect TikTok |
| `disconnectTwitch` | - | Disconnect Twitch |
| `disconnectYouTube` | - | Disconnect YouTube |
| `disconnectKick` | - | Disconnect Kick |
| `setFeaturedMessage` | `ChatItem` | Send message to overlay |
| `clearFeaturedMessage` | - | Clear overlay message |
| `join-platform-events` | - | Join platform events room (for shared connections) |
| `leave-platform-events` | - | Leave platform events room |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `tiktokConnected` | `roomState` | TikTok connection success |
| `twitchConnected` | `channelInfo` | Twitch connection success |
| `youtubeConnected` | `videoInfo` | YouTube connection success |
| `kickConnected` | `channelInfo` | Kick connection success |
| `tiktokDisconnected` | `reason` | TikTok disconnected |
| `twitchDisconnected` | `reason` | Twitch disconnected |
| `youtubeDisconnected` | `reason` | YouTube disconnected |
| `kickDisconnected` | `reason` | Kick disconnected |
| `chat` | `ChatMessage` | Chat message received |
| `featuredMessage` | `ChatItem` | Featured message to display |
| `featuredMessageCleared` | - | Clear featured message |
| `gift` | `GiftMessage` | Gift received (TikTok) |
| `like` | `LikeMessage` | Like received (TikTok) |
| `member` | `MemberMessage` | Member joined (TikTok) |
| `roomUser` | `RoomUserMessage` | Viewer count update |
| `streamEnd` | - | Stream ended |
| `statistic` | `{ connections }` | Server statistics |

### Shared Connection Mode (Platform Events Room)

The overlay can reuse platform connections from the main app instead of creating new connections. This is useful when:
- You want to avoid duplicate API connections
- The main app is already connected to TikTok/Twitch/YouTube/Kick
- Opening the overlay in an external browser (common with Electron)

**How it works:**
1. When a client connects to a platform (TikTok, Twitch, YouTube, or Kick), all events are broadcast to both:
   - The originating socket
   - All clients in the `platform-events` room
2. OBS overlays join the `platform-events` room using the `useAppConnection=1` URL parameter
3. The overlay receives live events from the main app's connections without making its own API calls

```
Main App                    Backend                      Overlay
    │                          │                            │
    │──setUniqueId────────────▶│                            │
    │◀─tiktokConnected─────────│                            │
    │                          │                            │
    │                          │◀──join-platform-events─────│
    │                          │                            │
    │ (receives chat event)    │                            │
    │◀────chat─────────────────│──────chat─────────────────▶│
```

### Unified Chat Format

Messages from all platforms are normalized:
```typescript
interface UnifiedChatMessage {
  platform: 'tiktok' | 'twitch' | 'youtube' | 'kick';
  uniqueId: string;
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  badges?: Badge[];
  timestamp: number;
  metadata?: {
    superchat?: { amount: string; currency: string };
    color?: string;
  };
}
```

### Chat Item Format

Used internally for the message queue and featured overlay:
```typescript
interface ChatItem {
  id: string;
  type: 'chat' | 'gift' | 'like' | 'member' | 'social';
  user: ChatMessage;
  content: string;
  color?: string;
  timestamp: Date;
  isTemporary?: boolean;
  platform?: 'tiktok' | 'twitch' | 'youtube' | 'kick';
  isSuperchat?: boolean;
}
```

---

## 9. Configuration

### Environment Variables

Create a `.env` file in `backend/`:

```env
# Server port
PORT=8081

# TikTok session ID (for authenticated features)
SESSIONID=your_session_id_here

# Rate limiting
ENABLE_RATE_LIMIT=false
MAX_CONNECTIONS=10
MAX_REQUESTS_PER_MINUTE=5

# Environment
NODE_ENV=development

# Static files path (usually auto-detected)
STATIC_FILES_PATH=./dist-frontend

# TikFinity fallback (optional)
TIKFINITY_WS_ENDPOINT=wss://tikfinity.zerody.one/tiktok/dapi
```

### TypeScript Configuration

- **Backend:** `backend/tsconfig.json` - Targets Node.js, uses CommonJS
- **Frontend:** `frontend/tsconfig.json` - Targets ES modules for Vite
- **Electron:** `electron/tsconfig.json` - Targets Node.js for Electron main process

---

## 10. Testing

### Backend Tests (Jest)

```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

**Test Structure:**
```
backend/__tests__/
├── setup.ts             # Global test setup
├── unit/
│   ├── application/     # Service tests
│   ├── domain/          # Entity/enum tests
│   ├── infrastructure/  # Wrapper tests
│   └── shared/          # Utility tests
└── integration/
    └── presentation/    # Server/handler tests
```

**Testing Pattern:**
```typescript
// Example: Testing a service
describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let mockRepository: jest.Mocked<IRateLimiterRepository>;

  beforeEach(() => {
    mockRepository = { recordRequest: jest.fn(), /* ... */ };
    service = new RateLimiterService(mockRepository, /* ... */);
  });

  it('should record requests', () => {
    service.recordRequest('127.0.0.1');
    expect(mockRepository.recordRequest).toHaveBeenCalledWith('127.0.0.1');
  });
});
```

### Frontend Tests (Vitest)

```bash
cd frontend
npm test                 # Run in watch mode
npm run test:run         # Run once
npm run test:coverage    # With coverage
```

**Uses:**
- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - Browser environment simulation

---

## 11. Build & Deployment

### Development

```bash
# Install all dependencies
make install

# Start development servers (backend :8081, frontend :3000)
make dev

# Or separately:
make backend-dev-watch   # Backend with auto-reload
make frontend-dev        # Frontend dev server
```

### Production Build

```bash
# Build both backend and frontend
make build

# Start production server
make start
```

### Desktop App Build

```bash
# Build Electron distributables
make electron-dist

# Outputs:
# - release/mac/OmniLIVETools.app (macOS)
# - release/OmniLIVETools Setup X.X.X.exe (Windows)
# - release/OmniLIVETools-X.X.X.AppImage (Linux)
```

### Makefile Commands

Run `make help` for all available commands. Key ones:

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Start both dev servers |
| `make build` | Build backend and frontend |
| `make test` | Run all tests |
| `make lint` | Run linters |
| `make electron-dist` | Build desktop app |

### Versioning & Changelog Scripts

The project includes helper scripts for semantic versioning based on Conventional Commits.

#### Version Update Script (`scripts/update-version.sh`)

Automatically bumps the version in `package.json` based on commit history:

```bash
# Basic usage (analyzes commits since last tag)
./scripts/update-version.sh

# Analyze commits from a specific date
./scripts/update-version.sh --since "2026-02-20"

# Preview changes without making them
./scripts/update-version.sh --dry-run

# Update version and changelog, then auto-commit and push
./scripts/update-version.sh --changelog --commit

# Skip confirmation prompt
./scripts/update-version.sh --yes
```

**Options:**
| Option | Description |
|--------|-------------|
| `--since DATE` | Analyze commits since DATE (e.g., '2026-02-16' or 'yesterday') |
| `--dry-run` | Show what would be done without making changes |
| `--no-tag` | Skip creating a git tag for the new version |
| `--changelog` | Update CHANGELOG.md after creating the tag |
| `--commit` | Auto-commit changes and push to remote (including tags) |
| `--yes, -y` | Skip confirmation prompt |

**Version Bump Rules:**
- **BREAKING CHANGE** or `feat!:` → Major version bump (X.0.0)
- `feat:` → Minor version bump (0.X.0)
- `fix:`, `refactor:`, `perf:`, etc. → Patch version bump (0.0.X)

#### Changelog Update Script (`scripts/update-changelog.sh`)

Generates changelog entries based on git tags and commits following [Keep a Changelog](https://keepachangelog.com) format:

```bash
# Update changelog for latest tag
./scripts/update-changelog.sh

# Preview changes without writing
./scripts/update-changelog.sh --dry-run

# Regenerate entire changelog from all tags
./scripts/update-changelog.sh --all
```

#### Makefile Shortcuts

| Command | Description |
|---------|-------------|
| `make bump-version` (bv) | Update version based on commits |
| `make bump-version-changelog` (bvc) | Update version and changelog |
| `make bump-version-changelog-commit` (bvcc) | Update version, changelog, commit and push |

---

## 12. How to Create New Features

### Adding a New Page

1. **Create the page component:**
   ```tsx
   // frontend/src/pages/MyNewPage.tsx
   import { useLanguage } from '@/i18n';

   export function MyNewPage() {
     const { t } = useLanguage();
     return (
       <div className="container mx-auto px-4 py-8">
         <h1>{t.myNewPage.title}</h1>
       </div>
     );
   }
   ```

2. **Add translations:**
   ```typescript
   // frontend/src/i18n/translations/en.ts
   export const en = {
     // ... existing translations
     myNewPage: {
       title: 'My New Page',
     },
   };
   ```

3. **Add route in `App.tsx`:**
   ```tsx
   <Route path="/my-new-page" element={<MyNewPage />} />
   ```

4. **Export from index:**
   ```typescript
   // frontend/src/pages/index.ts
   export * from './MyNewPage';
   ```

### Adding a New Socket Event

1. **Define the event type (backend):**
   ```typescript
   // backend/domain/enums/index.ts
   export enum SocketEventType {
     // ... existing events
     MY_NEW_EVENT = 'myNewEvent',
   }
   ```

2. **Handle in SocketHandler (backend):**
   ```typescript
   // backend/presentation/handlers/SocketHandler.ts
   this.socket.on('myNewEvent', this.handleMyNewEvent.bind(this));

   private handleMyNewEvent(data: unknown): void {
     // Process and emit response
     this.socket.emit('myNewEventResponse', processedData);
   }
   ```

3. **Listen in frontend hook:**
   ```typescript
   // frontend/src/hooks/useMyFeature.ts
   socket.on('myNewEventResponse', (data) => {
     // Handle response
   });

   // Emit event
   socket.emit('myNewEvent', payload);
   ```

### Adding a New Platform Integration

1. **Create domain types:**
   ```typescript
   // backend/domain/entities/NewPlatformUser.ts
   export interface NewPlatformUser {
     id: string;
     username: string;
     // ...
   }
   ```

2. **Define repository interface:**
   ```typescript
   // backend/domain/repositories/INewPlatformRepository.ts
   export interface INewPlatformRepository {
     connect(channel: string): Promise<ConnectionState>;
     disconnect(): void;
     on(event: string, handler: Function): void;
   }
   ```

3. **Implement infrastructure:**
   ```typescript
   // backend/infrastructure/new-platform/NewPlatformWrapper.ts
   export class NewPlatformWrapper implements INewPlatformRepository {
     // Implementation using the platform's SDK/API
   }
   ```

4. **Add socket handlers:**
   - Add connection handler in `SocketHandler.ts`
   - Add event forwarding

5. **Create frontend hook:**
   ```typescript
   // frontend/src/hooks/useNewPlatformConnection.ts
   export function useNewPlatformConnection() {
     // Socket connection logic
   }
   ```

### Adding a New Component

1. **Create the component:**
   ```tsx
   // frontend/src/components/common/MyComponent.tsx
   interface MyComponentProps {
     title: string;
     onClick?: () => void;
   }

   export function MyComponent({ title, onClick }: MyComponentProps) {
     return (
       <button
         className="px-4 py-2 bg-tiktok-red rounded hover:opacity-80"
         onClick={onClick}
       >
         {title}
       </button>
     );
   }
   ```

2. **Export from index:**
   ```typescript
   // frontend/src/components/common/index.ts
   export * from './MyComponent';

   // frontend/src/components/index.ts
   export * from './common';
   ```

3. **Use in pages/other components:**
   ```tsx
   import { MyComponent } from '@/components';
   ```

### Adding Tests

**Backend unit test:**
```typescript
// backend/__tests__/unit/application/MyService.test.ts
describe('MyService', () => {
  it('should do something', () => {
    // Arrange
    const service = new MyService();
    
    // Act
    const result = service.doSomething();
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

**Frontend component test:**
```typescript
// frontend/src/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components';

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<MyComponent title="Test" onClick={handleClick} />);
    
    await userEvent.click(screen.getByText('Test'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## 13. Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 8081
lsof -i :8081
# Kill it
kill -9 <PID>
```

**Module not found errors:**
```bash
# Reinstall dependencies
make clean
make install
```

**TypeScript compilation errors:**
```bash
# Check for type errors
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

**Socket connection issues:**
- Check if backend is running on expected port
- Verify CORS settings in `HttpSocketServer.ts`
- Check browser console for WebSocket errors

**TikTok connection rate limited:**
- The app includes TikFinity fallback
- Add a `SESSIONID` for authenticated access
- Wait before retrying connections

### Debug Tips

1. **Backend logging:** All console logs are visible in terminal
2. **Frontend debugging:** Use React DevTools and browser console
3. **Socket debugging:** Socket.IO has built-in debug mode:
   ```bash
   DEBUG=socket.io* npm run backend:dev
   ```
4. **Network inspection:** Use browser Network tab to see WebSocket frames

### Useful Commands

```bash
# Check Node version
node --version  # Should be 18+

# Check dependencies for vulnerabilities
npm audit

# Update dependencies
npm update

# Clean all build artifacts
make clean

# Run specific test file
cd backend && npm test -- --testPathPattern="MyService"

# Build only backend
make backend-build

# Build only frontend
make frontend-build
```

---

## Appendix: Quick Reference

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ConnectionModal.tsx` |
| Hooks | camelCase with `use` prefix | `useTikTokConnection.ts` |
| Types | PascalCase | `ConnectionState.ts` |
| Utils | camelCase | `utils.ts` |
| Tests | `*.test.ts` or `*.test.tsx` | `RateLimiterService.test.ts` |

### Import Order (Recommended)

```typescript
// 1. Node/React imports
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { io, Socket } from 'socket.io-client';

// 3. Internal imports (using @/ alias)
import { useToast } from '@/hooks';
import { ChatMessage } from '@/types';

// 4. Relative imports
import './styles.css';
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `backend/main.ts` | App bootstrap |
| `backend/presentation/handlers/SocketHandler.ts` | All socket events |
| `backend/domain/enums/index.ts` | All event types |
| `frontend/src/App.tsx` | Route definitions |
| `frontend/src/hooks/useConnectionContext.tsx` | Global connection state |
| `frontend/src/i18n/translations/` | All text content |
| `Makefile` | All available commands |
| `electron-builder.yml` | Desktop build config |

---

*This documentation is designed to help you understand and modify the codebase independently. Good luck with your customizations!*
