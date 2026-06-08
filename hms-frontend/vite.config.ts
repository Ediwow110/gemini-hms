import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'use-sync-external-store/with-selector.js': path.resolve(__dirname, './src/shims/use-sync-external-store-with-selector.ts'),
      'use-sync-external-store/shim/with-selector.js': path.resolve(__dirname, './src/shims/use-sync-external-store-with-selector.ts'),
      'use-sync-external-store/shim/with-selector': path.resolve(__dirname, './src/shims/use-sync-external-store-with-selector.ts'),
      'es-toolkit/compat/get': path.resolve(__dirname, './src/shims/es-toolkit-compat-get.ts'),
    },
  },
  // Prebundle CommonJS dependencies to avoid runtime ESM/CommonJS conversion crashes in browser
  // (e.g. recharts imports CommonJS modules like 'es-toolkit/compat/get' directly)
  optimizeDeps: {
    include: [
      'decimal.js-light',
      'es-toolkit',
      'eventemitter3',
      'recharts',
      'tiny-invariant',
      'react-is',
      'use-sync-external-store/with-selector.js',
      'use-sync-external-store/shim/with-selector.js',
      'use-sync-external-store/shim/with-selector',
    ],
    exclude: [],
  },
  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router')) {
              return 'vendor-react';
            }
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) {
              return 'vendor-recharts';
            }
            if (id.includes('/zod/')) {
              return 'vendor-zod';
            }
            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (id.includes('/date-fns/')) {
              return 'vendor-date';
            }
            if (id.includes('/react-hook-form/') || id.includes('/hookform/') || id.includes('/react-table/')) {
              return 'vendor-forms';
            }
            if (id.includes('/@tanstack/') || id.includes('/zustand/') || id.includes('/axios/')) {
              return 'vendor-data';
            }
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/patient-portal': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
