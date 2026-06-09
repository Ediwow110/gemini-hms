export function safeMoney(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === 'object' && value !== null) {
    if ('toNumber' in value && typeof (value as { toNumber: unknown }).toNumber === 'function') {
      const n = (value as { toNumber: () => number }).toNumber();
      return Number.isFinite(n) ? n : fallback;
    }
    if ('valueOf' in value && typeof (value as { valueOf: unknown }).valueOf === 'function') {
      const n = Number((value as { valueOf: () => unknown }).valueOf());
      return Number.isFinite(n) ? n : fallback;
    }
  }
  return fallback;
}
