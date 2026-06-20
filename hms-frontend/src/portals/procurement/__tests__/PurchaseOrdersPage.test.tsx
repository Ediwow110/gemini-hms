/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PurchaseOrdersPage } from '../PurchaseOrdersPage';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

interface MockUser {
  id: string;
  email: string;
  tenantId: string;
  branchId: string;
  roles: string[];
  permissions: string[];
}

const defaultMockUser: MockUser = {
  id: '00000000-0000-0000-0000-0000000000a1',
  email: 'procurement.admin@example.com',
  tenantId: '00000000-0000-0000-0000-0000000000b1',
  branchId: '00000000-0000-0000-0000-0000000000c1',
  roles: ['Procurement Manager'],
  permissions: [
    'procurement.po.create',
    'procurement.po.view',
    'procurement.receiving.post',
  ],
};

const renderPage = (user: MockUser = defaultMockUser) =>
  render(
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        authError: null,
        logout: () => {},
        refetchUser: async () => {},
      }}
    >
      <BrowserRouter>
        <PurchaseOrdersPage />
      </BrowserRouter>
    </AuthContext.Provider>,
  );

const purchaseOrderFixture = [
  {
    id: 'po-001',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c1',
    supplierId: 'sup-001',
    purchaseRequestId: 'pr-001',
    orderNumber: 'PO-2026-0001',
    status: 'SENT',
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
    supplier: {
      id: 'sup-001',
      name: 'Apex Medical Corp',
      contactName: 'Alex Carter',
      contactEmail: 'sales@apexmed.com',
      contactPhone: '+1-555-0100',
      status: 'ACTIVE',
    },
    purchaseRequest: {
      id: 'pr-001',
      status: 'ORDERED',
      reason: 'Routine restock',
      items: [
        { sku: 'CBC-REAGENT-500', quantity: 2, unitPrice: 1500 },
      ],
    },
  },
  {
    id: 'po-002',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c1',
    supplierId: 'sup-002',
    purchaseRequestId: 'pr-002',
    orderNumber: 'PO-2026-0002',
    status: 'RECEIVED',
    createdAt: '2026-05-18T08:00:00.000Z',
    updatedAt: '2026-05-19T08:00:00.000Z',
    supplier: {
      id: 'sup-002',
      name: 'Global Pharma Inc',
      contactName: 'Jamie Lin',
      contactEmail: 'orders@globalpharma.com',
      contactPhone: null,
      status: 'ACTIVE',
    },
    purchaseRequest: {
      id: 'pr-002',
      status: 'ORDERED',
      reason: null,
      items: [
        { sku: 'LATEX-GLOVE-M', quantity: 100, unitPrice: 12 },
        { sku: 'SURG-GOWN-L', quantity: 50, unitPrice: 220 },
      ],
    },
  },
];

const suppliersFixture = [
  {
    id: 'sup-001',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    name: 'Apex Medical Corp',
    contactName: 'Alex Carter',
    contactEmail: 'sales@apexmed.com',
    contactPhone: '+1-555-0100',
    address: '100 Medical Way',
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'sup-002',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    name: 'Global Pharma Inc',
    contactName: 'Jamie Lin',
    contactEmail: 'orders@globalpharma.com',
    contactPhone: null,
    address: null,
    status: 'ACTIVE',
    createdAt: '2026-02-15T00:00:00.000Z',
  },
];

const approvedRequestsFixture = [
  {
    id: 'pr-009',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c1',
    requestedById: '00000000-0000-0000-0000-0000000000d9',
    items: [{ sku: 'SKU-009', quantity: 1, unitPrice: 500 }],
    status: 'APPROVED',
    reason: 'Q2 restock',
    approvedById: '00000000-0000-0000-0000-0000000000a9',
    createdAt: '2026-05-10T08:00:00.000Z',
    updatedAt: '2026-05-11T08:00:00.000Z',
  },
];

describe('PurchaseOrdersPage — live backend wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /v1/procurement/purchase-orders on mount', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/procurement/purchase-orders',
        expect.any(Object),
      );
    });
  });

  it('renders real purchase order data from the API response', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseOrderFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('purchase-order-row-po-001')).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-order-number-po-001'),
    ).toHaveTextContent('PO-2026-0001');
    expect(
      screen.getByTestId('purchase-order-supplier-po-001'),
    ).toHaveTextContent('Apex Medical Corp');
    expect(
      screen.getByTestId('purchase-order-items-po-001'),
    ).toHaveTextContent('1 item');
  });

  it('shows status badges sourced from the real backend status', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseOrderFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-order-status-po-001'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-order-status-po-001'),
    ).toHaveTextContent('Sent');
    expect(
      screen.getByTestId('purchase-order-status-po-002'),
    ).toHaveTextContent('Received');
  });

  it('does NOT render any hardcoded mock purchase order fallback', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/procurement/purchase-orders',
        expect.any(Object),
      );
    });
    expect(screen.queryByText('PO-2026-441')).not.toBeInTheDocument();
    expect(screen.queryByText('PO-2026-440')).not.toBeInTheDocument();
    expect(screen.queryByText('PO-2026-438')).not.toBeInTheDocument();
    expect(screen.queryByText('PO-2026-435')).not.toBeInTheDocument();
    expect(screen.queryByText('Apex Medical Corp')).not.toBeInTheDocument();
    expect(screen.queryByText('Global Pharma Inc')).not.toBeInTheDocument();
    expect(screen.queryByText('Stellar Imaging')).not.toBeInTheDocument();
    expect(screen.queryByText('₱125,000')).not.toBeInTheDocument();
    expect(screen.queryByText('₱45,000')).not.toBeInTheDocument();
    expect(screen.queryByText('₱22,000')).not.toBeInTheDocument();
    expect(screen.queryByText('₱850,000')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Sandbox Status \(Backend Integration Pending\)/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('New PO WIP')).not.toBeInTheDocument();
    expect(screen.getByTestId('purchase-orders-empty')).toBeInTheDocument();
  });

  it('does NOT render fabricated deliveryStatus (ON_TIME / DELAYED) or amount', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseOrderFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('purchase-order-row-po-001')).toBeInTheDocument();
    });
    expect(screen.queryByText('ON_TIME')).not.toBeInTheDocument();
    expect(screen.queryByText('DELAYED')).not.toBeInTheDocument();
  });

  it('disables Receive on a PO that is not in SENT status', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseOrderFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-order-receive-po-002'),
      ).toBeInTheDocument();
    });
    const receivedBtn = screen.getByTestId(
      'purchase-order-receive-po-002',
    ) as HTMLButtonElement;
    expect(receivedBtn.disabled).toBe(true);
  });

  it('enables Receive on a SENT PO and opens the receive modal', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseOrderFixture,
    });
    renderPage();
    const receiveBtn = await screen.findByTestId(
      'purchase-order-receive-po-001',
    );
    expect((receiveBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(receiveBtn);
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-receive-target'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-orders-receive-target'),
    ).toHaveTextContent('PO-2026-0001');
  });

  it('shows inline fetch error (no alert) when API fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-fetch-error'),
      ).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('calls POST receive and refreshes the list on success', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: purchaseOrderFixture })
      .mockResolvedValueOnce({ data: purchaseOrderFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'po-001', status: 'RECEIVED' },
    });

    renderPage();
    const receiveBtn = await screen.findByTestId(
      'purchase-order-receive-po-001',
    );
    fireEvent.click(receiveBtn);
    fireEvent.click(await screen.findByTestId('purchase-orders-receive-submit'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/procurement/purchase-orders/po-001/receive',
        {},
      );
    });
    await waitFor(() => {
      expect((apiClient.get as any).mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
    });
  });

  it('sends receive notes when provided', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: purchaseOrderFixture })
      .mockResolvedValueOnce({ data: purchaseOrderFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'po-001', status: 'RECEIVED' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-order-receive-po-001'));
    fireEvent.change(screen.getByTestId('purchase-orders-receive-notes'), {
      target: { value: 'All cartons received intact' },
    });
    fireEvent.click(screen.getByTestId('purchase-orders-receive-submit'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/procurement/purchase-orders/po-001/receive',
        { notes: 'All cartons received intact' },
      );
    });
  });

  it('surfaces inline receive error (no alert) when POST fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseOrderFixture,
    });
    (apiClient.post as any).mockRejectedValueOnce(
      new Error('Purchase order is already received'),
    );

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-order-receive-po-001'));
    fireEvent.click(screen.getByTestId('purchase-orders-receive-submit'));

    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-receive-error'),
      ).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('opens create modal, fetches suppliers and approved PRs, and submits the exact backend DTO', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: suppliersFixture })
      .mockResolvedValueOnce({ data: approvedRequestsFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'po-100', orderNumber: 'PO-2026-0100', status: 'SENT' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-orders-create'));

    const submitBeforeAnySelection = await screen.findByTestId(
      'purchase-orders-create-submit',
    );
    fireEvent.click(submitBeforeAnySelection);
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-create-error'),
      ).toHaveTextContent(/Select a supplier/i);
    });
    expect(apiClient.post).not.toHaveBeenCalled();

    const supplierSelect = await screen.findByTestId(
      'purchase-orders-create-supplier',
    );
    fireEvent.change(supplierSelect, { target: { value: 'sup-001' } });
    fireEvent.click(submitBeforeAnySelection);
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-create-error'),
      ).toHaveTextContent(/approved purchase request/i);
    });
    expect(apiClient.post).not.toHaveBeenCalled();

    const prSelect = await screen.findByTestId('purchase-orders-create-pr');
    fireEvent.change(prSelect, { target: { value: 'pr-009' } });
    fireEvent.click(submitBeforeAnySelection);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/procurement/purchase-orders',
        expect.objectContaining({
          branchId: defaultMockUser.branchId,
          supplierId: 'sup-001',
          purchaseRequestId: 'pr-009',
        }),
      );
    });
  });

  it('derives branchId from the auth context and does not accept it from the form', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: suppliersFixture })
      .mockResolvedValueOnce({ data: approvedRequestsFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'po-101', orderNumber: 'PO-2026-0101', status: 'SENT' },
    });

    const customUser: MockUser = {
      ...defaultMockUser,
      branchId: '00000000-0000-0000-0000-0000000000ca',
    };
    renderPage(customUser);

    fireEvent.click(await screen.findByTestId('purchase-orders-create'));
    expect(
      screen.getByTestId('purchase-orders-create-branch'),
    ).toHaveTextContent(customUser.branchId.slice(0, 8));

    const supplierSelect = await screen.findByTestId(
      'purchase-orders-create-supplier',
    );
    fireEvent.change(supplierSelect, { target: { value: 'sup-001' } });
    const prSelect = await screen.findByTestId('purchase-orders-create-pr');
    fireEvent.change(prSelect, { target: { value: 'pr-009' } });
    fireEvent.click(
      screen.getByTestId('purchase-orders-create-submit'),
    );

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const payload = (apiClient.post as any).mock.calls[0][1];
    expect(payload.branchId).toBe(customUser.branchId);
  });

  it('does NOT send tenantId in the create payload (server-derived only)', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: suppliersFixture })
      .mockResolvedValueOnce({ data: approvedRequestsFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'po-102', orderNumber: 'PO-2026-0102', status: 'SENT' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-orders-create'));
    const supplierSelect = await screen.findByTestId(
      'purchase-orders-create-supplier',
    );
    fireEvent.change(supplierSelect, { target: { value: 'sup-001' } });
    const prSelect = await screen.findByTestId('purchase-orders-create-pr');
    fireEvent.change(prSelect, { target: { value: 'pr-009' } });
    fireEvent.click(screen.getByTestId('purchase-orders-create-submit'));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const payload = (apiClient.post as any).mock.calls[0][1];
    expect(payload).not.toHaveProperty('tenantId');
  });

  it('surfaces inline create error (no alert) when POST fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: suppliersFixture })
      .mockResolvedValueOnce({ data: approvedRequestsFixture });
    (apiClient.post as any).mockRejectedValueOnce(
      new Error('Purchase request is no longer APPROVED'),
    );

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-orders-create'));
    const supplierSelect = await screen.findByTestId(
      'purchase-orders-create-supplier',
    );
    fireEvent.change(supplierSelect, { target: { value: 'sup-001' } });
    const prSelect = await screen.findByTestId('purchase-orders-create-pr');
    fireEvent.change(prSelect, { target: { value: 'pr-009' } });
    fireEvent.click(screen.getByTestId('purchase-orders-create-submit'));

    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-create-error'),
      ).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('shows a clear error when the auth context has no branchId', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: suppliersFixture })
      .mockResolvedValueOnce({ data: approvedRequestsFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'po-103', status: 'SENT' },
    });

    const noBranchUser: MockUser = {
      ...defaultMockUser,
      branchId: '',
    };
    renderPage(noBranchUser);

    fireEvent.click(await screen.findByTestId('purchase-orders-create'));
    const supplierSelect = await screen.findByTestId(
      'purchase-orders-create-supplier',
    );
    fireEvent.change(supplierSelect, { target: { value: 'sup-001' } });
    const prSelect = await screen.findByTestId('purchase-orders-create-pr');
    fireEvent.change(prSelect, { target: { value: 'pr-009' } });
    fireEvent.click(screen.getByTestId('purchase-orders-create-submit'));

    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-create-error'),
      ).toHaveTextContent(/No branch context/i);
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('shows a clear notice when no approved purchase requests are available', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: suppliersFixture })
      .mockResolvedValueOnce({ data: [] });

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-orders-create'));

    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-create-pr-empty'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-orders-create-pr-empty'),
    ).toHaveTextContent(/No approved purchase requests/i);
  });

  it('displays the summary stats derived from real status data', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseOrderFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-orders-stat-sent'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-orders-stat-sent'),
    ).toHaveTextContent('1');
    expect(
      screen.getByTestId('purchase-orders-stat-received'),
    ).toHaveTextContent('1');
  });

  it('renders the supplier name from the live supplier relation (not from a hardcoded supplier field)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [
        {
          ...purchaseOrderFixture[0],
          supplier: null,
        },
      ],
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-order-supplier-po-001'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-order-supplier-po-001'),
    ).toHaveTextContent(/^Supplier /);
  });
});
