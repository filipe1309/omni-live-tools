# Omni LIVE Tools - React Frontend

Modern React + TypeScript + Tailwind CSS frontend for Omni LIVE Tools.

## Tech Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Fast build tool with HMR
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication

## Project Structure

```
frontend/
├── src/
│   ├── __tests__/           # Test files
│   │   ├── components/      # Component tests
│   │   ├── hooks/           # Hook tests
│   │   ├── utils/           # Utility tests
│   │   └── setup.ts         # Test setup and mocks
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components (ConnectionForm, RoomStats, etc.)
│   │   ├── chat/            # Chat-related components
│   │   ├── poll/            # Poll-related components (PollOptionCard, CountdownOverlay, etc.)
│   │   ├── layout/          # Layout components (Header, etc.)
│   │   └── ErrorBoundary.tsx # Error boundary wrapper
│   ├── hooks/               # Custom React hooks
│   │   ├── useTikTokConnection.ts  # Socket.IO connection management
│   │   ├── usePoll.ts              # Poll state management
│   │   ├── usePollDisplay.ts       # Poll display calculations
│   │   ├── usePollTimer.ts         # Countdown and timer logic
│   │   ├── usePollSync.ts          # Cross-tab sync via BroadcastChannel
│   │   ├── usePollKeyboardShortcuts.ts # Keyboard shortcuts
│   │   └── useLeaderElection.ts    # Leader election for multi-tab
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx     # Landing page
│   │   ├── ChatPage.tsx     # Chat reader
│   │   ├── PollPage.tsx     # Live poll
│   │   ├── PollResultsPage.tsx  # Poll results popup
│   │   ├── OverlayPage.tsx  # Overlay URL generator
│   │   └── ObsOverlayPage.tsx   # OBS overlay display
│   ├── types/               # TypeScript types
│   │   └── poll.ts          # Poll-related types
│   ├── constants/           # App constants
│   │   └── poll.ts          # Poll defaults, shortcuts, thresholds
│   ├── utils/               # Utility functions
│   │   └── errorHandling.ts # Result type, retry, logging utilities
│   ├── i18n/                # Internationalization
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles + Tailwind
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running on port 8081

### Installation

```bash
make frontend-install
```

### Development

```bash
make frontend-dev
```

Opens at http://localhost:3000 with hot module replacement.

The Vite dev server proxies `/socket.io` requests to `http://localhost:8081`.

### Build

```bash
make frontend-build
```

Outputs production build to `../dist-frontend/`.

### Testing

```bash
# Run tests once
make frontend-test

# Run tests in watch mode
make frontend-test-watch

# Run tests with coverage report
make frontend-test-coverage
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with navigation cards |
| `/chat` | Live chat reader with messages and gifts |
| `/poll` | Interactive poll for viewers |
| `/poll-results` | Popup window for poll results display |
| `/overlay` | Generate overlay URLs for OBS |
| `/obs?username=X` | Actual overlay for streaming software |

## Key Features

### Type Safety
All TikTok event types are defined in `src/types/tiktok.ts` and poll types in `src/types/poll.ts`.

### Custom Hooks
- `useTikTokConnection` - Manages Socket.IO connection, events, and room stats
- `usePoll` - Main poll state management (orchestrates other hooks)
- `usePollDisplay` - Calculations for votes, percentages, winners, celebration
- `usePollTimer` - Countdown (3-2-1-GO!) and timer decrement logic
- `usePollSync` - Cross-tab synchronization via BroadcastChannel API
- `usePollKeyboardShortcuts` - Configurable keyboard shortcuts (Ctrl+M, Escape, Ctrl+.)
- `useLeaderElection` - Leader election for multi-tab scenarios

### Shared Components
- `ErrorBoundary` - Catches React errors with fallback UI
- `PollOptionCard` - Displays poll option with votes and percentage bar
- `CountdownOverlay` - Shows countdown animation (3, 2, 1, GO!)
- `PollQuestion` - Question display with animated timer bar
- `PollControlButtons` - Start/Stop/Reset buttons with keyboard hints
- `DisconnectedModal` - Connection lost modal with reconnect option

### Error Handling
Result type pattern (`ok`/`err`) with utilities:
- `tryAsync` / `trySync` - Safe error wrapping
- `withTimeout` - Promise timeout wrapper
- `retry` - Retry with exponential backoff

### Tailwind Configuration
Custom colors and animations for TikTok branding:
- `tiktok-red`: #fe2c55
- `tiktok-cyan`: #25f4ee

### Component Architecture
Reusable, typed components with clear separation of concerns.

## Migration from Vanilla JS

This frontend replaces the original `public/` folder with:
- ✅ No jQuery dependency
- ✅ TypeScript for type safety
- ✅ Component-based architecture
- ✅ Modern CSS with Tailwind
- ✅ Fast development with Vite HMR
- ✅ Consistent with backend TypeScript stack
- ✅ Comprehensive test coverage with Vitest
