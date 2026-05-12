// QueueService cross-branch write isolation test
import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('QueueService write isolation', () => {
  let service: QueueService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: {
            queueEntry: {
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    prisma = module.get<PrismaService>(PrismaService);
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
});
