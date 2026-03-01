# AGENTS.md

> Context file for AI coding agents working on Omni LIVE Tools

## Project Overview

Omni LIVE Tools is a multi-platform chat reader and poll application for **TikTok LIVE**, **Twitch**, **YouTube Live**, and **Kick** streams. It can run as a web server or standalone desktop application (Electron).

### Main Features
- Real-time chat reading from TikTok, Twitch, YouTube, and Kick
- Message queue for organizing messages during streams
- Featured message overlay for OBS with pop-out window support
- Interactive polls where viewers vote by typing numbers
- Poll profiles for saving/loading configurations
- Multi-language support (PT-BR, EN, and ES)
- Smart connection modal (auto-closes when all selected platforms connect)

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| TypeScript | 5.x | Type safety |
| Express | 4.x | HTTP server |
| Socket.IO | 4.x | Real-time communication |
| tiktok-live-connector | 2.x | TikTok LIVE API |
| @twurple/chat | 8.x | Twitch chat API |
| youtubei.js | 16.x | YouTube Live API |
| @retconned/kick-js | 0.5.x | Kick chat API |
| Jest | 29.x | Testing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| TailwindCSS | 3.x | Styling |
| React Router DOM | 6.x | Routing |
| Socket.IO Client | 4.x | WebSocket client |
| Vitest | 4.x | Testing |

### Desktop
| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 33.x | Desktop framework |
| electron-builder | 25.x | Packaging |

## Architecture

The backend follows **Clean Architecture** with four layers:

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
│  (TikTok Wrapper, Twitch Wrapper, YouTube Wrapper, Kick Wrapper)│
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Rule
- Dependencies point inward: Presentation → Application → Domain ← Infrastructure
- Domain has NO dependencies on other layers
- Infrastructure implements Domain interfaces

## Folder Structure

```
omni-live-tools/
├── backend/                    # Node.js backend
│   ├── main.ts                 # Entry point
│   ├── application/services/   # Business logic services
│   ├── config/                 # Environment config
│   ├── domain/                 # Entities, enums, repository interfaces
│   ├── infrastructure/         # Platform wrappers (tiktok/, twitch/, youtube/, kick/)
│   ├── presentation/           # HTTP server, socket handlers
│   ├── shared/                 # Logger, utilities
│   └── __tests__/              # Unit & integration tests
│
├── frontend/                   # React frontend
│   └── src/
│       ├── components/         # React components (common/, chat/, poll/, layout/)
│       ├── pages/              # Page components
│       ├── hooks/              # Custom React hooks
│       ├── i18n/               # Internationalization
│       ├── types/              # TypeScript types
│       ├── constants/          # App constants
│       └── utils/              # Utility functions
│
├── electron/                   # Electron desktop app
│   ├── main.ts                 # Main process
│   └── preload.ts              # Preload script
│
├── dist-frontend/              # Built frontend (served by backend)
├── docs/                       # Documentation
└── release/                    # Built Electron installers
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.ts` | App bootstrap, starts HTTP/Socket server |
| `backend/presentation/handlers/SocketHandler.ts` | All socket event handlers |
| `backend/domain/enums/index.ts` | All event type definitions |
| `frontend/src/App.tsx` | Route definitions, providers setup |
| `frontend/src/hooks/useConnectionContext.tsx` | Global connection state |
| `frontend/src/hooks/usePollContext.tsx` | Global poll state (enables pop-out across pages) |
| `frontend/src/i18n/translations/` | All text content (en.ts, pt-BR.ts, es.ts) |
| `Makefile` | All development commands |
| `electron-builder.yml` | Desktop build configuration |

## Development Commands

```bash
make install          # Install all dependencies
make dev              # Start both backend (:8081) and frontend (:3000) dev servers
make build            # Build backend and frontend for production
make test             # Run all tests
make lint             # Run linters
make electron-dist    # Build desktop app
make clean            # Clean all build artifacts
```

Run `make help` for all available commands.

## Testing

### Backend (Jest)
```bash
cd backend
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Test location: `backend/__tests__/` (mirrors src structure)

### Frontend (Vitest)
```bash
cd frontend
npm test              # Watch mode
npm run test:run      # Run once
npm run test:coverage # Coverage report
```

## Code Conventions

### File Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ConnectionModal.tsx` |
| Hooks | camelCase with `use` prefix | `useTikTokConnection.ts` |
| Types/Entities | PascalCase | `ConnectionState.ts` |
| Utils | camelCase | `utils.ts` |
| Tests | `*.test.ts(x)` | `RateLimiterService.test.ts` |

### Import Order
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

### Frontend Path Alias
Use `@/` for imports from `frontend/src/`:
```typescript
import { useToast } from '@/hooks';
import { ChatMessage } from '@/types';
```

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `setUniqueId` | `(uniqueId, options)` | Connect to TikTok |
| `setTwitchChannel` | `(channel)` | Connect to Twitch |
| `setYouTubeVideo` | `(videoId)` | Connect to YouTube |
| `setKickChannel` | `(channel)` | Connect to Kick |
| `disconnectTikTok` | - | Disconnect TikTok |
| `disconnectTwitch` | - | Disconnect Twitch |
| `disconnectYouTube` | - | Disconnect YouTube |
| `disconnectKick` | - | Disconnect Kick |
| `setFeaturedMessage` | `ChatItem` | Send message to overlay |
| `join-platform-events` | - | Join shared connection room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `tiktokConnected` | `roomState` | TikTok connected |
| `twitchConnected` | `channelInfo` | Twitch connected |
| `youtubeConnected` | `videoInfo` | YouTube connected |
| `kickConnected` | `channelInfo` | Kick connected |
| `chat` | `ChatMessage` | Chat message received |
| `gift` | `GiftMessage` | Gift received (TikTok) |
| `streamEnd` | - | Stream ended |

## State Management

The frontend uses **React Context** for global state:

1. **ConnectionContext** - Connection status, `connect()`/`disconnect()`, `selectedPlatforms`
2. **PollContext** - Global poll state, vote processing, pop-out communication via BroadcastChannel
3. **ToastContext** - Toast notification queue
4. **LanguageContext** - Current language, translation function `t()`

## Environment Variables

Create `.env` in `backend/`:

```env
PORT=8081
SESSIONID=                        # TikTok session ID (optional)
ENABLE_RATE_LIMIT=false
MAX_CONNECTIONS=10
MAX_REQUESTS_PER_MINUTE=5
NODE_ENV=development
STATIC_FILES_PATH=./dist-frontend
```

## Constants

Poll constants are in `frontend/src/constants/poll.ts`:
- `STORAGE_KEYS` - localStorage key names
- `POLL_TIMER` - Timer settings (min: 10, max: 300, default: 30)
- `POLL_OPTIONS` - Options count (2-6, default: 2)
- `POLL_FONT_SIZE` - Results font size settings (min: 1, max: 3, step: 0.5, default: 1)
- `QUESTION_HISTORY` / `OPTION_HISTORY` - Autocomplete history (max: 20 items each)

## Common Patterns

### Adding a New Page
1. Create component in `frontend/src/pages/`
2. Add translations in `frontend/src/i18n/translations/`
3. Add route in `frontend/src/App.tsx`
4. Export from `frontend/src/pages/index.ts`

### Adding a New Socket Event
1. Define event type in `backend/domain/enums/`
2. Handle in `backend/presentation/handlers/SocketHandler.ts`
3. Listen in frontend hook

### Adding a New Component
1. Create in appropriate `frontend/src/components/` subfolder
2. Export from the folder's `index.ts`
3. Import using `@/components`

### Adding a New ESM Package (Electron)

**Note:** Asar packaging is disabled for this project (`asar: false` in electron-builder.yml) due to the complexity of ESM/CJS module resolution with packages like `kick-js` that have deep puppeteer dependency trees. This simplifies ESM package handling.

When adding ESM-only npm packages that will be used in Electron:

1. **Add to both package.json files:**
   - Root `package.json` (for Electron packaging)
   - `backend/package.json` (for development)

2. **Use dynamic import** for ESM packages in wrappers:
   ```typescript
   // Helper to bypass TypeScript's conversion of dynamic import() to require()
   const dynamicImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>;
   
   // Import the ESM module by package name
   const module = await dynamicImport<typeof import('@scope/package-name')>('@scope/package-name');
   ```

3. **Run `npm install` in root** to update `package-lock.json`

**Why asar is disabled:** Packages like `@retconned/kick-js` use puppeteer internally, which has a deep dependency tree (puppeteer-extra, puppeteer-extra-plugin-stealth, deepmerge, merge-deep, etc.). When asar is enabled, unpacked ESM modules can't resolve their CJS dependencies that remain in the asar archive. Disabling asar allows normal Node.js module resolution to work.

**Note on Kick and Chrome:** The `kick-js` package uses puppeteer. The wrapper configures it to use the system Chrome browser via `PUPPETEER_EXECUTABLE_PATH`. See `KickConnectionWrapper.ts` for implementation. This requires users to have Google Chrome installed.

## Troubleshooting

**Port in use:**
```bash
lsof -i :8081
kill -9 <PID>
```

**Module not found:**
```bash
make clean && make install
```

**TypeScript errors:**
```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## Documentation

- [README.md](README.md) - Project overview and quick start
- [docs/TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md) - In-depth technical docs
- [CHANGELOG.md](CHANGELOG.md) - Version history
