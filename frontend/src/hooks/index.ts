export { useTikTokConnection } from './useTikTokConnection';
export type { ConnectionStatus } from './useTikTokConnection';
export { useTwitchConnection } from './useTwitchConnection';
export type { TwitchConnectionStatus } from './useTwitchConnection';
export { useMultiPlatformConnection } from './useMultiPlatformConnection';
export { usePoll } from './usePoll';
export { usePollTimer } from './usePollTimer';
export type { TimerCallbacks } from './usePollTimer';
export { usePollSync, toSerializableState } from './usePollSync';
export { usePollDisplay } from './usePollDisplay';
export { usePollKeyboardShortcuts } from './usePollKeyboardShortcuts';
export { useLeaderElection } from './useLeaderElection';
export { useToast, ToastProvider } from './useToast';
export type { Toast, ToastType } from './useToast';

// Re-export poll types from @/types for backward compatibility
export type {
  SerializablePollState,
  SetupConfig,
  FullOptionsConfig,
  PollCommand,
  SyncCommandHandlers,
} from '@/types';
