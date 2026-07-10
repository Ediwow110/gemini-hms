import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DeliveryJobsAdminView from '../DeliveryJobsAdminView';
import { fieldServiceService } from '../../../../services/field-service.service';

vi.mock('../../../../services/field-service.service', () => ({
  fieldServiceService: {
    getShipments: vi.fn(),
    getEligibleTechnicians: vi.fn(),
    createDeliveryJob: vi.fn(),
    updateShipmentStatus: vi.fn(),
  },
}));

const shipment = {
  id: 'shipment-1',
  trackingNumber: 'TRK-100',
  status: 'PENDING' as const,
  salesOrder: {
    id: 'order-1',
    quote: {
      rfq: {
        title: 'MRI replacement request',
        branch: { id: 'branch-1', name: 'North Campus' },
      },
    },
  },
  deliveryJobs: [],
};

const technician = { id: 'tech-1', email: 'field.tech@hospital.test' };

const renderWritableView = () =>
  render(<DeliveryJobsAdminView canAssignJobs canUpdateShipment />);

describe('DeliveryJobsAdminView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fieldServiceService.getShipments).mockResolvedValue([shipment]);
    vi.mocked(fieldServiceService.getEligibleTechnicians).mockResolvedValue([
      technician,
    ]);
    vi.mocked(fieldServiceService.createDeliveryJob).mockResolvedValue(undefined);
    vi.mocked(fieldServiceService.updateShipmentStatus).mockResolvedValue(
      undefined,
    );
  });

  it('loads real branch shipment and eligible technician options', async () => {
    renderWritableView();

    expect(
      await screen.findByText('MRI replacement request'),
    ).toBeInTheDocument();
    expect(screen.getByText('North Campus')).toBeInTheDocument();
    expect(fieldServiceService.getEligibleTechnicians).toHaveBeenCalledTimes(1);
  });

  it('submits the backend CreateDeliveryJobDto instead of the obsolete customer/address DTO', async () => {
    renderWritableView();

    fireEvent.click(
      await screen.findByRole('button', { name: /Dispatch New Job/i }),
    );
    fireEvent.change(
      screen
        .getByText('Dispatch Notes (optional)')
        .closest('label')!
        .querySelector('textarea')!,
      { target: { value: 'Call receiving desk' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dispatch Job' }));

    await waitFor(() =>
      expect(fieldServiceService.createDeliveryJob).toHaveBeenCalledWith({
        shipmentId: 'shipment-1',
        assignedUserId: 'tech-1',
        notes: 'Call receiving desk',
      }),
    );
    const payload = vi.mocked(fieldServiceService.createDeliveryJob).mock
      .calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('customerOrderId');
    expect(payload).not.toHaveProperty('address');
    expect(payload).not.toHaveProperty('technicianId');
  });

  it('renders a read-only shipment view without calling assignment APIs', async () => {
    render(
      <DeliveryJobsAdminView
        canAssignJobs={false}
        canUpdateShipment={false}
      />,
    );

    expect(
      await screen.findByText('MRI replacement request'),
    ).toBeInTheDocument();
    expect(fieldServiceService.getEligibleTechnicians).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /Dispatch New Job/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
  });

  it('disables dispatch when no eligible technician exists', async () => {
    vi.mocked(fieldServiceService.getEligibleTechnicians).mockResolvedValue([]);
    renderWritableView();

    const button = await screen.findByRole('button', {
      name: /Dispatch New Job/i,
    });
    expect(button).toBeDisabled();
    expect(
      screen.getByText(/No active Field Technician is assigned/i),
    ).toBeInTheDocument();
  });
});
