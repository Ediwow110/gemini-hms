import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

describe('CashierService', () => {
  let service: CashierService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const userId = 'user-1';
  const branchId = 'branch-1';
  const sessionId = 'session-1';

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      cashierSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashierService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CashierService>(CashierService);
  });

  describe('openSession', () => {
    it('should open a new session transactionally with audit log', async () => {
      prisma.cashierSession.findFirst.mockResolvedValue(null);
      const created = { id: sessionId, status: 'OPEN', openingBalance: 100 };
      prisma.cashierSession.create.mockResolvedValue(created);

      const result = await service.openSession(tenantId, userId, branchId, {
        openingBalance: 100,
      });

      expect(result.status).toBe('OPEN');
      expect(prisma.cashierSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          branchId,
          userId,
          openingBalance: 100,
        }),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SESSION_OPENED' }),
        expect.objectContaining({ cashierSession: prisma.cashierSession }),
        branchId,
      );
    });

    it('should throw ConflictException if user already has open session', async () => {
      prisma.cashierSession.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.openSession(tenantId, userId, branchId, {
          openingBalance: 100,
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.cashierSession.create).not.toHaveBeenCalled();
    });

    it('should rollback if audit logging fails', async () => {
      prisma.cashierSession.findFirst.mockResolvedValue(null);
      prisma.cashierSession.create.mockResolvedValue({ id: sessionId });
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.openSession(tenantId, userId, branchId, {
          openingBalance: 100,
        }),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('closeSession', () => {
    it('should close session and calculate variance transactionally', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        openingBalance: new Prisma.Decimal(100),
        payments: [
          {
            amount: new Prisma.Decimal(50),
            paymentMethod: 'CASH',
            status: 'POSTED',
            reversals: [],
          },
        ],
      });

      const result = await service.closeSession(
        tenantId,
        userId,
        branchId,
        sessionId,
        {
          actualClosingBalance: 150,
          remarks: '',
        },
      );

      expect(result.variance).toBe(0);
      expect(result.expectedCash).toBe(150);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SESSION_CLOSED' }),
        expect.objectContaining({ cashierSession: prisma.cashierSession }),
        branchId,
      );
    });

    it('should throw BadRequestException if session not found or already closed', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.closeSession(tenantId, userId, branchId, sessionId, {
          actualClosingBalance: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require remarks when variance exists', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        openingBalance: new Prisma.Decimal(100),
        payments: [],
      });

      await expect(
        service.closeSession(tenantId, userId, branchId, sessionId, {
          actualClosingBalance: 120, // variance = 20
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback if audit logging fails during close', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        openingBalance: new Prisma.Decimal(100),
        payments: [],
      });
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.closeSession(tenantId, userId, branchId, sessionId, {
          actualClosingBalance: 100,
          remarks: 'Test',
        }),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('getActiveSession', () => {
    it('should return open session with payments', async () => {
      const mockSession = { id: sessionId, status: 'OPEN', payments: [] };
      prisma.cashierSession.findFirst.mockResolvedValue(mockSession);

      const result = await service.getActiveSession(tenantId, userId, branchId);

      expect(result).toEqual(mockSession);
      expect(prisma.cashierSession.findFirst).toHaveBeenCalledWith({
        where: { tenantId, userId, branchId, status: 'OPEN' },
        include: expect.any(Object),
      });
    });
  });
});
