import { Test, TestingModule } from '@nestjs/testing';
import { LabService } from './lab.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { Prisma } from '@prisma/client';

describe('LabService Audit Coupling (Batch 8)', () => {
  let service: LabService;
  let prisma: any;
  let audit: any;

  const tenantId = 't1';
  const branchId = 'b1';
  const userId = 'u1';
  const labResultId = 'lr1';

  beforeEach(async () => {
    const prismaMock = {
      labResult: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      labResultVersion: {
        count: jest.fn(),
        create: jest.fn(),
      },
      labResultSignature: {
        create: jest.fn(),
      },
      order: {
        update: jest.fn(),
      },
      notificationOutbox: {
        create: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (cb) => await cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: ApprovalsService, useValue: {} },
      ],
    }).compile();

    service = module.get<LabService>(LabService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  it('should pass tx and branchId to audit.log in applyAmendment', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      id: labResultId,
      status: 'RELEASED',
      results: {},
      order: { tenantId, branchId },
    });
    prisma.labResultVersion.count.mockResolvedValue(0);
    prisma.labResultVersion.create.mockResolvedValue({ id: 'v1' });
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });

    await service.applyAmendment(
      tenantId,
      userId,
      branchId,
      labResultId,
      'reason',
    );

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'RESULT_AMENDMENT_APPLIED' }),
      expect.anything(), // tx
      branchId,
    );
  });

  it('should pass tx and branchId to audit.log in releaseResult', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      id: labResultId,
      status: 'APPROVED',
      orderId: 'order-1',
      order: { tenantId, branchId, patientId: 'patient-1' },
      lockedAt: new Date(),
    });
    prisma.labResult.update.mockResolvedValue({
      id: labResultId,
      status: 'RELEASED',
      lockedAt: new Date(),
    });
    prisma.labResultSignature.create.mockResolvedValue({ id: 'sig-1' });
    prisma.order.update.mockResolvedValue({ id: 'order-1' });
    prisma.notificationOutbox.create.mockResolvedValue({ id: 'notif-1' });

    await service.releaseResult(tenantId, userId, branchId, labResultId);

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'LAB_RESULT_RELEASED' }),
      expect.anything(), // tx
      branchId,
    );
  });
});
