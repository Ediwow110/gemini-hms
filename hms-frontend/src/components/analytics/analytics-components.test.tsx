import type React from 'react';
import type { ReportColumn } from '../../types/analytics';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Activity } from 'lucide-react';
import {
  AnalyticsMetricCard,
  ChartCard,
  DashboardFilterBar,
  InsightPanel,
  ReportExportButton,
  ReportTable,
} from './index';

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('analytics UI kit', () => {
  it('AnalyticsMetricCard renders accessible KPI content', () => {
    renderWithRouter(<AnalyticsMetricCard title="Active Users" value="312" description="Signed in" icon={Activity} trend={{ value: '+7%', direction: 'positive' }} />);
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ChartCard renders loading, empty, and error states', () => {
    const { rerender } = render(<ChartCard title="Volume" loading>chart</ChartCard>);
    expect(screen.getByLabelText(/Volume/i)).toBeInTheDocument();
    rerender(<ChartCard title="Volume" empty>chart</ChartCard>);
    expect(screen.getByText(/No analytics data/i)).toBeInTheDocument();
    rerender(<ChartCard title="Volume" error="Failed">chart</ChartCard>);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('DashboardFilterBar exposes labeled controls', () => {
    const onDateRangeChange = vi.fn();
    const onBranchChange = vi.fn();
    render(<DashboardFilterBar dateRange={{ from: '2026-05-01', to: '2026-05-27' }} onDateRangeChange={onDateRangeChange} branch="all" onBranchChange={onBranchChange} />);
    fireEvent.change(screen.getByLabelText(/From/i), { target: { value: '2026-05-02' } });
    expect(onDateRangeChange).toHaveBeenCalledWith({ from: '2026-05-02', to: '2026-05-27' });
    expect(screen.getByLabelText(/Branch/i)).toBeInTheDocument();
  });

  it('InsightPanel renders severity variants and real links only when provided', () => {
    renderWithRouter(<InsightPanel insights={[{ title: 'Risk', description: 'Review queue', severity: 'critical', actionLabel: 'Open', actionTo: '/admin/security' }]} />);
    expect(screen.getByText('Risk')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/admin/security');
  });

  it('ReportExportButton disables WIP export with explanation', () => {
    render(<ReportExportButton label="Export PHI report" sensitive requiresReason />);
    const button = screen.getByRole('button', { name: /Export PHI report WIP/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', expect.stringContaining('disabled'));
  });

  it('ReportTable renders loading and searchable rows with mobile-safe table markup', () => {
    type Row = { id: string; name: string; status: string };
    const columns: ReportColumn<Row>[] = [{ key: 'name', header: 'Name', sortable: true }, { key: 'status', header: 'Status' }];
    const rows: Row[] = [{ id: '1', name: 'Tenant A', status: 'Healthy' }];
    const { rerender } = render(<ReportTable columns={columns} rows={[]} loading />);
    expect(screen.getByLabelText(/Loading report rows/i)).toBeInTheDocument();
    rerender(<ReportTable columns={columns} rows={rows} />);
    expect(screen.getAllByText('Tenant A')[0]).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Search report rows/i), { target: { value: 'missing' } });
    expect(screen.getByText(/No report rows/i)).toBeInTheDocument();
  });
});
