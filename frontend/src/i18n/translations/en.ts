import type { TranslationKeys } from './pt-BR';

export const en: TranslationKeys = {
  // Common
  common: {
    connect: 'Connect',
    disconnect: 'Disconnect',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
    copy: 'Copy',
    copied: 'Copied!',
    open: 'Open',
    cancel: 'Cancel',
    save: 'Save',
    reset: 'Reset',
    clear: 'Clear',
    close: 'Close',
    loading: 'Loading...',
    yes: 'Yes',
    no: 'No',
    platform: 'platform',
    platforms: 'platform(s)',
  },

  // Header
  header: {
    title: 'Omni LIVE Tools',
    subtitle: 'Real-time chat and events',
    nav: {
      chatReader: 'Chat Reader',
      overlay: 'Overlay',
      livePoll: 'Live Poll',
    },
  },

  // Home Page
  home: {
    title: 'Omni LIVE Tools',
    description: 'A collection of tools for',
    using: 'using',
    and: 'and',
    for: 'for',
    cards: {
      chatReader: {
        title: 'Chat Reader',
        description: 'View chat messages, gifts and events in real-time',
      },
      overlay: {
        title: 'Overlay URL',
        description: 'Generate an overlay URL for OBS or streaming software',
      },
      poll: {
        title: 'Live Poll',
        description: 'Create interactive polls for your live audience',
      },
    },
    footer: {
      source: 'Source:',
    },
  },

  // Chat Page
  chat: {
    chats: 'Chats',
    gifts: 'Gifts',
    noMessages: 'No messages yet...',
    noGifts: 'No gifts yet...',
    connectedTo: 'Connected to',
    errorConnecting: 'Error connecting',
    reconnected: 'reconnected to',
  },

  // Room Stats
  roomStats: {
    viewers: 'Viewers',
    likes: 'Likes',
    diamonds: 'Diamonds',
    room: 'Room',
  },

  // Connection Form
  connection: {
    autoReconnect: 'Auto-reconnect',
    autoReconnectEnabled: 'Auto-reconnect enabled',
    tiktokUser: 'TikTok Username',
    twitchChannel: 'Twitch Channel',
    userPlaceholder: '@username',
    channelPlaceholder: 'channel',
    platformsLabel: 'Platforms',
  },

  // Overlay Page
  overlay: {
    title: 'Generate Overlay URL',
    description: 'Create a customized overlay URL for use with OBS, Streamlabs or other streaming software. The overlay will automatically connect and display events from the specified TikTok LIVE.',
    tiktokUser: 'TikTok Username',
    userPlaceholder: 'Enter @username',
    displayEvents: 'Display Events',
    events: {
      messages: 'Messages',
      gifts: 'Gifts',
      likes: 'Likes',
      joins: 'Joins',
      follows: 'Follows',
      shares: 'Shares',
    },
    appearance: 'Appearance',
    backgroundColor: 'Background Color',
    fontColor: 'Font Color',
    fontSize: 'Font Size',
    fontSizes: {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      extraLarge: 'Extra Large',
    },
    preview: 'Preview',
    previewMessage: 'Sample message',
    previewFollow: 'followed the host',
    yourOverlayUrl: 'Your Overlay URL',
    howToUse: 'How to use:',
    steps: {
      step1: 'Copy the URL above',
      step2: 'In OBS, add a new',
      browserSource: 'Browser Source',
      step3: 'Paste the URL and set dimensions (e.g., 400x600)',
      step4: 'Enable',
      turnOffWhenNotVisible: 'Shutdown source when not visible',
      step5: 'The overlay will automatically connect when the source is active',
    },
  },

  // Poll Page
  poll: {
    title: 'Multi-Platform Poll',
    description: 'Interactive voting system for TikTok and Twitch Lives',
    connection: 'Connection',
    configuration: 'Poll Configuration',
    results: 'Poll Results',
    voteLog: 'Vote Log',
    question: 'Poll Question',
    questionPlaceholder: 'Type your question here...',
    historyAvailable: 'history available',
    timer: 'Time (seconds)',
    showStatusBar: 'Show Status Bar',
    options: 'Options',
    optionsHint: 'check the options you want to include in the poll',
    optionPlaceholder: 'Option',
    minOptionsWarning: 'Select at least {count} options for the poll',
    startPoll: 'Start Poll',
    stopPoll: 'Stop Poll',
    resetPoll: 'Reset Poll',
    popout: 'Pop-out',
    popoutTitle: 'Open results in new window',
    // Poll status
    status: {
      inProgress: 'In Progress',
      finished: 'Finished',
      waiting: 'Waiting',
    },
    timeRemaining: 'Time Remaining',
    configuredTime: 'Configured Time',
    totalVotes: 'Total Votes',
    votes: 'votes',
    uniqueVoters: 'Unique Voters',
    // Vote log
    showIndividualVotes: 'Show individual votes',
    clearLog: 'Clear Log',
    noVotesYet: 'No votes yet...',
    votedFor: 'voted for',
    votesHidden: 'Votes hidden',
    // Countdown
    startingIn: 'Starting in',
    go: 'GO!',
    winner: 'WINNER!',
  },

  // Poll Results Page
  pollResults: {
    title: '📊 Poll Results',
    waitingForData: 'Waiting for poll data...',
    autoReconnectTitle: 'Auto-Reconnect...',
    reconnecting: 'Reconnecting...',
    autoReconnectActive: 'Auto-reconnect is enabled. Attempting to reconnect...',
    attemptingReconnect: 'Attempting to reconnect to TikTok.',
    autoReconnectEnabledMainPage: '✓ Auto-reconnect enabled on main page',
    disconnected: 'Disconnected from TikTok',
    connectionLost: 'TikTok connection was lost. Click the button below to reconnect.',
    reconnectButton: '🔄 Reconnect',
    autoReconnectTip: '💡 Tip: Enable auto-reconnect on the main page',
    voteNow: 'Vote now!',
    votesUnit: 'votes',
  },

  // Toast messages
  toast: {
    tiktokConnected: 'TikTok connected to @{username}',
    twitchConnected: 'Twitch connected to #{channel}',
    tiktokReconnected: 'TikTok reconnected to @{username}',
    twitchReconnected: 'Twitch reconnected to #{channel}',
    errorConnectingTikTok: 'Error connecting TikTok: {error}',
    errorConnectingTwitch: 'Error connecting Twitch: {error}',
  },

  // Language
  language: {
    label: 'Language',
    portuguese: 'Português',
    english: 'English',
  },
};
