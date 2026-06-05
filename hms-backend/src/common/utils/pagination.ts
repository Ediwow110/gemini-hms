/**
 * Shared pagination utility for PERF-H-1.
 *
 * Provides safe clamping functions for `take`/`limit` and `page`/`skip`
 * to prevent unbounded list queries from becoming DoS or memory-exhaustion
 * vectors.
 *
 * Usage:
 *   const take = clampTake(query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
 *   const skip = (clampPage(query.page) - 1) * take;
 */

// ── General list endpoints ───────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// ── Audit / event-log style endpoints ───────────────────────────────
export const DEFAULT_AUDIT_PAGE_SIZE = 100;
export const MAX_AUDIT_PAGE_SIZE = 250;

// ── Safety cap for aggregation / analytics queries ──────────────────
// These prevent unbounded memory use while keeping results useful for
// most tenants. Very large tenants may see approximate results.
export const ANALYTICS_SAFETY_CAP = 5000;

// ── Safety cap for chain-verification audit queries ─────────────────
// verifyChain requires ALL logs to detect corruption, but must still
// protect against DoS. 10 000 logs cover months of activity for most
// tenants.
export const AUDIT_CHAIN_SAFETY_CAP = 10000;

/**
 * Clamp a user-supplied `take` value to [1, max].
 * Returns `fallback` when `value` is not a positive finite number.
 */
export function clampTake(
  value: unknown,
  fallback = DEFAULT_PAGE_SIZE,
  max = MAX_PAGE_SIZE,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

/**
 * Clamp a user-supplied `page` value to >= 1.
 */
export function clampPage(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

/**
 * Convenience: return `{ skip, take }` from a page/pageSize pair.
 */
export function getPaginationOptions(
  page?: unknown,
  pageSize?: unknown,
): { skip: number; take: number } {
  const take = clampTake(pageSize);
  const skip = (clampPage(page) - 1) * take;
  return { skip, take };
}
