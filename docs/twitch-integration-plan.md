# Plan: Multi-Platform Chat Support (TikTok + Twitch)

## Overview
The goal is to allow users to connect to TikTok **and/or** Twitch simultaneously, with polls reading from both chat sources.

---

## Phase 1: Backend Infrastructure Layer

### 1.1 Create Twitch Connection Wrapper
**File:** `backend/infrastructure/twitch/TwitchConnectionWrapper.ts`

- Use the `@twurple/chat` library (actively maintained, part of the Twurple ecosystem)
  - **Note:** `tmi.js` was considered but has been stagnant since 2023 awaiting a v2 rewrite that never materialized
  - Twurple supports both anonymous connections and full OAuth authentication
  - Well-documented: https://twurple.js.org/
- Implement `IStreamConnectionRepository` interface (renamed from `ITikTokConnectionRepository`)
- Handle Twitch authentication:
  - **Anonymous mode**: Read-only chat access (sufficient for polls)
  - **OAuth mode**: Optional, for future features requiring authenticated actions
- Map Twitch events to normalized chat events

### 1.2 Update Domain Layer

**New/Updated Files:**
- `backend/domain/repositories/IStreamConnectionRepository.ts` - Generic interface for any stream platform
- `backend/domain/enums/index.ts` - Add `TwitchEventType` and `PlatformType` enums
- `backend/domain/entities/TwitchUser.ts` - Twitch user entity
- `backend/domain/entities/ChatMessage.ts` - Unified chat message type

```typescript
// New enum
export enum PlatformType {
  TIKTOK = 'tiktok',
  TWITCH = 'twitch',
}
```

### 1.3 Create Infrastructure Index
**File:** `backend/infrastructure/twitch/index.ts`

---

## Phase 2: Backend Presentation Layer

### 2.1 Update Socket Handler
**File:** `backend/presentation/handlers/SocketHandler.ts`

Add new socket events:
```typescript
// New events
SocketEventType.SET_TWITCH_CHANNEL = 'setTwitchChannel'
SocketEventType.TWITCH_CONNECTED = 'twitchConnected'
SocketEventType.TWITCH_DISCONNECTED = 'twitchDisconnected'
```

- Handle `setTwitchChannel` event to connect to Twitch
- Support simultaneous TikTok + Twitch connections per socket
- Forward events with platform identifier

### 2.2 Normalize Chat Events
Messages from both platforms should include:
```typescript
interface UnifiedChatMessage {
  platform: 'tiktok' | 'twitch';
  userId: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  profilePictureUrl?: string;
  badges?: Badge[];
  // Platform-specific metadata
  metadata?: Record<string, unknown>;
}
```

---

## Phase 3: Frontend Types & Hooks

### 3.1 Update Types
**File:** `frontend/src/types/index.ts`

- Add `PlatformType` enum
- Add `UnifiedChatMessage` type
- Add Twitch-specific types

### 3.2 Create Twitch Hook
**File:** `frontend/src/hooks/useTwitchConnection.ts`

- Mirror `useTikTokConnection` structure
- Handle Twitch-specific connection logic

### 3.3 Create Unified Connection Hook
**File:** `frontend/src/hooks/useMultiPlatformConnection.ts`

```typescript
interface MultiPlatformConnectionReturn {
  tiktok: TikTokConnectionState;
  twitch: TwitchConnectionState;
  
  connectTikTok: (username: string) => Promise<void>;
  disconnectTikTok: () => void;
  
  connectTwitch: (channel: string) => Promise<void>;
  disconnectTwitch: () => void;
  
  onChat: (callback: (msg: UnifiedChatMessage) => void) => void;
}
```

---

## Phase 4: Frontend Components

### 4.1 Update ConnectionForm
**File:** `frontend/src/components/common/ConnectionForm.tsx`

- Add platform selector (tabs or toggle)
- Support TikTok username OR Twitch channel input
- Option to enable both simultaneously
- Show connection status per platform

```tsx
// New props
interface MultiConnectionFormProps {
  tiktokConfig: { onConnect, onDisconnect, status };
  twitchConfig: { onConnect, onDisconnect, status };
  mode: 'single' | 'dual'; // Which platforms to show
}
```

### 4.2 Create Platform Selector Component
**File:** `frontend/src/components/common/PlatformSelector.tsx`

- Toggle buttons for TikTok / Twitch / Both
- Visual indicators for each platform's connection status

### 4.3 Update PollPage
**File:** `frontend/src/pages/PollPage.tsx`

- Replace single `useTikTokConnection` with `useMultiPlatformConnection`
- Update `handleChat` to process unified messages
- Store both usernames (TikTok + Twitch channel)
- Update auto-reconnect logic for both platforms

---

## Phase 5: Visual Indicators

### 5.1 Update Vote Log
Show platform badges next to votes:
- 🎵 TikTok
- 💜 Twitch

### 5.2 Update Chat Messages (if applicable)
Add platform indicator to distinguish message sources.

---

## Implementation Order

| # | Task | Estimated Effort |
|---|------|-----------------|
| 1 | Add `@twurple/auth` and `@twurple/chat` dependencies to backend | Small |
| 2 | Create domain types (enums, entities) | Small |
| 3 | Create `TwitchConnectionWrapper` | Medium |
| 4 | Update `SocketHandler` for Twitch | Medium |
| 5 | Create frontend Twitch types | Small |
| 6 | Create `useTwitchConnection` hook | Medium |
| 7 | Create `useMultiPlatformConnection` hook | Medium |
| 8 | Create `PlatformSelector` component | Small |
| 9 | Update `ConnectionForm` | Medium |
| 10 | Update `PollPage` | Medium |
| 11 | Add platform badges to UI | Small |
| 12 | Update auto-reconnect logic | Small |
| 13 | Testing & refinement | Medium |

---

## Dependencies to Add

**Backend (`backend/package.json`):**
```json
{
  "dependencies": {
    "@twurple/auth": "^7.x",
    "@twurple/chat": "^7.x"
  }
}
```

> **Why @twurple/chat instead of tmi.js?**
> - `tmi.js` has been awaiting a v2 rewrite since June 2023 due to Twitch removing IRC chat commands
> - `@twurple/chat` is actively maintained, has TypeScript support, and supports modern Twitch APIs
> - Twurple ecosystem provides additional packages for future features (EventSub, API calls, etc.)
```

---

## File Structure After Changes

```
backend/
  domain/
    enums/
      index.ts              # Add PlatformType, TwitchEventType
    entities/
      TwitchUser.ts         # NEW
      UnifiedChatMessage.ts # NEW
    repositories/
      IStreamConnectionRepository.ts  # RENAMED from ITikTokConnectionRepository
  infrastructure/
    twitch/                 # NEW FOLDER
      index.ts
      TwitchConnectionWrapper.ts
  presentation/
    handlers/
      SocketHandler.ts      # UPDATED

frontend/
  src/
    types/
      twitch.ts             # NEW
      index.ts              # UPDATED
    hooks/
      useTwitchConnection.ts      # NEW
      useMultiPlatformConnection.ts # NEW
    components/
      common/
        PlatformSelector.tsx      # NEW
        ConnectionForm.tsx        # UPDATED
    pages/
      PollPage.tsx          # UPDATED
```
