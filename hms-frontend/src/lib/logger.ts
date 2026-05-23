/**
 * Production-safe logger utility.
 * Debug-level logs are no-ops in production.
 * Error-level logs are always preserved for observability.
 */

const isProduction = (): boolean => {
  return import.meta.env.MODE === 'production';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (..._args: unknown[]): void => {};

export const logger = {
  debug: isProduction() ? noop : (...args: unknown[]) => {
    console.log('[DEBUG]', ...args);
  },
  info: isProduction() ? noop : (...args: unknown[]) => {
    console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};
