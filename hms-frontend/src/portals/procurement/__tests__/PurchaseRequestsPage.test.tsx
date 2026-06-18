/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PurchaseRequestsPage } from '../PurchaseRequestsPage';
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
  email: 'hr.admin@example.com',
  tenantId: '00000000-0000-0000-0000-0000000000b1',
  branchId: '00000000-0000-0000-0000-0000000000c1',
  roles: ['HR Manager'],
  permissions: ['procurement.request.create', 'procurement.request.approve'],
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
        <PurchaseRequestsPage />
      </BrowserRouter>
    </AuthContext.Provider>,
  );

const purchaseRequestFixture = [
  {
    id: 'pr-001',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c1',
    requestedById: '00000000-0000-0000-0000-0000000000d1',
    items: [
      { sku: 'CBC-REAGENT-500', quantity: 2, unitPrice: 1500 },
    ],
    status: 'SUBMITTED',
    reason: 'Routine restock',
    approvedById: null,
    createdAt: '2026-05-21T08:00:00.000Z',
    updatedAt: '2026-05-21T08:00:00.000Z',
  },
  {
    id: 'pr-002',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c2',
    requestedById: '00000000-0000-0000-0000-0000000000d2',
    items: [
      { sku: 'LATEX-GLOVE-M', quantity: 100, unitPrice: 12 },
      { sku: 'SURG-GOWN-L', quantity: 50, unitPrice: 220 },
    ],
    status: 'APPROVED',
    reason: null,
    approvedById: '00000000-0000-0000-0000-0000000000a2',
    createdAt: '2026-05-19T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'pr-003',
    tenantId: '00000000-0000-0000-0000-0000000000b1',
    branchId: '00000000-0000-0000-0000-0000000000c3',
    requestedById: '00000000-0000-0000-0000-0000000000d3',
    items: [{ sku: 'MRI-HELIUM', quantity: 1, unitPrice: 85000 }],
    status: 'REJECTED',
    reason: 'Use existing supplier',
    approvedById: null,
    createdAt: '2026-05-18T08:00:00.000Z',
    updatedAt: '2026-05-19T08:00:00.000Z',
  },
];

describe('PurchaseRequestsPage — live backend wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /v1/procurement/purchase-requests on mount', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/procurement/purchase-requests',
        expect.any(Object),
      );
    });
  });

  it('renders real purchase request data from the API response', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseRequestFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-request-row-pr-001'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-request-item-pr-001'),
    ).toHaveTextContent('CBC-REAGENT-500');
    expect(
      screen.getByTestId('purchase-request-requester-pr-001'),
    ).toHaveTextContent(/^Requester /);
    expect(
      screen.getByTestId('purchase-request-branch-pr-001'),
    ).toHaveTextContent(/^Branch /);
  });

  it('shows a status badge sourced from the real backend status (not a hardcoded one)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseRequestFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-request-status-pr-001'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-request-status-pr-001'),
    ).toHaveTextContent('Pending Review');
    expect(
      screen.getByTestId('purchase-request-status-pr-002'),
    ).toHaveTextContent('Approved');
    expect(
      screen.getByTestId('purchase-request-status-pr-003'),
    ).toHaveTextContent('Rejected');
  });

  it('does NOT render any hardcoded mock purchase request fallback', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/procurement/purchase-requests',
        expect.any(Object),
      );
    });
    expect(screen.queryByText('CBC Reagents (Bulk)')).not.toBeInTheDocument();
    expect(screen.queryByText('Latex Gloves (Medium)')).not.toBeInTheDocument();
    expect(screen.queryByText('MRI Cooling Helium')).not.toBeInTheDocument();
    expect(screen.queryByText('Surgical Gowns (L)')).not.toBeInTheDocument();
    expect(screen.queryByText('Defibrillator Pads')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Sandbox Status \(Backend Integration Pending\)/i),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('purchase-requests-empty')).toBeInTheDocument();
  });

  it('does NOT contain any pop-culture requester / branch / item names', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseRequestFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-request-row-pr-001'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/Dr\. House/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nurse Hopps/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dr\. Chase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Engr\. Smith/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nurse Wilson/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/St\. Jude Metro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/St\. Jude North/i)).not.toBeInTheDocument();
  });

  it('does NOT render the Budget Verification mock numbers (no fabricated amounts)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/procurement/purchase-requests',
        expect.any(Object),
      );
    });
    expect(screen.queryByText('₱450,000.00')).not.toBeInTheDocument();
    expect(screen.queryByText('₱124,000.00')).not.toBeInTheDocument();
    expect(screen.getByTestId('budget-no-data')).toBeInTheDocument();
  });

  it('shows inline fetch error (no alert) when API fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-requests-fetch-error'),
      ).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('does NOT render a Reject button (backend has no /reject endpoint)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseRequestFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-request-approve-pr-001'),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId('purchase-request-reject-pr-001'),
    ).not.toBeInTheDocument();
  });

  it('disables Approve on a request that is not in SUBMITTED status', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseRequestFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-request-approve-pr-002'),
      ).toBeInTheDocument();
    });
    const approvedBtn = screen.getByTestId(
      'purchase-request-approve-pr-002',
    ) as HTMLButtonElement;
    expect(approvedBtn.disabled).toBe(true);
  });

  it('disables Approve on the current user\'s own request (no self-approve)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: [
        {
          ...purchaseRequestFixture[0],
          requestedById: defaultMockUser.id,
        },
      ],
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-request-approve-pr-001'),
      ).toBeInTheDocument();
    });
    const ownBtn = screen.getByTestId(
      'purchase-request-approve-pr-001',
    ) as HTMLButtonElement;
    expect(ownBtn.disabled).toBe(true);
  });

  it('calls PATCH approve and refreshes the list on success', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: purchaseRequestFixture })
      .mockResolvedValueOnce({ data: purchaseRequestFixture });
    (apiClient.patch as any).mockResolvedValueOnce({
      data: { id: 'pr-001', status: 'APPROVED' },
    });

    renderPage();
    const approveBtn = await screen.findByTestId(
      'purchase-request-approve-pr-001',
    );
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/procurement/purchase-requests/pr-001/approve',
      );
    });
    await waitFor(() => {
      expect((apiClient.get as any).mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
    });
  });

  it('surfaces inline approve error (no alert) when PATCH fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseRequestFixture,
    });
    (apiClient.patch as any).mockRejectedValueOnce(
      new Error('Cannot self-approve'),
    );

    renderPage();
    const approveBtn = await screen.findByTestId(
      'purchase-request-approve-pr-001',
    );
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-requests-action-error'),
      ).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('opens create modal, validates required SKU, and submits the exact backend DTO', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        id: 'pr-100',
        branchId: defaultMockUser.branchId,
        requestedById: defaultMockUser.id,
        items: [{ sku: 'SKU-001', quantity: 5, unitPrice: 100 }],
        status: 'SUBMITTED',
        createdAt: '2026-06-19T00:00:00.000Z',
      },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-requests-create'));

    fireEvent.click(screen.getByTestId('purchase-requests-create-submit'));
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-requests-create-error'),
      ).toHaveTextContent(/SKU is required/i);
    });
    expect(apiClient.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('purchase-requests-item-sku-0'), {
      target: { value: 'SKU-001' },
    });
    fireEvent.change(screen.getByTestId('purchase-requests-item-qty-0'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByTestId('purchase-requests-item-price-0'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByTestId('purchase-requests-create-reason'), {
      target: { value: 'Quarterly restock' },
    });

    fireEvent.click(screen.getByTestId('purchase-requests-create-submit'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/procurement/purchase-requests',
        expect.objectContaining({
          branchId: defaultMockUser.branchId,
          items: [
            { sku: 'SKU-001', quantity: 5, unitPrice: 100 },
          ],
          reason: 'Quarterly restock',
        }),
      );
    });
  });

  it('derives branchId from the auth context and does not accept it from the form', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'pr-101', status: 'SUBMITTED' },
    });

    const customUser: MockUser = {
      ...defaultMockUser,
      branchId: '00000000-0000-0000-0000-0000000000ca',
    };
    renderPage(customUser);

    fireEvent.click(await screen.findByTestId('purchase-requests-create'));
    expect(
      screen.getByTestId('purchase-requests-create-branch'),
    ).toHaveTextContent(customUser.branchId.slice(0, 8));

    fireEvent.change(screen.getByTestId('purchase-requests-item-sku-0'), {
      target: { value: 'SKU-X' },
    });
    fireEvent.click(screen.getByTestId('purchase-requests-create-submit'));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const payload = (apiClient.post as any).mock.calls[0][1];
    expect(payload.branchId).toBe(customUser.branchId);
  });

  it('does NOT send tenantId in the create payload (server-derived only)', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'pr-102', status: 'SUBMITTED' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-requests-create'));
    fireEvent.change(screen.getByTestId('purchase-requests-item-sku-0'), {
      target: { value: 'SKU-X' },
    });
    fireEvent.click(screen.getByTestId('purchase-requests-create-submit'));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const payload = (apiClient.post as any).mock.calls[0][1];
    expect(payload).not.toHaveProperty('tenantId');
  });

  it('refreshes the list after a successful create', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: purchaseRequestFixture });
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 'pr-103', status: 'SUBMITTED' },
    });

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-requests-create'));
    fireEvent.change(screen.getByTestId('purchase-requests-item-sku-0'), {
      target: { value: 'SKU-X' },
    });
    fireEvent.click(screen.getByTestId('purchase-requests-create-submit'));

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
      new Error('Branch not found'),
    );

    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-requests-create'));
    fireEvent.change(screen.getByTestId('purchase-requests-item-sku-0'), {
      target: { value: 'SKU-X' },
    });
    fireEvent.click(screen.getByTestId('purchase-requests-create-submit'));

    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-requests-create-error'),
      ).toBeInTheDocument();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('shows a clear error when the auth context has no branchId', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });

    const noBranchUser: MockUser = {
      ...defaultMockUser,
      branchId: '',
    };
    renderPage(noBranchUser);

    fireEvent.click(await screen.findByTestId('purchase-requests-create'));
    fireEvent.change(screen.getByTestId('purchase-requests-item-sku-0'), {
      target: { value: 'SKU-X' },
    });
    fireEvent.click(screen.getByTestId('purchase-requests-create-submit'));

    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-requests-create-error'),
      ).toHaveTextContent(/No branch context/i);
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('displays the summary stats derived from real status data', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: purchaseRequestFixture,
    });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByTestId('purchase-requests-stat-pending'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('purchase-requests-stat-pending'),
    ).toHaveTextContent('1');
    expect(
      screen.getByTestId('purchase-requests-stat-approved'),
    ).toHaveTextContent('1');
    expect(
      screen.getByTestId('purchase-requests-stat-rejected'),
    ).toHaveTextContent('1');
  });

  it('adds and removes item rows in the create form', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [] });
    renderPage();
    fireEvent.click(await screen.findByTestId('purchase-requests-create'));

    expect(
      screen.queryByTestId('purchase-requests-item-row-1'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('purchase-requests-add-item'));
    expect(
      screen.getByTestId('purchase-requests-item-row-1'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('purchase-requests-item-remove-1'));
    expect(
      screen.queryByTestId('purchase-requests-item-row-1'),
    ).not.toBeInTheDocument();
  });
});
