import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogManagementPage } from '../CatalogManagementPage';
import { useCatalogCategories, useCatalogItems, useInvalidateCatalog } from '../../../hooks/use-catalog';

vi.mock('../../../hooks/use-catalog', () => ({
  useCatalogCategories: vi.fn(),
  useCatalogItems: vi.fn(),
  useInvalidateCatalog: vi.fn(),
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
