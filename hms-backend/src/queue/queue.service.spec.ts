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
              findMany: jest.fn(),
            },
            queueEntry: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
            encounter: {
              findMany: jest.fn(),
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

  it('should reject completeEntry when queue entry does not exist', async () => {
    prisma.queueEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.completeEntry(tenantId, entryId),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.queueEntry.update).not.toHaveBeenCalled();
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
        service.joinQueue(tenantId, branchId, makeDto()),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.queueEntry.create).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('should allow join when patientId belongs to the same tenant', async () => {
      prisma.patient.findFirst.mockResolvedValue({ ...makePatient(), firstName: 'Walk-in', lastName: 'Patient' });
      prisma.queueEntry.count.mockResolvedValue(0);
      prisma.queueEntry.create.mockResolvedValue(makeCreatedEntry());

      const result = await service.joinQueue(
        tenantId,
        branchId,
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
        firstName: 'Walk-in',
        lastName: 'Patient',
      });
      prisma.queueEntry.count.mockResolvedValue(0);
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

      await service.joinQueue(tenantId, branchId, makeDto());

      expect(audit.log).toHaveBeenCalledTimes(1);
      const [call] = audit.log.mock.calls;
      expect(call[0].eventKey).toBe('QUEUE_ENTRY_CREATED');
      expect(call[0].tenantId).toBe(tenantId);
      expect(call[0].recordType).toBe('QueueEntry');
      expect(call[0].recordId).toBe('queue-new');
    });
  });

  describe('listActiveQueue', () => {
    it('should return filtered entries for a branch', async () => {
      prisma.queueEntry.findMany.mockResolvedValue([]);

      await service.listActiveQueue(tenantId, branchId);

      expect(prisma.queueEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          }),
        }),
      );
    });
  });
});
