export const ptBR = {
  // Common
  common: {
    connect: 'Conectar',
    disconnect: 'Desconectar',
    connecting: 'Conectando...',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    error: 'Erro',
    copy: 'Copiar',
    copied: 'Copiado!',
    open: 'Abrir',
    cancel: 'Cancelar',
    save: 'Salvar',
    reset: 'Reiniciar',
    clear: 'Limpar',
    close: 'Fechar',
    loading: 'Carregando...',
    yes: 'Sim',
    no: 'Não',
    platform: 'plataforma',
    platforms: 'plataforma(s)',
  },

  // Header
  header: {
    title: 'Ferramentas Omni LIVE',
    subtitle: 'Chat e eventos em tempo real',
    nav: {
      chatReader: 'Leitor de Chat',
      overlay: 'Overlay',
      livePoll: 'Enquete ao Vivo',
    },
  },

  // Home Page
  home: {
    title: 'Ferramentas Omni LIVE',
    description: 'Uma coleção de ferramentas para',
    using: 'utilizando',
    and: 'e',
    for: 'para',
    cards: {
      chatReader: {
        title: 'Leitor de Chat',
        description: 'Visualize mensagens do chat, presentes e eventos em tempo real',
      },
      overlay: {
        title: 'URL de Overlay',
        description: 'Gere uma URL de overlay para OBS ou software de streaming',
      },
      poll: {
        title: 'Enquete ao Vivo',
        description: 'Crie enquetes interativas para sua audiência ao vivo',
      },
    },
    footer: {
      source: 'Source:',
      madeWith: 'Feito com',
      by: 'por',
      viewSource: 'Ver Código',
    },
  },

  // Chat Page
  chat: {
    chats: 'Chats',
    gifts: 'Gifts',
    noMessages: 'Nenhuma mensagem ainda...',
    noGifts: 'Nenhum presente ainda...',
    connectedTo: 'Conectado a',
    errorConnecting: 'Erro ao conectar',
    reconnected: 'reconectado a',
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
    autoReconnect: 'Reconexão automática',
    autoReconnectEnabled: 'Reconexão automática ativada',
    tiktokUser: 'Usuário do TikTok',
    twitchChannel: 'Canal da Twitch',
    userPlaceholder: '@usuario',
    channelPlaceholder: 'canal',
    platformsLabel: 'Plataformas',
  },

  // Connection Modal
  connectionModal: {
    title: 'Conectar à Stream',
    description: 'Conecte-se a pelo menos uma plataforma para começar a usar as ferramentas',
    manageTitle: 'Gerenciar Conexões',
    manageDescription: 'Conecte-se ou desconecte-se das plataformas de streaming',
  },

  // Overlay Page
  overlay: {
    title: 'Gerar URL do Overlay',
    description: 'Crie uma URL de overlay personalizada para usar no OBS, Streamlabs ou outros softwares de streaming. O overlay conectará automaticamente e exibirá eventos do TikTok LIVE e/ou streams da Twitch.',
    tiktokUser: 'Usuário do TikTok',
    userPlaceholder: 'Digite o @usuário',
    displayEvents: 'Exibir Eventos',
    events: {
      messages: 'Mensagens',
      gifts: 'Presentes',
      likes: 'Curtidas',
      joins: 'Entradas',
      follows: 'Seguidores',
      shares: 'Compartilhamentos',
    },
    appearance: 'Aparência',
    backgroundColor: 'Cor de Fundo',
    fontColor: 'Cor da Fonte',
    fontSize: 'Tamanho da Fonte',
    fontSizes: {
      small: 'Pequeno',
      medium: 'Médio',
      large: 'Grande',
      extraLarge: 'Extra Grande',
    },
    preview: 'Pré-visualização',
    previewMessage: 'Mensagem de exemplo',
    previewFollow: 'seguiu o host',
    yourOverlayUrl: 'Sua URL do Overlay',
    howToUse: 'Como usar:',
    steps: {
      step1: 'Copie a URL acima',
      step2: 'No OBS, adicione uma nova',
      browserSource: 'Fonte de Navegador',
      step3: 'Cole a URL e defina as dimensões (ex: 400x600)',
      step4: 'Ative',
      turnOffWhenNotVisible: 'Desligar fonte quando não visível',
      step5: 'O overlay conectará automaticamente quando a fonte estiver ativa',
    },
  },

  // Poll Page
  poll: {
    title: 'Enquete Multi-Plataforma',
    description: 'Sistema de votação interativo para Lives do TikTok e Twitch',
    connection: 'Conexão',
    configuration: 'Configuração da Enquete',
    results: 'Resultados da Enquete',
    voteLog: 'Registro de Votos',
    question: 'Pergunta da Enquete',
    questionPlaceholder: 'Digite sua pergunta aqui...',
    historyAvailable: 'histórico disponível',
    timer: 'Tempo (segundos)',
    showStatusBar: 'Mostrar Barra de Status',
    options: 'Opções',
    optionsHint: 'marque as opções que deseja incluir na enquete',
    optionPlaceholder: 'Opção',
    minOptionsWarning: 'Selecione pelo menos {count} opções para a enquete',
    startPoll: 'Iniciar',
    stopPoll: 'Parar',
    resetPoll: 'Reiniciar',
    popout: 'Pop-out',
    popoutTitle: 'Abrir resultados em nova janela',
    // Poll status
    status: {
      inProgress: 'Em Andamento',
      finished: 'Finalizada',
      waiting: 'Aguardando',
    },
    timeRemaining: 'Tempo Restante',
    configuredTime: 'Tempo Configurado',
    totalVotes: 'Total de Votos',
    votes: 'votos',
    uniqueVoters: 'Votantes Únicos',
    // Vote log
    showIndividualVotes: 'Mostrar votos individuais',
    clearLog: 'Limpar Registro',
    noVotesYet: 'Nenhum voto ainda...',
    votedFor: 'votou em',
    votesHidden: 'Votos ocultos',
    // Countdown
    startingIn: 'Iniciando em',
    go: 'VAI!',
    winner: 'VENCEDOR!',
  },

  // Poll Results Page
  pollResults: {
    title: '📊 Resultados da Enquete',
    waitingForData: 'Aguardando dados da enquete...',
    autoReconnectTitle: 'Reconexão Automática...',
    reconnecting: 'Reconectando...',
    autoReconnectActive: 'A reconexão automática está ativada. Tentando reconectar...',
    attemptingReconnect: 'Tentando restabelecer conexão com o TikTok.',
    autoReconnectEnabledMainPage: '✓ Reconexão automática ativada na página principal',
    disconnected: 'Desconectado do TikTok',
    connectionLost: 'A conexão com o TikTok foi perdida. Clique no botão abaixo para reconectar.',
    reconnectButton: '🔄 Reconectar',
    autoReconnectTip: '💡 Dica: Ative a reconexão automática na página principal',
    voteNow: 'Vote agora!',
    votesUnit: 'votos',
    doubleClickToEdit: 'Duplo clique para editar',
  },

  // Toast messages
  toast: {
    tiktokConnected: 'TikTok conectado a @{username}',
    twitchConnected: 'Twitch conectado a #{channel}',
    tiktokReconnected: 'TikTok reconectado a @{username}',
    twitchReconnected: 'Twitch reconectado a #{channel}',
    errorConnectingTikTok: 'Erro ao conectar TikTok: {error}',
    errorConnectingTwitch: 'Erro ao conectar Twitch: {error}',
  },

  // Language
  language: {
    label: 'Idioma',
    portuguese: 'Português',
    english: 'English',
  },
};

// Define type without literal strings to allow different translations
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type TranslationKeys = DeepString<typeof ptBR>;
