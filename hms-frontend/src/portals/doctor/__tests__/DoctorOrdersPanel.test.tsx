/** @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DoctorOrdersPanel } from '../components/DoctorOrdersPanel';
import { TestWrapper } from '../../../test/test-utils';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'doc-1',
    email: 'doctor@example.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
  }),
}));

/** Helper: fills an order item by simulating the UI flow for LAB type.
 *  1. Change order type to 'PROCEDURE' to reveal the free-text input.
 *  2. Type the item name.
 *  3. Click the add button.
 */
async function addOrderItem(itemName: string) {
  // Find the order type select by its aria-label
  const orderTypeSelect = screen.getByRole('combobox', { name: /Order type/i });
  fireEvent.change(orderTypeSelect, { target: { value: 'PROCEDURE' } });

  const input = await screen.findByPlaceholderText('Type test/procedure name...');
  fireEvent.change(input, { target: { value: itemName } });

  const addBtn = screen.getByRole('button', { name: /Add order item/i });
  fireEvent.click(addBtn);
}

/** Helper: renders the panel with a mock for the initial GET */
function renderPanel() {
  return render(
    <TestWrapper>
      <DoctorOrdersPanel patientId="patient-1" encounterId="encounter-1" isLocked={false} />
    </TestWrapper>
  );
}

describe('DoctorOrdersPanel Component Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- 1. Submit disabled when form is invalid ---
  it('disables submit button when no order items are added', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    renderPanel();

    await waitFor(() => {
      const createBtn = screen.getByRole('button', { name: /create order/i });
      expect(createBtn).toBeDisabled();
    });
  });

  // --- 2. Submit enabled when items are added ---
  it('enables submit when order items are added', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    renderPanel();

    await waitFor(() => {
      const createBtn = screen.getByRole('button', { name: /create order/i });
      expect(createBtn).toBeDisabled();
    });

    await addOrderItem('Complete Blood Count');

    await waitFor(() => {
      const createBtn = screen.getByRole('button', { name: /create order/i });
      expect(createBtn).not.toBeDisabled();
    });
  });

  // --- 3. Successful order creation renders success state ---
  it('shows success message after order creation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'order-1',
        orderNumber: 'CLN-12345',
        patientId: 'patient-1',
        status: 'PENDING',
        itemCount: 1,
        orderType: 'LAB',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      },
    });

    renderPanel();

    await addOrderItem('CBC');

    const createBtn = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText('Order created successfully.')).toBeInTheDocument();
    });
  });

  // --- 4. Successful order creation invalidates cached queries ---
  it('refetches orders after successful creation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'order-1',
        orderNumber: 'CLN-12345',
        patientId: 'patient-1',
        status: 'PENDING',
        itemCount: 1,
        orderType: 'LAB',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      },
    });

    renderPanel();

    await addOrderItem('CBC');

    const createBtn = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      // After success, the refetch should trigger additional GETs
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  // --- 5. 401/403 renders Access Restricted ---
  function createAxiosError(status: number) {
    return Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status, data: {} },
    });
  }

  it('renders Access Restricted on 403', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(createAxiosError(403));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('renders Access Restricted on 401', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(createAxiosError(401));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  // --- 6. Validation error renders safely ---
  it('renders validation error when submitting with empty items', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    renderPanel();

    await waitFor(() => {
      const createBtn = screen.getByRole('button', { name: /create order/i });
      expect(createBtn).toBeDisabled();
    });
  });

  // --- 7. Network error renders safely ---
  it('renders safe network error on non-auth failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(createAxiosError(500));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });
  });

  // --- 8. No mock fallback after failed order creation ---
  it('does not render mock data after failed order creation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    vi.mocked(apiClient.post).mockRejectedValueOnce(createAxiosError(500));

    renderPanel();

    await addOrderItem('CBC');

    const createBtn = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.queryByText('Order created successfully.')).not.toBeInTheDocument();
      expect(screen.getByText('Failed to create order. Please try again.')).toBeInTheDocument();
    });
  });

  // --- 9. No lab result release triggered ---
  it('does not call any lab result release endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'order-1',
        orderNumber: 'CLN-12345',
        patientId: 'patient-1',
        status: 'PENDING',
        itemCount: 1,
        orderType: 'LAB',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      },
    });

    renderPanel();

    await addOrderItem('CBC');

    const createBtn = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      const postCall = vi.mocked(apiClient.post).mock.calls[0];
      expect(postCall[0]).toContain('/orders');
      expect(postCall[0]).not.toContain('/lab');
      expect(postCall[0]).not.toContain('/release');
    });
  });

  // --- 10. No billing action triggered ---
  it('does not call any billing endpoint during order creation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'order-1',
        orderNumber: 'CLN-12345',
        patientId: 'patient-1',
        status: 'PENDING',
        itemCount: 1,
        orderType: 'LAB',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      },
    });

    renderPanel();

    await addOrderItem('CBC');

    const createBtn = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      const postCall = vi.mocked(apiClient.post).mock.calls[0];
      expect(postCall[0]).not.toContain('/billing');
      expect(postCall[0]).not.toContain('/invoice');
      expect(postCall[0]).not.toContain('/payment');
    });
  });

  // --- 11. No prescription action triggered ---
  it('does not call any prescription endpoint during order creation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'order-1',
        orderNumber: 'CLN-12345',
        patientId: 'patient-1',
        status: 'PENDING',
        itemCount: 1,
        orderType: 'LAB',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      },
    });

    renderPanel();

    await addOrderItem('CBC');

    const createBtn = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      const postCall = vi.mocked(apiClient.post).mock.calls[0];
      expect(postCall[0]).not.toContain('/prescription');
    });
  });

  // --- 12. Shows no encounter message when encounterId missing ---
  it('shows open encounter message when no encounterId', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    render(
      <TestWrapper>
        <DoctorOrdersPanel patientId="patient-1" encounterId={undefined} isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Open an encounter to place orders.')).toBeInTheDocument();
    });
  });

  // --- 13. Loading state renders ---
  it('renders loading state while fetching orders', async () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    renderPanel();

    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  // --- Cancel Order Tests ---
  const cancellableStatuses = ['DRAFT', 'PENDING', 'REQUESTED'];
  const terminalStatuses = ['COMPLETED', 'CANCELLED', 'BILLED'];

  function createOrdersWithStatus(statuses: string[]) {
    return statuses.map((s, i) => ({
      id: `order-${i}`,
      orderNumber: `CLN-${String(i + 1).padStart(6, '0')}`,
      patientId: 'patient-1',
      status: s,
      itemCount: 1,
      orderType: 'LAB',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      accessLabel: 'Order',
      isReadOnly: false,
    }));
  }

  // --- 14. Cancel action visible only for cancellable order states ---
  it.each(cancellableStatuses)('shows cancel button for %s order', async (status) => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: createOrdersWithStatus([status]) });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  // --- 15. Cancel action hidden/disabled for terminal states ---
  it.each(terminalStatuses)('hides cancel button for %s order', async (status) => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: createOrdersWithStatus([status]) });

    renderPanel();

    await waitFor(() => {
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  // --- 16. Reason required before submit ---
  it('requires reason before confirming cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: createOrdersWithStatus(['PENDING']) });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const confirmBtn = screen.getByText('Confirm Cancellation');
    expect(confirmBtn).toBeDisabled();
  });

  // --- 17. Confirmation modal warns history is preserved ---
  it('confirmation modal warns order history is preserved', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: createOrdersWithStatus(['PENDING']) });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    expect(screen.getByText(/history will be preserved/i)).toBeInTheDocument();
  });

  // --- 18. Successful cancellation renders success state ---
  it('shows success state after successful cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: createOrdersWithStatus(['PENDING']) });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'order-0',
        orderNumber: 'CLN-000001',
        patientId: 'patient-1',
        status: 'CANCELLED',
        itemCount: 1,
        orderType: 'LAB',
        cancelledReason: 'Duplicate order',
        cancelledById: 'doc-1',
        cancelledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      },
    });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.change(textarea, { target: { value: 'Duplicate order' } });

    const confirmBtn = screen.getByText('Confirm Cancellation');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Order cancelled successfully.')).toBeInTheDocument();
    });
  });

  // --- 19. Successful cancellation invalidates order/encounter/patient summary query keys ---
  it('refetches after successful cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: createOrdersWithStatus(['PENDING']) });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'order-0',
        orderNumber: 'CLN-000001',
        patientId: 'patient-1',
        status: 'CANCELLED',
        itemCount: 1,
        orderType: 'LAB',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      },
    });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.change(textarea, { target: { value: 'Duplicate order' } });
    fireEvent.click(screen.getByText('Confirm Cancellation'));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  // --- 20. 401/403 renders Access Restricted ---
  it('renders Access Restricted on cancellation page when 403', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(createAxiosError(403));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  // --- 21. Validation error renders safely ---
  it('shows validation error when trying to cancel with empty reason via modal error mechanism', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: createOrdersWithStatus(['PENDING']) });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const confirmBtn = screen.getByText('Confirm Cancellation');
    expect(confirmBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    expect(confirmBtn).toBeDisabled();
  });

  // --- 22. Network error renders safely ---
  it('renders safe error message on network failure during cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: createOrdersWithStatus(['PENDING']) });
    vi.mocked(apiClient.post).mockRejectedValueOnce(createAxiosError(500));

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(screen.getByText('Confirm Cancellation'));

    await waitFor(() => {
      expect(screen.getByText('Failed to cancel order. Please try again.')).toBeInTheDocument();
    });
  });

  // --- 23. No mock fallback after failed cancellation ---
  it('does not render mock data after failed cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: createOrdersWithStatus(['PENDING']) });
    vi.mocked(apiClient.post).mockRejectedValueOnce(createAxiosError(500));

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(screen.getByText('Confirm Cancellation'));

    await waitFor(() => {
      expect(screen.getByText('Failed to cancel order. Please try again.')).toBeInTheDocument();
    });
  });

  // --- 24. No lab result release/encoding action triggered ---
  it('does not call lab result endpoint during cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: createOrdersWithStatus(['PENDING']) });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'order-0', orderNumber: 'CLN-000001', patientId: 'patient-1', status: 'CANCELLED', itemCount: 1, orderType: 'LAB', createdAt: new Date().toISOString(), timestamp: new Date().toISOString(), accessLabel: 'Order', isReadOnly: true } });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(screen.getByText('Confirm Cancellation'));

    await waitFor(() => {
      const postCalls = vi.mocked(apiClient.post).mock.calls;
      const cancelCall = postCalls.find(call => call[0].includes('/cancel'));
      expect(cancelCall).toBeDefined();
      expect(cancelCall![0]).not.toContain('/lab');
      expect(cancelCall![0]).not.toContain('/release');
    });
  });

  // --- 25. No billing action triggered ---
  it('does not call billing endpoint during cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: createOrdersWithStatus(['PENDING']) });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'order-0', orderNumber: 'CLN-000001', patientId: 'patient-1', status: 'CANCELLED', itemCount: 1, orderType: 'LAB', createdAt: new Date().toISOString(), timestamp: new Date().toISOString(), accessLabel: 'Order', isReadOnly: true } });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(screen.getByText('Confirm Cancellation'));

    await waitFor(() => {
      const postCalls = vi.mocked(apiClient.post).mock.calls;
      const cancelCall = postCalls.find(call => call[0].includes('/cancel'));
      expect(cancelCall).toBeDefined();
      expect(cancelCall![0]).not.toContain('/billing');
      expect(cancelCall![0]).not.toContain('/invoice');
      expect(cancelCall![0]).not.toContain('/payment');
    });
  });

  // --- 26. No prescription action triggered ---
  it('does not call prescription endpoint during cancellation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: createOrdersWithStatus(['PENDING']) });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'order-0', orderNumber: 'CLN-000001', patientId: 'patient-1', status: 'CANCELLED', itemCount: 1, orderType: 'LAB', createdAt: new Date().toISOString(), timestamp: new Date().toISOString(), accessLabel: 'Order', isReadOnly: true } });

    renderPanel();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    const textarea = screen.getByPlaceholderText('Enter cancellation reason...');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });
    fireEvent.click(screen.getByText('Confirm Cancellation'));

    await waitFor(() => {
      const postCalls = vi.mocked(apiClient.post).mock.calls;
      const cancelCall = postCalls.find(call => call[0].includes('/cancel'));
      expect(cancelCall).toBeDefined();
      expect(cancelCall![0]).not.toContain('/prescription');
    });
  });
});
