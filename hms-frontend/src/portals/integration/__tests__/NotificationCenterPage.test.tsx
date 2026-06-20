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

describe('NotificationCenterPage — honest state (post-truth-alignment)', () => {
  it('renders HMS shell, honest shell notice, and live-derived stats from notifications', () => {
    renderWithProviders(<NotificationCenterPage />);
    expect(screen.getByText('Notification Center')).toBeInTheDocument();
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
    expect(screen.getByText(/Integration Bridges\s+[—-]\s+Mixed Availability/i)).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
  });
});
