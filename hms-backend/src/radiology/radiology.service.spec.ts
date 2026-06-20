import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT_KEYS } from '../audit/audit-event-keys';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { RadiologyService } from './radiology.service';

describe('RadiologyService', () => {
  let service: RadiologyService;
  let prisma: {
    order: { findMany: jest.Mock; findFirst: jest.Mock };
    $transaction: jest.Mock;
    radiologyReport: { create: jest.Mock };
  };
  let audit: { log: jest.Mock };

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
      order: { findMany: jest.fn(), findFirst: jest.fn() },
      radiologyReport: { create: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: typeof prisma) => unknown) =>
        cb(prisma),
      ),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RadiologyService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
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
        radiologyReport: null,
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

  it('maps finalized radiology reports to FINALIZED phase with interpretation', async () => {
    const requestedAt = new Date('2026-06-01T10:00:00.000Z');
    const finalizedAt = new Date('2026-06-02T12:00:00.000Z');
    prisma.order.findMany.mockResolvedValueOnce([
      {
        id: 'order-2',
        orderNumber: 'IMG-1002',
        priority: 'ROUTINE',
        requestedAt,
        createdAt: requestedAt,
        clinicalIndication: null,
        patient: { firstName: 'John', lastName: 'Smith' },
        clinicalItems: [{ itemName: 'CT Abdomen' }],
        radiologyReport: {
          interpretation: 'No acute findings.',
          status: 'FINALIZED',
          finalizedAt,
        },
      },
    ]);

    const result = await service.listImagingOrders(branchActor);

    expect(result[0]).toEqual(
      expect.objectContaining({
        phase: 'FINALIZED',
        interpretation: 'No acute findings.',
        finalizedAt: finalizedAt.toISOString(),
      }),
    );
  });

  it('returns empty array when no IMAGING orders exist', async () => {
    prisma.order.findMany.mockResolvedValueOnce([]);
    await expect(service.listImagingOrders(branchActor)).resolves.toEqual([]);
  });

  describe('finalizeReport', () => {
    const orderId = 'order-1';
    const finalizedAt = new Date('2026-06-03T09:00:00.000Z');

    it('persists interpretation and emits audit event for scoped IMAGING order', async () => {
      prisma.order.findFirst.mockResolvedValueOnce({
        id: orderId,
        branchId: 'branch-1',
        radiologyReport: null,
      });
      prisma.radiologyReport.create.mockResolvedValueOnce({
        id: 'report-1',
        orderId,
        interpretation: 'Mild cardiomegaly.',
        status: 'FINALIZED',
        finalizedAt,
      });

      const result = await service.finalizeReport(branchActor, orderId, {
        interpretation: 'Mild cardiomegaly.',
      });

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: orderId,
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            orderType: 'IMAGING',
          }),
        }),
      );
      expect(prisma.radiologyReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          orderId,
          interpretation: 'Mild cardiomegaly.',
          status: 'FINALIZED',
          finalizedById: 'user-1',
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: AUDIT_EVENT_KEYS.RADIOLOGY_REPORT_FINALIZED,
          recordType: 'RadiologyReport',
          recordId: 'report-1',
        }),
        prisma,
        'branch-1',
      );
      expect(result).toEqual({
        id: 'report-1',
        orderId,
        interpretation: 'Mild cardiomegaly.',
        status: 'FINALIZED',
        finalizedAt: finalizedAt.toISOString(),
      });
    });

    it('throws NotFoundException when order is out of scope', async () => {
      prisma.order.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.finalizeReport(branchActor, orderId, {
          interpretation: 'Clear lungs.',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when report already exists', async () => {
      prisma.order.findFirst.mockResolvedValueOnce({
        id: orderId,
        branchId: 'branch-1',
        radiologyReport: { id: 'existing-report' },
      });

      await expect(
        service.finalizeReport(branchActor, orderId, {
          interpretation: 'Clear lungs.',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
