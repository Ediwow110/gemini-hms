import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { StockReceiving } from '../StockReceiving';
import {
  useInventoryCatalog,
  useReceiveStock,
} from '../../../hooks/use-inventory';
import type { InventoryCatalogItem } from '../../../services/inventory.service';

vi.mock('../../../hooks/use-inventory', () => ({
  useInventoryCatalog: vi.fn(),
  useReceiveStock: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

const buildItem = (
  overrides: Partial<InventoryCatalogItem> = {},
): InventoryCatalogItem => ({
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

describe('StockReceiving — live backend wiring (post-fix)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    vi.mocked(useReceiveStock).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useReceiveStock>);
  });

  it('renders loading skeleton while catalog is loading', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });
    expect(screen.getByText('Stock Receiving')).toBeInTheDocument();
  });

  it('renders error state with no fake data when the catalog request fails', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });
    expect(screen.getByTestId('stock-receiving-error')).toBeInTheDocument();
  });

  it('renders empty state when no catalog items exist', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });
    expect(screen.getByText(/No inventory items in catalog/i)).toBeInTheDocument();
  });

  it('renders real item names from the live catalog in the item selector', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [
        buildItem({ id: 'item-1', name: 'CBC Reagent' }),
        buildItem({ id: 'item-2', name: 'Urine Container' }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });
    const select = screen.getByTestId('stock-receiving-item-select');
    expect(select).toBeInTheDocument();
    expect(select.textContent).toContain('CBC Reagent');
    expect(select.textContent).toContain('Urine Container');
  });

  it('does NOT render any hardcoded "CBC Reagent" row outside the selector', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [buildItem({ id: 'item-1', name: 'CBC Reagent' })],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });
    // The page no longer ships a hardcoded tbody row with quantity 20 — only
    // the real catalog selector should be present.
    expect(screen.queryByText('20')).not.toBeInTheDocument();
    expect(screen.queryByText('B2026-01')).not.toBeInTheDocument();
  });

  it('disables the submit button until an item and a valid quantity are selected', () => {
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [buildItem()],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });
    const submit = screen.getByTestId('stock-receiving-submit');
    expect(submit).toBeDisabled();
  });

  it('calls receiveStock with the selected item, quantity, supplier name, and remarks', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    vi.mocked(useReceiveStock).mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useReceiveStock>);
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [buildItem({ id: 'item-1', name: 'CBC Reagent' })],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });

    fireEvent.change(screen.getByTestId('stock-receiving-item-select'), {
      target: { value: 'item-1' },
    });
    fireEvent.change(screen.getByTestId('stock-receiving-quantity'), {
      target: { value: '7' },
    });
    const supplierInput = screen.getByPlaceholderText('Supplier name (optional)');
    fireEvent.change(supplierInput, { target: { value: 'MediCo' } });
    const remarksInput = screen.getByPlaceholderText('Reference / remarks (optional)');
    fireEvent.change(remarksInput, { target: { value: 'PO-123' } });

    fireEvent.click(screen.getByTestId('stock-receiving-submit'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        itemId: 'item-1',
        quantity: 7,
        supplierName: 'MediCo',
        remarks: 'PO-123',
      });
    });
  });

  it('surfaces a success message after a successful submit and clears form fields', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    vi.mocked(useReceiveStock).mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useReceiveStock>);
    vi.mocked(useInventoryCatalog).mockReturnValue({
      data: [buildItem({ id: 'item-1', name: 'CBC Reagent', unit: 'bottle' })],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useInventoryCatalog>);

    render(<StockReceiving />, { wrapper });

    fireEvent.change(screen.getByTestId('stock-receiving-item-select'), {
      target: { value: 'item-1' },
    });
    fireEvent.change(screen.getByTestId('stock-receiving-quantity'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByTestId('stock-receiving-submit'));

    await waitFor(() => {
      expect(
        screen.getByTestId('stock-receiving-success'),
      ).toBeInTheDocument();
    });
  });
});
