import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuditLogViewer } from '../AuditLogViewer';
import { useAuditEvents } from '../../../hooks/use-compliance';

vi.mock('../../../hooks/use-compliance', () => ({
  useAuditEvents: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(ui, { wrapper: MemoryRouter });

describe('AuditLogViewer Search Debounce Tests', () => {
  beforeEach(() => {
    vi.mocked(useAuditEvents).mockImplementation(() => ({
      events: [],
      total: 0,
      loading: false,
      error: null,
      refetch: vi.fn(),
    }));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('does not propagate intermediate search values to useAuditEvents during rapid typing', () => {
    renderWithRouter(<AuditLogViewer />);

    // After initial render, useAuditEvents was called once with no search
    const initialCallCount = vi.mocked(useAuditEvents).mock.calls.length;
    expect(initialCallCount).toBe(1);
    const initialParams = vi.mocked(useAuditEvents).mock.calls[0][0];
    expect(initialParams?.search).toBeUndefined();

    const searchInput = screen.getByPlaceholderText('Search events...');

    // Type "a" - should NOT propagate search="a" yet (debounce not elapsed)
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'a' } });
    });
    // Type "ab" - should NOT propagate search="ab" yet
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'ab' } });
    });
    // Type "abc" - should NOT propagate search="abc" yet
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'abc' } });
    });

    // After typing 3 chars, no NEW call with intermediate search values should exist.
    // All calls during typing should still have search undefined (or match the prior value).
    for (const call of vi.mocked(useAuditEvents).mock.calls) {
      expect(call[0]?.search).toBeUndefined();
    }

    // Advance timers past the debounce window (assume 300ms debounce)
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // After debounce, the FINAL search value "abc" should propagate exactly once
    const finalCalls = vi.mocked(useAuditEvents).mock.calls;
    const lastCall = finalCalls[finalCalls.length - 1];
    expect(lastCall[0]?.search).toBe('abc');

    // Exactly one debounced call should have fired with a non-undefined search
    const searchCalls = finalCalls.filter(
      (c) => c[0]?.search !== undefined,
    );
    expect(searchCalls.length).toBe(1);
    expect(searchCalls[0][0]?.search).toBe('abc');
  });
});
