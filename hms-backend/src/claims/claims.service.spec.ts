import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import type { RequestUser } from '../common/types/authenticated-request.type';

describe('ClaimsService', () => {
  let service: ClaimsService;
  let prisma: any;
  let audit: { log: jest.Mock };
  let numbering: { generateNumber: jest.Mock };

  const tenantId = 'tenant-1';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const userId = 'cashier-1';
  const claimId = 'claim-1';

  const branchUser: RequestUser = {
    userId,
    tenantId,
    branchId,
    roles: ['Cashier'],
  };

  const superAdminUser: RequestUser = {
    userId: 'super-admin-1',
    tenantId,
    roles: ['Super Admin'],
  };

  const baseInvoice = {
    id: 'invoice-1',
    tenantId,
    totalAmount: 250,
    order: {
      id: 'order-1',
      branchId,
      patientId: 'patient-1',
    },
  };

  const baseClaim = {
    id: claimId,
    tenantId,
    status: 'PENDING',
    amountClaimed: 250,
    amountApproved: null,
    remarks: null,
    invoice: {
      order: {
        branchId,
      },
    },
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      invoice: {
        findFirst: jest.fn(),
      },
      hmoPartner: {
        findFirst: jest.fn(),
      },
      claim: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };
    numbering = {
      generateNumber: jest.fn().mockResolvedValue('CLM-000001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NumberingService, useValue: numbering },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
  });

  describe('getClaims', () => {
    it('filters claim listings by invoice order branch for branch-scoped users', async () => {
      prisma.claim.findMany.mockResolvedValue([]);

      await service.getClaims(tenantId, branchUser);

      expect(prisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            invoice: { order: { branchId } },
          },
        }),
      );
    });

    it('omits branch filter for Super Admin claim listings', async () => {
      prisma.claim.findMany.mockResolvedValue([]);

      await service.getClaims(tenantId, superAdminUser);

      expect(prisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
        }),
      );
    });

    it('fails closed when branch-scoped user has no branch context', async () => {
      await expect(
        service.getClaims(tenantId, { ...branchUser, branchId: undefined }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createClaim', () => {
    const dto = {
      hmoPartnerId: 'hmo-1',
      invoiceId: 'invoice-1',
      loaNumber: 'LOA-1',
      amountClaimed: 250,
    };

    it('creates a claim using the server-side invoice total', async () => {
      prisma.invoice.findFirst.mockResolvedValue(baseInvoice);
      prisma.hmoPartner.findFirst.mockResolvedValue({
        id: 'hmo-1',
        tenantId,
        status: 'ACTIVE',
      });
      prisma.claim.create.mockResolvedValue({
        id: claimId,
        ...dto,
        amountClaimed: 250,
      });

      await service.createClaim(tenantId, branchUser, dto);

      expect(prisma.claim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceId: 'invoice-1',
            hmoPartnerId: 'hmo-1',
            amountClaimed: 250,
            status: 'PENDING',
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'CLAIM_CREATED' }),
        expect.anything(),
        branchId,
      );
    });

    it('rejects claim creation for a foreign-branch invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        ...baseInvoice,
        order: { ...baseInvoice.order, branchId: otherBranchId },
      });

      await expect(
        service.createClaim(tenantId, branchUser, dto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.hmoPartner.findFirst).not.toHaveBeenCalled();
      expect(prisma.claim.create).not.toHaveBeenCalled();
    });

    it('rejects foreign HMO partners', async () => {
      prisma.invoice.findFirst.mockResolvedValue(baseInvoice);
      prisma.hmoPartner.findFirst.mockResolvedValue(null);

      await expect(
        service.createClaim(tenantId, branchUser, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects client amounts that do not match invoice total', async () => {
      prisma.invoice.findFirst.mockResolvedValue(baseInvoice);
      prisma.hmoPartner.findFirst.mockResolvedValue({
        id: 'hmo-1',
        tenantId,
        status: 'ACTIVE',
      });

      await expect(
        service.createClaim(tenantId, branchUser, {
          ...dto,
          amountClaimed: 999,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.claim.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('rejects status updates for a foreign-branch claim', async () => {
      prisma.claim.findFirst.mockResolvedValue({
        ...baseClaim,
        invoice: { order: { branchId: otherBranchId } },
      });

      await expect(
        service.updateStatus(tenantId, branchUser, claimId, {
          status: 'SUBMITTED',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.claim.updateMany).not.toHaveBeenCalled();
    });

    it('rejects invalid claim status transitions', async () => {
      prisma.claim.findFirst.mockResolvedValue({
        ...baseClaim,
        status: 'PENDING',
      });

      await expect(
        service.updateStatus(tenantId, branchUser, claimId, {
          status: 'APPROVED',
          amountApproved: 100,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects invalid approved amounts', async () => {
      prisma.claim.findFirst.mockResolvedValue({
        ...baseClaim,
        status: 'SUBMITTED',
      });

      await expect(
        service.updateStatus(tenantId, branchUser, claimId, {
          status: 'APPROVED',
          amountApproved: 999,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates status for a valid transition', async () => {
      prisma.claim.findFirst
        .mockResolvedValueOnce({
          ...baseClaim,
          status: 'SUBMITTED',
        })
        .mockResolvedValueOnce({
          ...baseClaim,
          status: 'APPROVED',
          amountApproved: 200,
        });
      prisma.claim.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateStatus(tenantId, branchUser, claimId, {
        status: 'APPROVED',
        amountApproved: 200,
        remarks: 'approved',
      });

      expect(prisma.claim.updateMany).toHaveBeenCalledWith({
        where: { id: claimId, tenantId },
        data: {
          status: 'APPROVED',
          amountApproved: 200,
          remarks: 'approved',
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'CLAIM_APPROVED' }),
        undefined,
        branchId,
      );
      expect(result.status).toBe('APPROVED');
    });
  });
});
