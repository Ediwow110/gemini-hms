import {
  clampTake,
  clampPage,
  getPaginationOptions,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  DEFAULT_AUDIT_PAGE_SIZE,
  MAX_AUDIT_PAGE_SIZE,
  ANALYTICS_SAFETY_CAP,
  AUDIT_CHAIN_SAFETY_CAP,
} from './pagination';

describe('clampTake', () => {
  it('returns fallback for undefined', () => {
    expect(clampTake(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for null', () => {
    expect(clampTake(null)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for non-numeric string', () => {
    expect(clampTake('abc')).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for empty string', () => {
    expect(clampTake('')).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for NaN', () => {
    expect(clampTake(NaN)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for Infinity', () => {
    expect(clampTake(Infinity)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for zero', () => {
    expect(clampTake(0)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for negative integer', () => {
    expect(clampTake(-5)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('returns fallback for negative float', () => {
    expect(clampTake(-1.5)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('floors decimal values and returns valid positive integer', () => {
    expect(clampTake(10.9)).toBe(10);
    expect(clampTake(7.1)).toBe(7);
    expect(clampTake('20.7')).toBe(20);
  });

  it('returns exact integer when within max', () => {
    expect(clampTake(10)).toBe(10);
    expect(clampTake('25')).toBe(25);
    expect(clampTake(50)).toBe(50);
  });

  it('clamps values above max to max', () => {
    expect(clampTake(MAX_PAGE_SIZE + 1)).toBe(MAX_PAGE_SIZE);
    expect(clampTake(1000)).toBe(MAX_PAGE_SIZE);
    expect(clampTake('500')).toBe(MAX_PAGE_SIZE);
  });

  it('respects custom fallback', () => {
    expect(clampTake(undefined, 25)).toBe(25);
    expect(clampTake('invalid', 30)).toBe(30);
    expect(clampTake(-1, 42)).toBe(42);
  });

  it('respects custom max', () => {
    expect(clampTake(200, DEFAULT_PAGE_SIZE, 150)).toBe(150);
    expect(clampTake('300', 10, 200)).toBe(200);
  });

  it('handles numeric string input correctly', () => {
    expect(clampTake('50')).toBe(50);
    expect(clampTake('100')).toBe(100);
    expect(clampTake('0')).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('clampPage', () => {
  it('returns fallback for undefined', () => {
    expect(clampPage(undefined)).toBe(1);
  });

  it('returns fallback for null', () => {
    expect(clampPage(null)).toBe(1);
  });

  it('returns fallback for non-numeric string', () => {
    expect(clampPage('abc')).toBe(1);
  });

  it('returns fallback for empty string', () => {
    expect(clampPage('')).toBe(1);
  });

  it('returns fallback for NaN', () => {
    expect(clampPage(NaN)).toBe(1);
  });

  it('returns fallback for Infinity', () => {
    expect(clampPage(Infinity)).toBe(1);
  });

  it('returns fallback for zero', () => {
    expect(clampPage(0)).toBe(1);
  });

  it('returns fallback for negative integer', () => {
    expect(clampPage(-5)).toBe(1);
  });

  it('returns fallback for negative float', () => {
    expect(clampPage(-1.5)).toBe(1);
  });

  it('floors decimal values and returns valid positive integer', () => {
    expect(clampPage(10.9)).toBe(10);
    expect(clampPage(7.1)).toBe(7);
    expect(clampPage('20.7')).toBe(20);
  });

  it('returns exact integer when positive', () => {
    expect(clampPage(1)).toBe(1);
    expect(clampPage('5')).toBe(5);
    expect(clampPage(100)).toBe(100);
  });

  it('respects custom fallback', () => {
    expect(clampPage(undefined, 5)).toBe(5);
    expect(clampPage('invalid', 3)).toBe(3);
    expect(clampPage(-1, 42)).toBe(42);
  });

  it('handles numeric string input correctly', () => {
    expect(clampPage('1')).toBe(1);
    expect(clampPage('10')).toBe(10);
    expect(clampPage('0')).toBe(1);
  });
});

describe('getPaginationOptions', () => {
  it('returns expected default skip/take when no params provided', () => {
    const result = getPaginationOptions();
    expect(result.take).toBe(DEFAULT_PAGE_SIZE);
    expect(result.skip).toBe(0);
  });

  it('computes skip correctly from page and take', () => {
    const result = getPaginationOptions(2, 50);
    expect(result.take).toBe(50);
    expect(result.skip).toBe(50);
  });

  it('computes skip correctly for page 1', () => {
    const result = getPaginationOptions(1, 20);
    expect(result.take).toBe(20);
    expect(result.skip).toBe(0);
  });

  it('computes skip correctly for page 3', () => {
    const result = getPaginationOptions(3, 25);
    expect(result.take).toBe(25);
    expect(result.skip).toBe(50);
  });

  it('clamps take to MAX_PAGE_SIZE when pageSize exceeds max', () => {
    const result = getPaginationOptions(1, MAX_PAGE_SIZE + 50);
    expect(result.take).toBe(MAX_PAGE_SIZE);
    expect(result.skip).toBe(0);
  });

  it('clamps take to MAX_PAGE_SIZE when pageSize is a large string', () => {
    const result = getPaginationOptions(1, '500');
    expect(result.take).toBe(MAX_PAGE_SIZE);
  });

  it('handles invalid page safely (defaults to page 1)', () => {
    const result = getPaginationOptions('invalid', 50);
    expect(result.take).toBe(50);
    expect(result.skip).toBe(0);
  });

  it('handles invalid pageSize safely (defaults to DEFAULT_PAGE_SIZE)', () => {
    const result = getPaginationOptions(2, 'invalid');
    expect(result.take).toBe(DEFAULT_PAGE_SIZE);
    expect(result.skip).toBe(DEFAULT_PAGE_SIZE);
  });

  it('handles zero page safely', () => {
    const result = getPaginationOptions(0, 50);
    expect(result.take).toBe(50);
    expect(result.skip).toBe(0);
  });

  it('handles negative page safely', () => {
    const result = getPaginationOptions(-3, 50);
    expect(result.take).toBe(50);
    expect(result.skip).toBe(0);
  });

  it('handles zero pageSize safely', () => {
    const result = getPaginationOptions(2, 0);
    expect(result.take).toBe(DEFAULT_PAGE_SIZE);
    expect(result.skip).toBe(DEFAULT_PAGE_SIZE);
  });

  it('handles negative pageSize safely', () => {
    const result = getPaginationOptions(2, -10);
    expect(result.take).toBe(DEFAULT_PAGE_SIZE);
    expect(result.skip).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('pagination constants', () => {
  it('DEFAULT_PAGE_SIZE is 50', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(50);
  });

  it('MAX_PAGE_SIZE is 100', () => {
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it('DEFAULT_AUDIT_PAGE_SIZE is 100', () => {
    expect(DEFAULT_AUDIT_PAGE_SIZE).toBe(100);
  });

  it('MAX_AUDIT_PAGE_SIZE is 250', () => {
    expect(MAX_AUDIT_PAGE_SIZE).toBe(250);
  });

  it('ANALYTICS_SAFETY_CAP is 5000', () => {
    expect(ANALYTICS_SAFETY_CAP).toBe(5000);
  });

  it('AUDIT_CHAIN_SAFETY_CAP is 10000', () => {
    expect(AUDIT_CHAIN_SAFETY_CAP).toBe(10000);
  });

  it('MAX_PAGE_SIZE >= DEFAULT_PAGE_SIZE', () => {
    expect(MAX_PAGE_SIZE).toBeGreaterThanOrEqual(DEFAULT_PAGE_SIZE);
  });

  it('MAX_AUDIT_PAGE_SIZE >= DEFAULT_AUDIT_PAGE_SIZE', () => {
    expect(MAX_AUDIT_PAGE_SIZE).toBeGreaterThanOrEqual(DEFAULT_AUDIT_PAGE_SIZE);
  });
});
