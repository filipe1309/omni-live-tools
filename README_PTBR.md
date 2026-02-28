<div align="right">
  <a href="./README.md">English</a> | PT(BR)
</div>

<div align='center'>
  <img src="./docs/omni-full-logo.png" alt="alt text" width="100%">
  <h1>Omni LIVE Tools</h1>
  <h3>Um kit de ferramentas multiplataforma para streamers do <strong>TikTok LIVE</strong>, <strong>Twitch</strong>, <strong>YouTube Live</strong> e <strong>Kick</strong></h3>
   <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18%2B-green.svg" alt="Node.js"></a>
   <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript"></a>
   <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.IO-4.x-black.svg" alt="Socket.IO"></a>
   <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-25.x-purple.svg" alt="Electron"></a>
   <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18.x-blue.svg" alt="React"></a>
   <a href="https://jestjs.io/"><img src="https://img.shields.io/badge/Jest-29.x-red.svg" alt="Jest"></a>
</div>

## Sobre

Um aplicativo de leitura de chat e enquetes multiplataforma para lives do **TikTok LIVE**, **Twitch**, **YouTube Live** e **Kick**. Construído com TypeScript seguindo princípios de Clean Architecture. Disponível como servidor web ou aplicativo desktop (Electron).

![Omni LIVE Tools (Demo)](docs/omni-live-tools.gif)

## 📑 Índice

- [Funcionalidades](#-funcionalidades)
- [Plataformas Suportadas](#-plataformas-suportadas)
- [Suporte a Idiomas](#-suporte-a-idiomas)
- [Principais Funcionalidades](#-principais-funcionalidades)
   - [Enquetes](#-enquetes)
   - [Leitura de Chat em Tempo Real](#-leitura-de-chat-em-tempo-real)
- [Início Rápido](#-início-rápido)
- [Comandos Make](#-comandos-make)
- [Desenvolvimento](#-desenvolvimento)
- [Configuração](#-configuração)
- [Compilando o App Desktop (Electron)](#-compilando-o-app-desktop-electron)
- [Licença](#-licença)
- [Créditos](#-créditos)

## ✨ Funcionalidades

- 💬 **Leitura de Chat em Tempo Real** - Exibe mensagens do chat do TikTok LIVE, Twitch, YouTube Live e Kick instantaneamente
- 📋 **Fila de Mensagens** - Adicione mensagens a uma fila de leitura com um clique para fácil gerenciamento durante as lives
- ⭐ **Overlay de Mensagem em Destaque** - Envie mensagens para uma janela de overlay dedicada para OBS com suporte a pop-out
- 🌐 **Suporte Multiplataforma** - Conecte-se ao TikTok, Twitch, YouTube e Kick simultaneamente
- 🗳️ **Enquetes Interativas** - Crie enquetes onde os espectadores votam digitando números no chat (suporta todas as plataformas)
- 📊 **Perfis de Enquete** - Salve e carregue configurações de enquetes com salvamento automático
- 🎬 **Suporte a Overlay OBS** - Páginas de overlay dedicadas para software de streaming com janelas pop-out para chat, presentes e fila
- 🔗 **Modo de Conexão Compartilhada** - Overlays podem reutilizar as conexões das plataformas do app principal sem reconectar
- 🎁 **Rastreamento de Presentes** - Exibição de presentes em tempo real com rastreamento de sequências e tratamento de timeout
- 👁️ **Visibilidade Personalizável** - Ative/desative painéis de fila e presentes com configurações persistentes
- 🖥️ **App Desktop Multiplataforma** - App Electron independente para Windows e macOS
- 🌍 **Suporte Multi-idioma** - Disponível em Português (PT-BR) e Inglês (EN) com seletor de idioma no app
- 🏗️ **Clean Architecture** - Código TypeScript bem estruturado
- ⚡ **Rate Limiting** - Proteção integrada contra requisições excessivas
- 🔌 **Integração Socket.IO** - Comunicação bidirecional em tempo real
- 🔄 **Auto-Reconexão** - Reconexão automática com indicador visual quando a conexão é perdida
- � **Detecção de Fim de Stream** - Notificação automática quando uma live termina no TikTok ou YouTube
- �🔔 **Sons de Notificação** - Feedback de áudio para eventos de enquete
- ✨ **UI Aprimorada** - Efeitos de brilho neon, animações e telas de splash em vídeo
- 🧪 **Testes** - Testes unitários e de integração abrangentes com Jest e React Testing Library
- 🛠️ **Makefile** - Fluxo de trabalho de desenvolvimento simplificado com comandos Make
- 📦 **Electron Builder** - Empacotamento e distribuição fácil de aplicações desktop
- 📝 **Changelog** - Changelog detalhado com histórico de versões e notas de lançamento, disponível ([aqui](CHANGELOG.md))


## 🌐 Plataformas Suportadas

| Plataforma | Leitura de Chat | Enquetes | Biblioteca |
|------------|-----------------|----------|------------|
| TikTok LIVE | ✅ | ✅ | [TikTok-Live-Connector](https://github.com/zerodytrash/TikTok-Live-Connector) |
| Twitch | ✅ | ✅ | [@twurple/chat](https://twurple.js.org/) |
| YouTube Live | ✅ | ✅ | [youtubei.js](https://github.com/LuanRT/YouTube.js) |
| Kick | ✅ | ✅ | [@retconned/kick-js](https://github.com/retconned/kick-js) |

## 🌍 Suporte a Idiomas

O aplicativo suporta múltiplos idiomas com troca fácil:

| Idioma | Código | Status |
|--------|--------|--------|
| Português (Brasil) | PT-BR | ✅ Padrão |
| Inglês | EN | ✅ Disponível |

## ⭐ Principais Funcionalidades

### 🗳️ Enquetes

A funcionalidade de enquetes permite que espectadores votem digitando números no chat do **TikTok LIVE** e/ou **Twitch**.

![Demo de Enquetes](docs/omni-poll.gif)

#### Como Funciona

1. Selecione quais plataformas usar (TikTok, Twitch, YouTube, Kick ou qualquer combinação)
2. Conecte-se à(s) live(s):
   - **TikTok**: Digite o @username do streamer
   - **Twitch**: Digite o nome do canal
   - **YouTube**: Digite o ID do vídeo ou URL da live
3. Configure sua enquete com 2-6 opções
4. Defina a duração do timer (10-300 segundos)
5. Inicie a enquete
6. Os espectadores votam digitando números (1, 2, 3, etc.) no chat
7. Os resultados atualizam em tempo real com badges das plataformas mostrando a origem dos votos

#### Funcionalidades

- **Votação multiplataforma** - Colete votos do TikTok, Twitch, YouTube e Kick simultaneamente
- **Um voto por usuário por plataforma** - Cada espectador pode votar apenas uma vez por enquete por plataforma
- **Resultados em tempo real** - Contagem de votos e porcentagens atualizam instantaneamente com animação flash nas mudanças
- **Badges de plataforma** - Indicadores visuais mostram de qual plataforma cada voto veio
- **Perfis de enquete** - Salve e carregue configurações de enquetes com auto-save e suporte a localStorage
- **Opções de autocomplete** - Opções de enquetes recentes são sugeridas enquanto você digita (até 20 sugestões por opção)
- **Tamanho da fonte dos resultados** - Personalize o tamanho da fonte dos resultados da enquete para melhor visibilidade (1x a 3.5x)
- **Validação de duplicados** - Detecção automática e aviso para opções de enquete duplicadas
- **Edição inline** - Clique duplo para editar perguntas e opções da enquete diretamente
- **Opções configuráveis** - Suporte para 2-6 opções de enquete (padrão: 2)
- **Log de votos** - Log detalhado opcional de cada voto com info da plataforma
- **Display do timer** - Contagem regressiva mostra tempo restante com efeitos de animação glitch
- **Sons de notificação** - Feedback de áudio quando votos são recebidos
- **Auto-reconexão** - Reconecta automaticamente se a conexão for perdida durante uma enquete
- **Efeitos de brilho neon** - Feedback visual aprimorado com animações de shake

### 💬 Leitura de Chat em Tempo Real

O aplicativo lê mensagens do chat do TikTok LIVE, Twitch, YouTube Live e Kick em tempo real, exibindo-as em uma página web ou overlay OBS.

![Demo de Leitura de Chat](docs/omni-chat.gif)

#### Como Funciona

1. Conecte-se à(s) live(s):
   - **TikTok**: Digite o @username do streamer
   - **Twitch**: Digite o nome do canal
   - **YouTube**: Digite o ID do vídeo ou URL da live
2. Mensagens do chat das plataformas selecionadas aparecerão em tempo real na página principal e overlay OBS
3. Personalize as configurações de exibição para mostrar/ocultar usernames, badges, timestamps, etc.

#### Funcionalidades

- **Suporte multiplataforma** - Conecte-se ao TikTok, Twitch, YouTube e Kick simultaneamente
- **Fila de mensagens** - Passe o mouse sobre qualquer mensagem para adicioná-la a uma fila de leitura; gerencie facilmente quais mensagens ler
- **Overlay de mensagem em destaque** - Clique no ícone de broadcast para enviar uma mensagem para uma janela de overlay OBS dedicada
- **Janelas pop-out de overlay** - Janelas pop-out separadas para chat, presentes e fila para integração flexível com OBS
- **Auto-scroll inteligente** - O auto-scroll pausa quando você rola para cima para revisar mensagens, retoma quando você volta para baixo
- **Busca/filtro de mensagens** - Encontre rapidamente mensagens por conteúdo, username ou apelido
- **Destaque de SuperChat** - SuperChats do YouTube são destacados com fundo dourado e adicionados automaticamente à fila
- **Destaque de membros** - Membros do canal são destacados com fundo verde esmeralda e ícone de estrela
- **Rastreamento de presentes com sequências** - Exibição de presentes em tempo real com rastreamento de sequências e tratamento de timeout
- **Alternar visibilidade** - Mostrar/ocultar painéis de fila e presentes com configurações localStorage persistentes
- **Display personalizável** - Mostrar/ocultar usernames, badges, timestamps, etc.
- **Overlay OBS** - Página dedicada otimizada para software de streaming com integração aprimorada do Twitch
- **Rate limiting** - Proteção contra requisições excessivas
- **Suporte multi-idioma** - Exiba mensagens em Português (PT-BR) ou Inglês (EN)
- **Auto-reconexão** - Reconecta automaticamente se a conexão for perdida
- **Modal de conexão inteligente** - Fecha automaticamente quando todas as plataformas selecionadas conectam, com fechamento manual disponível após primeira conexão




## 🚀 Início Rápido

```bash
make install    # Instalar todas as dependências
make dev        # Iniciar servidores de desenvolvimento
```

## 🛠️ Comandos Make

Execute `make help` para ver todos os comandos disponíveis.

## 💻 Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm

### Executando em Modo de Desenvolvimento

```bash
make install          # Instalar todas as dependências
make dev              # Iniciar servidores de desenvolvimento backend e frontend
```

Ou execute-os separadamente:

```bash
make backend-dev-watch   # Backend com auto-reload (:8081)
make frontend-dev        # Servidor de desenvolvimento frontend (:3000)
```

### Testes

```bash
make test             # Executar todos os testes
make test-watch       # Executar testes em modo watch
make test-coverage    # Executar testes com relatório de cobertura
```

### Linting

```bash
make lint             # Executar linters em ambos os projetos
make backend-lint-fix # Corrigir problemas de lint do backend
```

## ⚙️ Configuração

Configure o aplicativo usando variáveis de ambiente:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `8081` | Porta do servidor |
| `SESSIONID` | - | ID de sessão do TikTok (opcional, para funcionalidades autenticadas) |
| `ENABLE_RATE_LIMIT` | `false` | Habilitar rate limiting |
| `MAX_CONNECTIONS` | `10` | Máximo de conexões TikTok simultâneas |
| `MAX_REQUESTS_PER_MINUTE` | `5` | Limite de requisições por cliente |
| `NODE_ENV` | `development` | Modo do ambiente (`development` ou `production`) |
| `STATIC_FILES_PATH` | `./dist-frontend` | Caminho para arquivos estáticos do frontend |

Você pode definir essas variáveis em um arquivo `.env` no diretório backend ou exportá-las no seu shell.

## 📦 Compilando o App Desktop (Electron)

Compile aplicações desktop independentes para Windows e macOS:

```bash
make electron-dist    # Compilar instaladores distribuíveis
```

### Saída da Compilação

Os instaladores são criados em `./release/`:

| Plataforma | Formato |
|------------|---------|
| macOS | `.dmg`, `.zip` |
| Windows | `.exe` (Instalador NSIS + Portátil) |

### Modo de Desenvolvimento

```bash
make electron-dev     # Compilar e iniciar Electron em modo dev
```

## 📝 Licença

Licença MIT

## 🙏 Créditos

- [tikTok-chat-reader-jb](https://github.com/filipe1309/tiktok-chat-reader-jb)
- Projeto original por [zerodytrash](https://github.com/zerodytrash/TikTok-Chat-Reader)

---

<p align="center">Feito com ❤️ por <a href="https://github.com/filipe1309">Filipe</a></p>
