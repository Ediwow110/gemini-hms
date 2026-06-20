import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Inventory } from '../Inventory';
import { useInventoryCatalog } from '../../../hooks/use-inventory';
import type { InventoryCatalogItem } from '../../../services/inventory.service';

vi.mock('../../../hooks/use-inventory', () => ({
  useInventoryCatalog: vi.fn(),
}));

vi.mock('../../../components/ui/RequirePermission', () => ({
  RequirePermission: ({ permission, children }: { permission: string; children: React.ReactNode }) => (
    <div data-permission={permission}>{children}</div>
  ),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

const buildItem = (overrides: Partial<InventoryCatalogItem> = {}): InventoryCatalogItem => ({
  id: 'item-1',
  name: 'CBC Reagent',
  sku: 'SKU-001',
  category: 'Lab',
  unit: 'bottle',
  reorderLevel: 10,
  price: 250,
  status: 'ACTIVE',
  stock: 5,
  ...overrides,
});

describe('Inventory page real-wiring (post-fix)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching the catalog', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });
    expect(screen.getByText('Inventory & Stock')).toBeInTheDocument();
  });

  it('renders error state when the catalog request fails', async () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load inventory catalog/i),
      ).toBeInTheDocument();
    });
  });

  it('renders empty state when no items are returned', async () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/No inventory items found/i)).toBeInTheDocument();
    });
  });

  it('renders real item names from the live catalog', async () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [
        buildItem({ id: 'item-1', name: 'CBC Reagent', sku: 'SKU-001', stock: 5, reorderLevel: 10 }),
        buildItem({ id: 'item-2', name: 'Urine Container', sku: 'SKU-002', stock: 150, reorderLevel: 50, category: 'Consumable', unit: 'box' }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('CBC Reagent')).toBeInTheDocument();
      expect(screen.getByText('Urine Container')).toBeInTheDocument();
    });
  });

  it('does NOT render the dead "Review Items" button on the low-stock alert', async () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [
        buildItem({ id: 'item-1', name: 'CBC Reagent', stock: 0, reorderLevel: 10 }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Low-Stock Action Required')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /review items/i })).not.toBeInTheDocument();
  });

  it('does NOT render hardcoded "Total Items: 45" fake stat', async () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [buildItem()],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });
    await waitFor(() => {
      // The real stat value is computed from data length (1), not hardcoded "45"
      expect(screen.queryByText('45')).not.toBeInTheDocument();
    });
  });

  it('gates Receive Stock with the same permission required by the receiving route', async () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [buildItem()],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Receive Stock/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Receive Stock/i }).closest('[data-permission="inventory.stock.receive"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Receive Stock/i }).closest('[data-permission="inventory.adjust.request"]')).toBeNull();
  });

  it('does NOT render the MOCK_STOCK hardcoded names when data is loading', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<Inventory />, { wrapper });
    expect(screen.queryByText('Rapid Test Kit')).not.toBeInTheDocument();
    expect(screen.queryByText('B2026-01')).not.toBeInTheDocument();
  });
});
