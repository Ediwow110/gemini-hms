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

  it('renders body-level sandbox notice', () => {
    renderPage(<MarketplaceReportsPage />);
    expect(screen.getByTestId('marketplace-reports-sandbox-notice')).toBeInTheDocument();
    expect(screen.getByText(/Marketplace report metrics, trend charts, and the category performance table on this page are mock analytics/i)).toBeInTheDocument();
  });

  it('renders chart titles with explicit (mock) suffix', () => {
    renderPage(<MarketplaceReportsPage />);
    expect(screen.getByText(/GMV trend \(mock\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier SLA ranking \(mock\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Warranty claims trend \(mock\)/i)).toBeInTheDocument();
  });

  it('renders honest audit footer', () => {
    renderPage(<MarketplaceReportsPage />);
    expect(screen.getByText(/Mock marketplace analytics \(sandbox\)/i)).toBeInTheDocument();
  });
});
