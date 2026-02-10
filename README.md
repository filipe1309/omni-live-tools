# Omni LIVE Chat Reader

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)

A multi-platform chat reader and poll application for **TikTok LIVE** and **Twitch** streams. Built with TypeScript using Clean Architecture principles. Available as a web server or desktop application (Electron).

![Omni LIVE Chat Reader (Demo)](docs/chatreaderjb.gif)

## 📑 Table of Contents

- [Features](#-features)
- [Supported Platforms](#-supported-platforms)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Configuration](#-configuration)
- [Building Desktop App](#-building-desktop-app-electron)
- [Web Pages](#-web-pages)
- [Poll Feature](#-poll-feature)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Credits](#-credits)

## ✨ Features

- 💬 **Real-time Chat Reading** - Display chat messages from TikTok LIVE and Twitch instantly
- 🌐 **Multi-Platform Support** - Connect to TikTok and Twitch simultaneously
- 🗳️ **Interactive Polls** - Create polls where viewers vote by typing numbers in chat (supports both platforms)
- 🎬 **OBS Overlay Support** - Dedicated overlay pages for streaming software
- 🖥️ **Cross-platform Desktop App** - Standalone Electron app for Windows and macOS
- 🏗️ **Clean Architecture** - Well-structured TypeScript codebase
- ⚡ **Rate Limiting** - Built-in protection against excessive requests
- 🔌 **Socket.IO Integration** - Real-time bidirectional communication

## 🌐 Supported Platforms

| Platform | Chat Reading | Polls | Library |
|----------|-------------|-------|---------|
| TikTok LIVE | ✅ | ✅ | [TikTok-Live-Connector](https://github.com/zerodytrash/TikTok-Live-Connector) |
| Twitch | ✅ | ✅ | [@twurple/chat](https://twurple.js.org/) |

## 🚀 Quick Start

```bash
make install    # Install all dependencies
make dev        # Start development servers
```

## 🛠️ Make Commands

Run `make help` to see all available commands.

## 💻 Development

### Prerequisites

- Node.js 18+
- npm

### Running in Development Mode

```bash
make install          # Install all dependencies
make dev              # Start both backend and frontend dev servers
```

Or run them separately:

```bash
make backend-dev-watch   # Backend with auto-reload (:8081)
make frontend-dev        # Frontend dev server (:3000)
```

### Testing

```bash
make test             # Run all tests
make test-watch       # Run tests in watch mode
make test-coverage    # Run tests with coverage report
```

### Linting

```bash
make lint             # Run linters on both projects
make backend-lint-fix # Fix backend lint issues
```

## ⚙️ Configuration

Configure the application using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8081` | Server port |
| `SESSIONID` | - | TikTok session ID (optional, for authenticated features) |
| `ENABLE_RATE_LIMIT` | `false` | Enable rate limiting |
| `MAX_CONNECTIONS` | `10` | Maximum concurrent TikTok connections |
| `MAX_REQUESTS_PER_MINUTE` | `5` | Rate limit threshold per client |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `STATIC_FILES_PATH` | `./public-react` | Path to static frontend files |

You can set these in a `.env` file in the backend directory or export them in your shell.

## 📦 Building Desktop App (Electron)

Build standalone desktop applications for Windows and macOS:

```bash
make electron-dist    # Build distributable installers
```

### Build Output

Installers are created in `./release/`:

| Platform | Format |
|----------|--------|
| macOS | `.dmg`, `.zip` |
| Windows | `.exe` (NSIS installer + Portable) |

### Development Mode

```bash
make electron-dev     # Build & launch Electron in dev mode
```

## 🌐 Web Pages

| Page | URL |
|------|-----|
| Main | `http://localhost:8081/` |
| OBS Overlay | `http://localhost:8081/obs.html` |
| Live Poll | `http://localhost:8081/poll.html` |

## 🗳️ Poll Feature

The poll feature allows viewers to vote by typing numbers in chat from **TikTok LIVE** and/or **Twitch**.

![Poll Feature Demo](docs/tcrjb_poll.gif)

### How It Works

1. Select which platforms to use (TikTok, Twitch, or both)
2. Connect to the live stream(s):
   - **TikTok**: Enter the streamer's @username
   - **Twitch**: Enter the channel name
3. Configure your poll with 2-10 options
4. Set the timer duration (10-300 seconds)
5. Start the poll
6. Viewers vote by typing numbers (1, 2, 3, etc.) in the chat
7. Results update in real-time with platform badges showing vote sources

### Features

- **Multi-platform voting** - Collect votes from TikTok and Twitch simultaneously
- **One vote per user per platform** - Each viewer can only vote once per poll per platform
- **Real-time results** - Vote counts and percentages update instantly
- **Platform badges** - Visual indicators show which platform each vote came from
- **Vote logging** - Optional detailed log of each vote with platform info
- **Timer display** - Countdown shows remaining time

## 📝 License

MIT License

## 🙏 Credits

- [tikTok-chat-reader-jb](https://github.com/filipe1309/tiktok-chat-reader-jb)
- [TikTok-Live-Connector](https://github.com/zerodytrash/TikTok-Live-Connector)
- [Twurple](https://twurple.js.org/) - Modern Twitch API library
- Original project by [zerodytrash](https://github.com/zerodytrash/TikTok-Chat-Reader)
