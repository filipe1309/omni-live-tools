/**
 * Electron Preload Script
 *
 * Runs in a sandboxed renderer context before the web page loads.
 * Currently minimal — extend as needed to expose safe APIs via contextBridge.
 */

import { contextBridge } from 'electron';

// Expose a minimal API to the renderer for future use
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
