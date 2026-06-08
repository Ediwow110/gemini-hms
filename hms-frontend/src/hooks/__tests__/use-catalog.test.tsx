import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCatalogCategories, useCatalogItems } from '../use-catalog';
import { catalogService } from '../../services/catalog.service';

vi.mock('../../services/catalog.service', () => ({
  catalogService: {
    getCategories: vi.fn(),
    getItems: vi.fn(),
  },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useCatalogCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls getCategories and returns data', async () => {
    const mockData = [{ id: 'cat-1', name: 'Laboratory', description: 'Lab services', isActive: true }];
    vi.mocked(catalogService.getCategories).mockResolvedValue(mockData);

    const Probe = () => {
      const { data, isLoading } = useCatalogCategories();
      if (isLoading) return <div>loading</div>;
      return <div data-testid="data">{data ? `${data.length} categories` : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('1 categories'));
  });
});

describe('useCatalogItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls getItems and returns data', async () => {
    const mockData = [{ id: 'item-1', name: 'CBC', code: 'LAB-001', description: 'CBC', isActive: true, categoryId: 'cat-1' }];
    vi.mocked(catalogService.getItems).mockResolvedValue(mockData);

    const Probe = () => {
      const { data, isLoading } = useCatalogItems();
      if (isLoading) return <div>loading</div>;
      return <div data-testid="data">{data ? `${data.length} items` : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('1 items'));
  });
});
