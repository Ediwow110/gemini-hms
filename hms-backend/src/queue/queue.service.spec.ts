// QueueService cross-branch write isolation test
import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('QueueService write isolation', () => {
  let service: QueueService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: {
            patient: {
              findFirst: jest.fn(),
            },
            queueEntry: {
              findFirst: jest.fn(),
              create: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: NumberingService,
          useValue: {
            generateNumber: jest.fn().mockResolvedValue('Q-001'),
          },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditService);
  });

  const tenantId = 'tenant-1';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const entryId = 'queue-123';

  it('should reject update when queue entry belongs to another branch', async () => {
    // Simulate entry belonging to a different branch
    prisma.queueEntry.findFirst.mockResolvedValue({
      id: entryId,
      tenantId,
      branchId: otherBranchId,
    });
    prisma.queueEntry.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateStatus(tenantId, 'user-1', branchId, entryId, {
        status: 'CALLING',
        counterNumber: 'C1',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.queueEntry.updateMany).toHaveBeenCalledWith({
      where: { id: entryId, tenantId, branchId },
      data: expect.any(Object),
    });
  });

  describe('joinQueue — patientId cross-tenant validation', () => {
    const makePatient = (overrides: Record<string, unknown> = {}) => ({
      id: 'patient-1',
      tenantId,
      status: 'ACTIVE',
      ...overrides,
    });

    const makeDto = (overrides: Record<string, unknown> = {}) => ({
      patientId: 'patient-1',
      patientName: 'Walk-in Patient',
      serviceType: 'RECEPTION',
      category: 'REGULAR',
      branchId,
      ...overrides,
    });

    const makeCreatedEntry = (overrides: Record<string, unknown> = {}) => ({
      id: 'queue-new',
      tenantId,
      branchId,
      patientId: 'patient-1',
      patientName: 'Walk-in Patient',
      queueNumber: 'R-001',
      serviceType: 'RECEPTION',
      category: 'REGULAR',
      status: 'WAITING',
      ...overrides,
    });

    it('should reject join when patientId belongs to a different tenant', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.joinQueue(tenantId, branchId, 'user-1', makeDto()),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.queueEntry.create).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('should allow join when patientId is omitted (walk-in without patient record)', async () => {
      prisma.queueEntry.create.mockResolvedValue(
        makeCreatedEntry({ patientId: null, patientName: 'Walk-in' }),
      );

      const result = await service.joinQueue(
        tenantId,
        branchId,
        'user-1',
        makeDto({ patientId: undefined, patientName: 'Walk-in' }),
      );

      expect(result.patientId).toBeNull();
      expect(prisma.patient.findFirst).not.toHaveBeenCalled();
    });

    it('should allow join when patientId belongs to the same tenant', async () => {
      prisma.patient.findFirst.mockResolvedValue(makePatient());
      prisma.queueEntry.create.mockResolvedValue(makeCreatedEntry());

      const result = await service.joinQueue(
        tenantId,
        branchId,
        'user-1',
        makeDto(),
      );

      expect(result.patientId).toBe('patient-1');
      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: 'patient-1', tenantId },
      });
    });
  });

  describe('joinQueue — audit log emission', () => {
    const makeDto = (overrides: Record<string, unknown> = {}) => ({
      patientId: 'patient-1',
      patientName: 'Walk-in Patient',
      serviceType: 'RECEPTION',
      category: 'REGULAR',
      branchId,
      ...overrides,
    });

    it('should write a QUEUE_ENTRY_CREATED audit log with the created entry', async () => {
      prisma.patient.findFirst.mockResolvedValue({
        id: 'patient-1',
        tenantId,
        status: 'ACTIVE',
      });
      prisma.queueEntry.create.mockResolvedValue({
        id: 'queue-new',
        tenantId,
        branchId,
        patientId: 'patient-1',
        patientName: 'Walk-in Patient',
        queueNumber: 'R-001',
        serviceType: 'RECEPTION',
        category: 'REGULAR',
        status: 'WAITING',
      });

      await service.joinQueue(tenantId, branchId, 'user-1', makeDto());

      expect(audit.log).toHaveBeenCalledTimes(1);
      const [call] = audit.log.mock.calls;
      expect(call[0].eventKey).toBe('QUEUE_ENTRY_CREATED');
      expect(call[0].tenantId).toBe(tenantId);
      expect(call[0].recordType).toBe('QueueEntry');
      expect(call[0].recordId).toBe('queue-new');
      expect(call[2]).toBe(branchId);
    });
  });
});
