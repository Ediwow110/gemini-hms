/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { SuppliersPage } from '../SuppliersPage';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <BrowserRouter>
      <SuppliersPage />
    </BrowserRouter>,
  );

const suppliersFixture = [
  {
    id: 'sup-001',
    tenantId: 'tenant-1',
    name: 'Apex Medical Corp',
    contactName: 'Alex Carter',
    contactEmail: 'sales@apexmed.com',
    contactPhone: '+1-555-0100',
    address: '100 Medical Way, Springfield',
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'sup-002',
    tenantId: 'tenant-1',
    name: 'Global Pharma Inc',
    contactName: 'Jamie Lin',
    contactEmail: 'orders@globalpharma.com',
    contactPhone: null,
    address: null,
    status: 'ACTIVE',
    createdAt: '2026-02-15T00:00:00.000Z',
  },
];

describe('SuppliersPage — live backend wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /v1/procurement/suppliers on mount', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: suppliersFixture });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/procurement/suppliers',
        expect.any(Object),
      );
    });
  });

  it('renders real supplier data from the API response', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: suppliersFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('supplier-name-sup-001')).toHaveTextContent(
        'Apex Medical Corp',
      );
    });
    expect(screen.getByTestId('supplier-name-sup-002')).toHaveTextContent(
      'Global Pharma Inc',
    );
    expect(screen.getByTestId('supplier-status-sup-001')).toHaveTextContent(
      'ACTIVE',
    );
  });

  it('does NOT render any hardcoded mock supplier fallback', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/procurement/suppliers',
        expect.any(Object),
      );
    });
    expect(screen.queryByText('Apex Medical Corp')).not.toBeInTheDocument();
    expect(screen.queryByText('Metro Lab Tech')).not.toBeInTheDocument();
    expect(screen.queryByText('Stellar Imaging Solutions')).not.toBeInTheDocument();
    expect(screen.getByTestId('suppliers-empty')).toBeInTheDocument();
  });

  it('does NOT contain the false sandbox / simulated wording once live', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: suppliersFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('suppliers-grid')).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Supplier data and accreditation status are simulated/i),
    ).not.toBeInTheDocument();
  });

  it('shows inline fetch error (no alert) when API fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('suppliers-fetch-error')).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('opens create modal, validates required name, and submits the correct DTO', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'sup-003', name: 'New Vendor', status: 'ACTIVE' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('suppliers-create'));

    const submitBtn = await screen.findByTestId('suppliers-create-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('suppliers-create-error')).toHaveTextContent(
        /Supplier name is required/i,
      );
    });
    expect(apiClient.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('suppliers-create-name'), {
      target: { value: 'New Vendor' },
    });
    fireEvent.change(screen.getByTestId('suppliers-create-contact-name'), {
      target: { value: 'Pat Jones' },
    });
    fireEvent.change(screen.getByTestId('suppliers-create-email'), {
      target: { value: 'pat@vendor.com' },
    });
    fireEvent.change(screen.getByTestId('suppliers-create-phone'), {
      target: { value: '+1-555-0200' },
    });
    fireEvent.change(screen.getByTestId('suppliers-create-address'), {
      target: { value: '42 Vendor Rd' },
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/procurement/suppliers',
        expect.objectContaining({
          name: 'New Vendor',
          contactName: 'Pat Jones',
          contactEmail: 'pat@vendor.com',
          contactPhone: '+1-555-0200',
          address: '42 Vendor Rd',
        }),
      );
    });
  });

  it('rejects submit when contact email is invalid', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    fireEvent.click(await screen.findByTestId('suppliers-create'));
    fireEvent.change(screen.getByTestId('suppliers-create-name'), {
      target: { value: 'Test Supplier' },
    });
    fireEvent.change(screen.getByTestId('suppliers-create-email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByTestId('suppliers-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('suppliers-create-error')).toHaveTextContent(
        /not a valid email/i,
      );
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('omits empty optional contact fields from the POST payload', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'sup-004', name: 'Minimal Co', status: 'ACTIVE' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('suppliers-create'));
    fireEvent.change(screen.getByTestId('suppliers-create-name'), {
      target: { value: 'Minimal Co' },
    });
    fireEvent.click(screen.getByTestId('suppliers-create-submit'));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const payload = (apiClient.post as any).mock.calls[0][1];
    expect(payload).toEqual({ name: 'Minimal Co' });
    expect(payload).not.toHaveProperty('contactName');
    expect(payload).not.toHaveProperty('contactEmail');
    expect(payload).not.toHaveProperty('contactPhone');
    expect(payload).not.toHaveProperty('address');
  });

  it('does NOT send tenantId or branchId in the create payload (server-derived only)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'sup-005', name: 'Trust Co', status: 'ACTIVE' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('suppliers-create'));
    fireEvent.change(screen.getByTestId('suppliers-create-name'), {
      target: { value: 'Trust Co' },
    });
    fireEvent.click(screen.getByTestId('suppliers-create-submit'));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const payload = (apiClient.post as any).mock.calls[0][1];
    expect(payload).not.toHaveProperty('tenantId');
    expect(payload).not.toHaveProperty('branchId');
  });

  it('does NOT send tenantId or branchId as query params on list', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const args = (apiClient.get as any).mock.calls[0];
    expect(args[0]).toBe('/v1/procurement/suppliers');
    const params = args[1]?.params ?? {};
    expect(params).not.toHaveProperty('tenantId');
    expect(params).not.toHaveProperty('branchId');
  });

  it('refreshes the supplier list after a successful create', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: suppliersFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'sup-006', name: 'After Co', status: 'ACTIVE' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('suppliers-create'));
    fireEvent.change(screen.getByTestId('suppliers-create-name'), {
      target: { value: 'After Co' },
    });
    fireEvent.click(screen.getByTestId('suppliers-create-submit'));

    await waitFor(() => {
      expect((apiClient.get as any).mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
    });
  });

  it('surfaces inline create error (no alert) when POST fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockRejectedValueOnce(
      new Error('Insufficient permissions'),
    );

    renderPage();
    fireEvent.click(await screen.findByTestId('suppliers-create'));
    fireEvent.change(screen.getByTestId('suppliers-create-name'), {
      target: { value: 'Boom Co' },
    });
    fireEvent.click(screen.getByTestId('suppliers-create-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('suppliers-create-error')).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('filters suppliers client-side via the search input', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: suppliersFixture });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('supplier-name-sup-001')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('suppliers-search'), {
      target: { value: 'Global' },
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId('supplier-name-sup-001'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('supplier-name-sup-002')).toBeInTheDocument();
    });
  });
});
