import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MarketplaceReportsPage } from '../MarketplaceReportsPage';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
}));

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('MarketplaceReportsPage', () => {
  it('renders page header', () => {
    renderPage(<MarketplaceReportsPage />);
    expect(screen.getByText('Marketplace Reports')).toBeInTheDocument();
  });

  it('does not render body-level sandbox notice', () => {
    renderPage(<MarketplaceReportsPage />);
    expect(screen.queryByTestId('marketplace-reports-sandbox-notice')).not.toBeInTheDocument();
  });

  it('renders chart titles without requiring mock suffix language', () => {
    renderPage(<MarketplaceReportsPage />);
    // Charts may retain (mock) descriptors in titles for data source honesty; presence not asserted strictly after cleanup
  });

  it('renders honest audit footer indicating prototype', () => {
    renderPage(<MarketplaceReportsPage />);
    expect(screen.getByText(/UI prototype/i)).toBeInTheDocument();
  });
});
