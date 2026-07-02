import React from 'react';
import ReactDOM from 'react-dom/client';
// Sentry error monitoring (frontend)
// Initialise as early as possible so that even boot‑time errors are captured.
// The DSN is read from VITE_SENTRY_DSN; if not set, Sentry is a harmless no‑op.
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    // BrowserTracing is in @sentry/tracing (installed separately).
    // Uncomment the next line after installing: npm install @sentry/tracing --save
    // new Sentry.BrowserTracing(),
  ],
  // Adjust the sample rate as needed; 0.2 captures ~20% of transactions.
  tracesSampleRate: 0.2,
  environment: import.meta.env.MODE,
});
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
