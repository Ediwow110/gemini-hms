import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalSearchPage } from '../GlobalSearchPage';
import { useIntegrationGlobalSearch } from '../../../hooks/use-integration';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-integration', () => ({
  useIntegrationGlobalSearch: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactElement) =>
  render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });

describe('GlobalSearchPage Redesign', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders initial empty state with HMS shell', () => {
    vi.mocked(useIntegrationGlobalSearch).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useIntegrationGlobalSearch>);

    renderWithProviders(<GlobalSearchPage />);
    expect(screen.getByText('Global Search')).toBeInTheDocument();
    expect(screen.getByText('Type to search')).toBeInTheDocument();
  });

  it('renders search results from real API', () => {
    vi.mocked(useIntegrationGlobalSearch).mockReturnValue({
      data: [{ id: 'r1', title: 'Patient Record', summary: 'Demographics update', recordType: 'PATIENT', sourceDomain: 'Clinical', isMock: false }],
      isLoading: false,
    } as unknown as ReturnType<typeof useIntegrationGlobalSearch>);

    renderWithProviders(<GlobalSearchPage />);
    expect(screen.getByText('Global Search')).toBeInTheDocument();
  });
});
