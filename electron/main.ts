/**
 * Electron Main Process
 *
 * Starts the backend Express/Socket.IO server and opens
 * a BrowserWindow pointing to it.
 */

import { app, BrowserWindow, shell } from 'electron';
import path from 'path';

// The backend port — matches the default in backend/config/env.ts
const PORT = parseInt(process.env.PORT || '8081', 10);
const SERVER_URL = `http://localhost:${PORT}`;

let mainWindow: BrowserWindow | null = null;

/**
 * Boot the backend server by requiring the compiled main.js bundle.
 * The bundle starts Express + Socket.IO and begins listening.
 */
function startBackendServer (): void {
  // Point static files to the bundled public-react inside the app
  // __dirname is electron/dist-electron, so we go up 2 levels to reach root
  const staticPath = path.join(__dirname, '../../public-react');
  process.env.STATIC_FILES_PATH = staticPath;

  // Import the compiled backend entry point — this starts the server
  require('../../backend/dist/main');
}

/**
 * Create the main application window.
 */
function createWindow (): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Omni LIVE Tools',
    icon: path.join(__dirname, '../../public-react/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the backend server URL
  mainWindow.loadURL(SERVER_URL);

  // Handle new window requests (e.g., pop-out pages, external links)
  mainWindow.webContents.setWindowOpenHandler(({ url, features }: { url: string; features: string }) => {
    // Local URLs (same server) → open in a new Electron window
    if (url.startsWith(SERVER_URL) || url.startsWith('/')) {
      // Parse window features (width, height, left, top) from the window.open() call
      const parseFeature = (name: string): number | undefined => {
        const match = features.match(new RegExp(`${name}=(\\d+)`));
        return match ? parseInt(match[1], 10) : undefined;
      };

      return {
        action: 'allow' as const,
        overrideBrowserWindowOptions: {
          width: parseFeature('width') || 800,
          height: parseFeature('height') || 600,
          x: parseFeature('left'),
          y: parseFeature('top'),
          title: 'Omni LIVE Tools',
          icon: path.join(__dirname, '../../public-react/favicon.ico'),
          webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
          },
        },
      };
    }

    // External URLs → open in the default browser
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' as const };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Wait for the backend server to be ready before opening the window.
 */
async function waitForServer (url: string, retries = 30, delay = 500): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const http = await import('http');
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 400) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      return; // Server is ready
    } catch {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`Backend server did not start within ${retries * delay}ms`);
}

// ─── App Lifecycle ───────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Start the backend first
  startBackendServer();

  // Wait until the server responds
  await waitForServer(SERVER_URL);

  // Now open the window
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
