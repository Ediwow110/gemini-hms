import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProcurement } from '../use-procurement';
import { apiClient } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useProcurement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls /v1/procurement/suppliers (not /procurement/suppliers)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { vendors, isLoading } = useProcurement('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{vendors ? vendors.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const calls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url.includes('/procurement/suppliers') && !url.includes('performance')
    );
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toBe('/v1/procurement/suppliers');
  });

  it('calls /v1/procurement/suppliers/performance (not /procurement/suppliers/performance)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { performance, isLoading } = useProcurement('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{performance ? performance.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const calls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url === '/v1/procurement/suppliers/performance'
    );
    expect(calls.length).toBeGreaterThan(0);
  });

  it('calls /v1/procurement/receiving?branchId= (not /procurement/receiving)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { receiving, isLoading } = useProcurement('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{receiving ? receiving.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const calls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url.includes('/procurement/receiving')
    );
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toBe('/v1/procurement/receiving?branchId=branch-1');
  });

  it('calls /v1/procurement/purchase-requests?branchId= (not /procurement/purchase-requests)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { requests, isLoading } = useProcurement('branch-1');
      if (isLoading) return <div>loading</div>;
      return <div data-testid="count">{requests ? requests.length : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const calls = vi.mocked(apiClient.get).mock.calls.filter(
      ([url]: [string]) => url.includes('/procurement/purchase-requests')
    );
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toBe('/v1/procurement/purchase-requests?branchId=branch-1');
  });

  it('fetchQuotes calls /v1/procurement/rfqs/:id/quotes (not /procurement/rfqs/)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const Probe = () => {
      const { fetchQuotes } = useProcurement('branch-1');
      return <button onClick={async () => { await fetchQuotes('rfq-1'); }} data-testid="btn">fetch</button>;
    };

    render(<Probe />, { wrapper });
    screen.getByTestId('btn').click();

    await waitFor(() => {
      const calls = vi.mocked(apiClient.get).mock.calls.filter(
        ([url]: [string]) => url.includes('/procurement/rfqs/')
      );
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe('/v1/procurement/rfqs/rfq-1/quotes');
    });
  });
});
