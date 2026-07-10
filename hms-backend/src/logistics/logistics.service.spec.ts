import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeliveryJobStatus } from '@prisma/client';
import { LogisticsService } from './logistics.service';

describe('LogisticsService branch and delivery contracts', () => {
  const prisma = {
    salesOrder: { findFirst: jest.fn(), update: jest.fn() },
    shipment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    deliveryJob: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    installationJob: { findMany: jest.fn() },
    user: { findFirst: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = { log: jest.fn() };
  let service: LogisticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(prisma),
    );
    service = new LogisticsService(prisma as any, audit as any);
  });

  it('filters shipment lists through the selected RFQ branch', async () => {
    prisma.shipment.findMany.mockResolvedValue([]);

    await service.findAllShipments('tenant-1', 'branch-1');

    expect(prisma.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          salesOrder: { quote: { rfq: { branchId: 'branch-1' } } },
        },
      }),
    );
  });

  it('returns only active Field Technicians assigned to the selected branch', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await service.findEligibleTechnicians('tenant-1', 'branch-1');

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          userBranches: { some: { branchId: 'branch-1', isActive: true } },
          userRoles: {
            some: {
              status: 'ACTIVE',
              role: expect.objectContaining({
                name: 'Field Technician',
                tenantId: 'tenant-1',
              }),
            },
          },
        }),
      }),
    );
  });

  it('creates a delivery job using the backend DTO and records branch audit context', async () => {
    prisma.shipment.findFirst.mockResolvedValue({ id: 'shipment-1' });
    prisma.user.findFirst.mockResolvedValue({ id: 'tech-1' });
    prisma.deliveryJob.findFirst.mockResolvedValue(null);
    prisma.deliveryJob.create.mockResolvedValue({
      id: 'job-1',
      tenantId: 'tenant-1',
      shipmentId: 'shipment-1',
      assignedUserId: 'tech-1',
      status: DeliveryJobStatus.ASSIGNED,
    });

    const result = await service.createDeliveryJob(
      'tenant-1',
      'branch-1',
      'admin-1',
      {
        shipmentId: 'shipment-1',
        assignedUserId: 'tech-1',
        notes: 'Call receiving desk',
      },
    );

    expect(prisma.deliveryJob.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        shipmentId: 'shipment-1',
        assignedUserId: 'tech-1',
        status: DeliveryJobStatus.ASSIGNED,
        notes: 'Call receiving desk',
      },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: 'job-1' }),
      undefined,
      'branch-1',
    );
    expect(result.id).toBe('job-1');
  });

  it('rejects a technician outside the selected branch', async () => {
    prisma.shipment.findFirst.mockResolvedValue({ id: 'shipment-1' });
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.createDeliveryJob('tenant-1', 'branch-1', 'admin-1', {
        shipmentId: 'shipment-1',
        assignedUserId: 'tech-other-branch',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.deliveryJob.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate active delivery job for the same shipment', async () => {
    prisma.shipment.findFirst.mockResolvedValue({ id: 'shipment-1' });
    prisma.user.findFirst.mockResolvedValue({ id: 'tech-1' });
    prisma.deliveryJob.findFirst.mockResolvedValue({ id: 'existing-job' });

    await expect(
      service.createDeliveryJob('tenant-1', 'branch-1', 'admin-1', {
        shipmentId: 'shipment-1',
        assignedUserId: 'tech-1',
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.deliveryJob.create).not.toHaveBeenCalled();
  });

  it('maps technician jobs to real RFQ and branch labels instead of placeholders', async () => {
    prisma.deliveryJob.findMany.mockResolvedValue([
      {
        id: 'delivery-1',
        status: DeliveryJobStatus.ASSIGNED,
        shipmentId: 'shipment-1',
        shipment: {
          salesOrderId: 'order-1',
          salesOrder: {
            quote: {
              rfq: {
                title: 'MRI replacement request',
                branch: { name: 'North Campus' },
              },
            },
          },
        },
      },
    ]);
    prisma.installationJob.findMany.mockResolvedValue([]);

    const result = await service.findTechnicianJobs(
      'tenant-1',
      'branch-1',
      'tech-1',
    );

    expect(result.deliveries[0]).toMatchObject({
      customer: 'MRI replacement request',
      address: 'North Campus',
    });
    expect(JSON.stringify(result)).not.toContain('Radiology Dept');
  });
});
