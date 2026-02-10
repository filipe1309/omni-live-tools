# TikTok LIVE Tools - React Frontend

Modern React + TypeScript + Tailwind CSS frontend for TikTok LIVE Tools.

## Tech Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Fast build tool with HMR
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components (ConnectionForm, RoomStats, etc.)
│   │   ├── chat/            # Chat-related components
│   │   ├── poll/            # Poll-related components
│   │   └── layout/          # Layout components (Header, etc.)
│   ├── hooks/               # Custom React hooks
│   │   ├── useTikTokConnection.ts  # Socket.IO connection management
│   │   └── usePoll.ts       # Poll state management
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx     # Landing page
│   │   ├── ChatPage.tsx     # Chat reader
│   │   ├── PollPage.tsx     # Live poll
│   │   ├── OverlayPage.tsx  # Overlay URL generator
│   │   └── ObsOverlayPage.tsx  # OBS overlay display
│   ├── types/               # TypeScript types
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
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:3000 with hot module replacement.

The Vite dev server proxies `/socket.io` requests to `http://localhost:8081`.

### Build

```bash
npm run build
```

Outputs production build to `../public-react/`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with navigation cards |
| `/chat` | Live chat reader with messages and gifts |
| `/poll` | Interactive poll for viewers |
| `/overlay` | Generate overlay URLs for OBS |
| `/obs?username=X` | Actual overlay for streaming software |

## Key Features

### Type Safety
All TikTok event types are defined in `src/types/tiktok.ts` and can be shared with the backend.

### Custom Hooks
- `useTikTokConnection` - Manages Socket.IO connection, events, and room stats
- `usePoll` - Manages poll state, voting, and timer

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
