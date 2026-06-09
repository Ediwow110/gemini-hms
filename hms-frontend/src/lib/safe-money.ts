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
    if ('toNumber' in value && typeof (value as any).toNumber === 'function') {
      const n = (value as any).toNumber();
      return Number.isFinite(n) ? n : fallback;
    }
    if ('valueOf' in value && typeof (value as any).valueOf === 'function') {
      const n = Number((value as any).valueOf());
      return Number.isFinite(n) ? n : fallback;
    }
  }
  return fallback;
}
