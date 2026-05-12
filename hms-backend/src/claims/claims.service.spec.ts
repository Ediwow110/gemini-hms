// ClaimsService cross-tenant write isolation test
import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

describe('ClaimsService write isolation', () => {
  let service: ClaimsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        {
          provide: PrismaService,
          useValue: {
            claim: {
              findFirst: jest.fn(),
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
            generateNumber: jest.fn().mockResolvedValue('CLM-000001'),
          },
        },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const tenantId = 'tenant-1';
  const otherTenantId = 'tenant-2';
  const claimId = 'claim-123';

  it('should reject update when claim belongs to another tenant', async () => {
    prisma.claim.findFirst.mockResolvedValue({
      id: claimId,
      tenantId: otherTenantId,
    });
    prisma.claim.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateStatus(tenantId, 'user-1', claimId, {
        status: 'APPROVED',
        amountApproved: 100,
        remarks: 'ok',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.claim.updateMany).toHaveBeenCalledWith({
      where: { id: claimId, tenantId },
      data: expect.any(Object),
    });
  });
});
