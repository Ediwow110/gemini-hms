import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService } from './numbering.service';

describe('NumberingService', () => {
  let service: NumberingService;
  let prisma: any;

  beforeEach(async () => {
    const sequenceStore: any[] = [];

    prisma = {
      numberingSequence: {
        findFirst: jest.fn(async ({ where }: any) => {
          return (
            sequenceStore.find(
              (s) =>
                s.tenantId === where.tenantId &&
                s.branchId === where.branchId &&
                s.entityType === where.entityType,
            ) ?? null
          );
        }),
        create: jest.fn(async ({ data }: any) => {
          const exists = sequenceStore.some(
            (s) =>
              s.tenantId === data.tenantId &&
              s.branchId === data.branchId &&
              s.entityType === data.entityType,
          );
          if (exists) {
            const e: any = new Error('Unique constraint failed');
            e.code = 'P2002';
            throw e;
          }
          const row = { id: `seq-${sequenceStore.length + 1}`, ...data };
          sequenceStore.push(row);
          return { id: row.id, currentVal: row.currentVal };
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = sequenceStore.find((s) => s.id === where.id);
          if (!row) throw new Error('not found');
          if (
            typeof data.currentVal === 'object' &&
            data.currentVal?.increment
          ) {
            row.currentVal += data.currentVal.increment;
          } else {
            row.currentVal = data.currentVal;
          }
          return { currentVal: row.currentVal };
        }),
      },
      $transaction: jest.fn(async (cb: any) => {
        const txClient = {
          numberingSequence: {
            findFirst: prisma.numberingSequence.findFirst,
            create: prisma.numberingSequence.create,
            update: prisma.numberingSequence.update,
          },
        };
        return cb(txClient);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NumberingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NumberingService>(NumberingService);
  });

  describe('generateNumber — PATIENT with branchId undefined', () => {
    it('returns PT-000001 when no sequence row exists yet', async () => {
      prisma.numberingSequence.findFirst.mockResolvedValue(null);
      prisma.numberingSequence.create.mockResolvedValue({
        currentVal: 1,
      });

      const result = await service.generateNumber(
        'tenant-1',
        'PATIENT',
        undefined,
      );

      expect(result).toBe('PT-000001');

      expect(prisma.numberingSequence.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          branchId: null,
          entityType: 'PATIENT',
        },
        select: { id: true, currentVal: true },
      });

      expect(prisma.numberingSequence.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          branchId: null,
          entityType: 'PATIENT',
          prefix: 'PT-',
          currentVal: 1,
          padding: 6,
        },
        select: { currentVal: true },
      });
    });

    it('uses findFirst + update path when sequence already exists (no upsert, no null-branchId in compound unique input)', async () => {
      prisma.numberingSequence.findFirst.mockResolvedValue({
        id: 'seq-1',
        currentVal: 5,
      });
      prisma.numberingSequence.update.mockResolvedValue({ currentVal: 6 });

      const result = await service.generateNumber(
        'tenant-1',
        'PATIENT',
        undefined,
      );

      expect(result).toBe('PT-000006');
      expect(prisma.numberingSequence.create).not.toHaveBeenCalled();
      expect(prisma.numberingSequence.update).toHaveBeenCalledWith({
        where: { id: 'seq-1' },
        data: { currentVal: { increment: 1 } },
        select: { currentVal: true },
      });
    });

    it('retries the increment when a concurrent create raises P2002', async () => {
      const p2002 = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });

      prisma.numberingSequence.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'seq-concurrent' });
      prisma.numberingSequence.create.mockRejectedValueOnce(p2002);
      prisma.numberingSequence.update.mockResolvedValue({ currentVal: 3 });

      const result = await service.generateNumber(
        'tenant-1',
        'PATIENT',
        undefined,
      );

      expect(result).toBe('PT-000003');
      expect(prisma.numberingSequence.create).toHaveBeenCalledTimes(1);
      expect(prisma.numberingSequence.update).toHaveBeenCalledWith({
        where: { id: 'seq-concurrent' },
        data: { currentVal: { increment: 1 } },
        select: { currentVal: true },
      });
    });

    it('rethrows non-P2002 errors from create', async () => {
      const other = new Error('Disk full');
      prisma.numberingSequence.findFirst.mockResolvedValue(null);
      prisma.numberingSequence.create.mockRejectedValueOnce(other);

      await expect(
        service.generateNumber('tenant-1', 'PATIENT', undefined),
      ).rejects.toThrow('Disk full');
    });
  });

  describe('generateNumber — with branchId provided', () => {
    it('scopes the sequence by branchId and does not collapse into the null-branch sequence', async () => {
      prisma.numberingSequence.findFirst.mockResolvedValue(null);
      prisma.numberingSequence.create.mockResolvedValue({ currentVal: 1 });

      const result = await service.generateNumber(
        'tenant-1',
        'PATIENT',
        'branch-99',
      );

      expect(result).toBe('PT-000001');

      expect(prisma.numberingSequence.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          branchId: 'branch-99',
          entityType: 'PATIENT',
        },
        select: { id: true, currentVal: true },
      });

      expect(prisma.numberingSequence.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          branchId: 'branch-99',
          entityType: 'PATIENT',
          prefix: 'PT-',
          currentVal: 1,
          padding: 6,
        },
        select: { currentVal: true },
      });
    });
  });

  describe('generateNumber — non-default entity types', () => {
    it('uses the configured prefix/padding for INVOICE', async () => {
      prisma.numberingSequence.findFirst.mockResolvedValue({
        id: 'seq-inv',
        currentVal: 41,
      });
      prisma.numberingSequence.update.mockResolvedValue({ currentVal: 42 });

      const result = await service.generateNumber(
        'tenant-1',
        'INVOICE',
        'branch-1',
      );

      expect(result).toBe('INV-000042');
    });

    it('uses the default prefix for unknown entity types', async () => {
      prisma.numberingSequence.findFirst.mockResolvedValue(null);
      prisma.numberingSequence.create.mockResolvedValue({ currentVal: 1 });

      const result = await service.generateNumber(
        'tenant-1',
        'CUSTOM_THING',
        undefined,
      );

      expect(result).toBe('CUSTOM_THING-000001');
      expect(prisma.numberingSequence.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            prefix: 'CUSTOM_THING-',
            padding: 6,
          }),
        }),
      );
    });
  });

  describe('generateNumber — transaction client passthrough', () => {
    it('uses the provided transaction client and does not start a new transaction', async () => {
      const txClient = {
        numberingSequence: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'seq-tx',
            currentVal: 9,
          }),
          create: jest.fn(),
          update: jest.fn().mockResolvedValue({ currentVal: 10 }),
        },
      };

      const result = await service.generateNumber(
        'tenant-1',
        'PATIENT',
        undefined,
        txClient,
      );

      expect(result).toBe('PT-000010');
      expect(txClient.numberingSequence.findFirst).toHaveBeenCalled();
      expect(txClient.numberingSequence.update).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
