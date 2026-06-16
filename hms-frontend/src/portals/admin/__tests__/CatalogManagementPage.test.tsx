import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogManagementPage } from '../CatalogManagementPage';
import { useCatalogCategories, useCatalogItems, useInvalidateCatalog } from '../../../hooks/use-catalog';
import { catalogService } from '../../../services/catalog.service';

vi.mock('../../../hooks/use-catalog', () => ({
  useCatalogCategories: vi.fn(),
  useCatalogItems: vi.fn(),
  useInvalidateCatalog: vi.fn(),
}));

vi.mock('../../../services/catalog.service', () => ({
  catalogService: {
    getCategories: vi.fn(),
    getItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
  },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('CatalogManagementPage Phase 15-A', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    vi.mocked(useInvalidateCatalog).mockReturnValue(vi.fn());
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useCatalogCategories).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useCatalogCategories>);
    vi.mocked(useCatalogItems).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useCatalogItems>);

    render(<CatalogManagementPage />, { wrapper });
    expect(screen.getByText('Catalog Management')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    vi.mocked(useCatalogCategories).mockReturnValue({ data: undefined, isLoading: false, error: new Error('Network error') } as unknown as ReturnType<typeof useCatalogCategories>);
    vi.mocked(useCatalogItems).mockReturnValue({ data: undefined, isLoading: false, error: null } as unknown as ReturnType<typeof useCatalogItems>);

    render(<CatalogManagementPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Failed to load catalog data.')).toBeInTheDocument();
    });
  });

  it('renders with real data from hooks', async () => {
    vi.mocked(useCatalogCategories).mockReturnValue({
      data: [{ id: 'cat-1', name: 'Laboratory', description: 'Lab services', isActive: true }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogCategories>);
    vi.mocked(useCatalogItems).mockReturnValue({
      data: [
        { id: 'item-1', name: 'CBC', code: 'LAB-001', description: 'Complete Blood Count', isActive: true, categoryId: 'cat-1', category: { id: 'cat-1', name: 'Laboratory', description: 'Lab services', isActive: true } },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogItems>);

    render(<CatalogManagementPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Catalog Management')).toBeInTheDocument();
      expect(screen.getByText('CBC')).toBeInTheDocument();
      expect(screen.getByText('LAB-001')).toBeInTheDocument();
    });
  });

  it('shows empty filtered state for items', async () => {
    vi.mocked(useCatalogCategories).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogCategories>);
    vi.mocked(useCatalogItems).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogItems>);

    render(<CatalogManagementPage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });
});

describe('CatalogManagementPage save error feedback and dead-action removal', () => {
  beforeEach(() => {
    vi.mocked(useInvalidateCatalog).mockReturnValue(vi.fn());
  });

  it('surfaces createItem error in the modal and keeps the modal open', async () => {
    vi.mocked(useCatalogCategories).mockReturnValue({
      data: [{ id: 'cat-1', name: 'Laboratory', description: 'Lab services', isActive: true }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogCategories>);
    vi.mocked(useCatalogItems).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogItems>);
    vi.mocked(catalogService.createItem).mockRejectedValueOnce(
      new Error('Backend rejected: missing required field'),
    );

    render(<CatalogManagementPage />, { wrapper });

    // Open the New Item modal
    fireEvent.click(screen.getByRole('button', { name: /new item/i }));

    // Modal should be open
    expect(screen.getByText('Add New Item / Service')).toBeInTheDocument();

    // Fill in the required fields
    fireEvent.change(screen.getByPlaceholderText('e.g. LAB-001'), {
      target: { value: 'TEST-001' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. CBC with Platelet Count'), {
      target: { value: 'Test Item' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create catalog item/i }));

    // The error should appear in the modal
    await waitFor(() => {
      expect(
        screen.getByText('Backend rejected: missing required field'),
      ).toBeInTheDocument();
    });

    // The save-failed banner should be present
    expect(screen.getByTestId('catalog-item-error')).toBeInTheDocument();

    // The modal should still be open
    expect(screen.getByText('Add New Item / Service')).toBeInTheDocument();
  });

  it('items table row has no Archive action button (post-fix)', () => {
    vi.mocked(useCatalogCategories).mockReturnValue({
      data: [{ id: 'cat-1', name: 'Laboratory', description: 'Lab services', isActive: true }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogCategories>);
    vi.mocked(useCatalogItems).mockReturnValue({
      data: [
        {
          id: 'item-1',
          name: 'CBC',
          code: 'LAB-001',
          description: 'Complete Blood Count',
          isActive: true,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Laboratory', description: 'Lab services', isActive: true },
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCatalogItems>);

    render(<CatalogManagementPage />, { wrapper });

    // Find the items table row containing the item name
    const itemRow = screen.getByText('CBC').closest('tr');
    expect(itemRow).toBeTruthy();

    // The row should have exactly one action button (Edit), not two (Edit + Archive)
    const actionButtons = itemRow?.querySelectorAll('button');
    expect(actionButtons?.length).toBe(1);
  });
});
