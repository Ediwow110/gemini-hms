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
      
      // ESM Shims for es-toolkit/compat paths to prevent Vite/Rolldown prebundle crashes in dev
      'es-toolkit/compat/last': path.resolve(__dirname, './src/shims/es-toolkit-compat/last.ts'),
      'es-toolkit/compat/maxBy': path.resolve(__dirname, './src/shims/es-toolkit-compat/maxBy.ts'),
      'es-toolkit/compat/minBy': path.resolve(__dirname, './src/shims/es-toolkit-compat/minBy.ts'),
      'es-toolkit/compat/get': path.resolve(__dirname, './src/shims/es-toolkit-compat/get.ts'),
      'es-toolkit/compat/omit': path.resolve(__dirname, './src/shims/es-toolkit-compat/omit.ts'),
      'es-toolkit/compat/sumBy': path.resolve(__dirname, './src/shims/es-toolkit-compat/sumBy.ts'),
      'es-toolkit/compat/sortBy': path.resolve(__dirname, './src/shims/es-toolkit-compat/sortBy.ts'),
      'es-toolkit/compat/throttle': path.resolve(__dirname, './src/shims/es-toolkit-compat/throttle.ts'),
      'es-toolkit/compat/isPlainObject': path.resolve(__dirname, './src/shims/es-toolkit-compat/isPlainObject.ts'),
      'es-toolkit/compat/range': path.resolve(__dirname, './src/shims/es-toolkit-compat/range.ts'),
      'es-toolkit/compat/uniqBy': path.resolve(__dirname, './src/shims/es-toolkit-compat/uniqBy.ts'),
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
        rewrite: (path) => {
          // /api/v1/* → pass through (controllers keep api/v1 prefix: clinical,
          // catalog, dashboard, emr, encounters, insurance, auth, analytics, billing, etc.)
          if (path.startsWith('/api/v1/')) return path;
          // /api/marketplace/* → /marketplace/* (restored to original path)
          if (path.startsWith('/api/marketplace')) return path.replace('/api/', '/');
          // /api/metrics/* → /metrics/* (restored to original path)
          if (path.startsWith('/api/metrics')) return path.replace('/api/', '/');
          // /api/ledger/* → /ledger/* (restored to original path)
          if (path.startsWith('/api/ledger')) return path.replace('/api/', '/');
          // /api/queue/* → /api/v1/queue/* (align route with v1 convention)
          if (path.startsWith('/api/queue')) return path.replace('/api/', '/api/v1/');
          // Default: pass through
          return path;
        },
      },
      '/patient-portal': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
