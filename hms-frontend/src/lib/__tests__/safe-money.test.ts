import { describe, it, expect } from 'vitest';
import { safeMoney } from '../safe-money';

describe('safeMoney', () => {
  it('returns the value for finite numbers', () => {
    expect(safeMoney(0)).toBe(0);
    expect(safeMoney(100)).toBe(100);
    expect(safeMoney(99.99)).toBe(99.99);
    expect(safeMoney(-50)).toBe(-50);
  });

  it('returns fallback for NaN', () => {
    expect(safeMoney(NaN)).toBe(0);
  });

  it('returns fallback for Infinity', () => {
    expect(safeMoney(Infinity)).toBe(0);
    expect(safeMoney(-Infinity)).toBe(0);
  });

  it('parses numeric strings', () => {
    expect(safeMoney('100')).toBe(100);
    expect(safeMoney('99.99')).toBe(99.99);
    expect(safeMoney('0')).toBe(0);
  });

  it('returns fallback for non-numeric strings', () => {
    expect(safeMoney('abc')).toBe(0);
    expect(safeMoney('')).toBe(0);
    expect(safeMoney('   ')).toBe(0);
  });

  it('returns fallback for null and undefined', () => {
    expect(safeMoney(null)).toBe(0);
    expect(safeMoney(undefined)).toBe(0);
  });

  it('returns fallback for objects without toNumber/valueOf', () => {
    expect(safeMoney({})).toBe(0);
    expect(safeMoney({ foo: 'bar' })).toBe(0);
  });

  it('uses toNumber() when available on objects', () => {
    const decimalObj = { toNumber: () => 42.5 };
    expect(safeMoney(decimalObj)).toBe(42.5);
  });

  it('uses valueOf() when available on objects', () => {
    const obj = { valueOf: () => '100.50' };
    expect(safeMoney(obj)).toBe(100.5);
  });

  it('prefers toNumber() over valueOf()', () => {
    const obj = { toNumber: () => 200, valueOf: () => 100 };
    expect(safeMoney(obj)).toBe(200);
  });

  it('accepts a custom fallback value', () => {
    expect(safeMoney(null, 0)).toBe(0);
    expect(safeMoney(undefined, 0)).toBe(0);
  });

  it('handles boolean values gracefully', () => {
    expect(safeMoney(true)).toBe(0);
    expect(safeMoney(false)).toBe(0);
  });
});
