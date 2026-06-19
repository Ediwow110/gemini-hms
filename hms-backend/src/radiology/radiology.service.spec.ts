import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { RadiologyService } from './radiology.service';

describe('RadiologyService', () => {
  let service: RadiologyService;
  let prisma: { order: { findMany: jest.Mock } };

  const branchActor: RequestUser = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
    tokenVersion: 0,
  };

  const superAdminActor: RequestUser = {
    userId: 'admin-1',
    tenantId: 'tenant-1',
    roles: ['Super Admin'],
    tokenVersion: 0,
  };

  beforeEach(async () => {
    prisma = {
      order: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RadiologyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RadiologyService>(RadiologyService);
  });

  it('scopes IMAGING orders to tenant and branch for non-Super-Admin actors', async () => {
    prisma.order.findMany.mockResolvedValueOnce([]);

    await service.listImagingOrders(branchActor);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          orderType: 'IMAGING',
          branchId: 'branch-1',
          status: { notIn: ['CANCELLED'] },
        }),
      }),
    );
  });

  it('does not branch-scope for Super Admin', async () => {
    prisma.order.findMany.mockResolvedValueOnce([]);

    await service.listImagingOrders(superAdminActor);

    const call = prisma.order.findMany.mock.calls[0][0];
    expect(call.where.tenantId).toBe('tenant-1');
    expect(call.where.branchId).toBeUndefined();
  });

  it('maps clinical IMAGING orders to radiology worklist DTOs with PENDING phase', async () => {
    const requestedAt = new Date('2026-06-01T10:00:00.000Z');
    prisma.order.findMany.mockResolvedValueOnce([
      {
        id: 'order-1',
        orderNumber: 'IMG-1001',
        priority: 'STAT',
        requestedAt,
        createdAt: requestedAt,
        clinicalIndication: 'Chest pain',
        patient: { firstName: 'Jane', lastName: 'Doe' },
        clinicalItems: [{ itemName: 'Chest X-Ray PA' }],
      },
    ]);

    const result = await service.listImagingOrders(branchActor);

    expect(result).toEqual([
      {
        id: 'order-1',
        orderNumber: 'IMG-1001',
        patientName: 'Jane Doe',
        procedure: 'Chest X-Ray PA',
        priority: 'STAT',
        phase: 'PENDING',
        requestedAt: requestedAt.toISOString(),
      },
    ]);
  });

  it('returns empty array when no IMAGING orders exist', async () => {
    prisma.order.findMany.mockResolvedValueOnce([]);
    await expect(service.listImagingOrders(branchActor)).resolves.toEqual([]);
  });
});