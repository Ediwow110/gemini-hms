import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationCenterPage } from '../NotificationCenterPage';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactElement) =>
  render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });

describe('NotificationCenterPage Redesign', () => {
  it('renders mock page with HMS shell and sandbox labeling', () => {
    renderWithProviders(<NotificationCenterPage />);
    expect(screen.getByText('Notification Center')).toBeInTheDocument();
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
    expect(screen.getByText('Integration Bridges Sandbox')).toBeInTheDocument();
    expect(screen.getByText('Unread (Mock)')).toBeInTheDocument();
  });
});
