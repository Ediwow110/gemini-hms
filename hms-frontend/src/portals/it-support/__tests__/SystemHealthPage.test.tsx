import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemHealthPage } from '../SystemHealthPage';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'user-1',
    email: 'it@hospital.com',
    role: 'IT Support',
    branchId: 'branch-1',
  }),
}));

vi.mock('../../../hooks/use-it-support', () => ({
  useItSupport: () => ({
    health: {
      overallStatus: 'HEALTHY',
      services: [
        { id: 'api', name: 'HMS API Gateway', status: 'ONLINE', latency: 42, uptime: 99.97 },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithRouter = (ui: React.ReactElement) => render(ui, {
  wrapper: ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  ),
});

describe('SystemHealthPage Redesign', () => {
  it('renders system health page with HMS shell and explicitly mocked data warning', () => {
    renderWithRouter(<SystemHealthPage />);
    
    expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
    expect(screen.getByText('API Cluster Uptime')).toBeInTheDocument();
    expect(screen.getByText('99.97%')).toBeInTheDocument();
    expect(screen.getByText('HMS API Gateway')).toBeInTheDocument();
  });
});
