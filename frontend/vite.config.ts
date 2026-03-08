/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

const rootPackageJson = JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(rootPackageJson.version),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8081',
        ws: true,
      },
    },
  },
  build: {
    outDir: '../dist-frontend',
    emptyOutDir: true,
    // Optimize chunk splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            // Separate React and React Router into their own chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Socket.io client in separate chunk
            if (id.includes('socket.io-client')) {
              return 'socket-vendor';
            }
            // Other vendors
            return 'vendor';
          }
          // Separate translation files into their own chunks
          if (id.includes('/i18n/translations/')) {
            const lang = id.match(/translations\/(.*?)\.ts/)?.[1];
            return lang ? `lang-${lang}` : 'translations';
          }
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/setup.ts'],
    },
  },
})
