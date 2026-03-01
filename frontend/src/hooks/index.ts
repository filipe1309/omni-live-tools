export { useTikTokConnection } from './useTikTokConnection';
export type { ConnectionStatus } from './useTikTokConnection';
export { useTwitchConnection } from './useTwitchConnection';
export type { TwitchConnectionStatus } from './useTwitchConnection';
export { useYouTubeConnection } from './useYouTubeConnection';
export type { YouTubeConnectionStatus } from './useYouTubeConnection';
export { useMultiPlatformConnection } from './useMultiPlatformConnection';
export { ConnectionProvider, useConnectionContext } from './useConnectionContext';
export { PollProvider, usePollContext } from './usePollContext';
export { usePoll } from './usePoll';
export { usePollTimer } from './usePollTimer';
export type { TimerCallbacks } from './usePollTimer';
export { usePollSync, toSerializableState } from './usePollSync';
export { usePollDisplay } from './usePollDisplay';
export { usePollKeyboardShortcuts } from './usePollKeyboardShortcuts';
export { useNotificationSound } from './useNotificationSound';
export { useLeaderElection } from './useLeaderElection';
export { useBackgroundKeepAlive } from './useBackgroundKeepAlive';
export { useToast, ToastProvider } from './useToast';
export type { Toast, ToastType } from './useToast';
export { useFeaturedMessage } from './useFeaturedMessage';
export { useChatBroadcaster, useChatReceiver } from './useChatBroadcast';
export type { GiftData } from './useChatBroadcast';
export { useRecentPollOptions } from './useRecentPollOptions';

// Re-export poll types from @/types for backward compatibility
export type {
  SerializablePollState,
  SetupConfig,
  FullOptionsConfig,
  PollCommand,
  SyncCommandHandlers,
} from '@/types';
