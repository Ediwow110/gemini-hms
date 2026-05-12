import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
      paymentReversal: { count: jest.fn() },
      auditLog: { count: jest.fn() },
      reportExport: { create: jest.fn() },
    };
    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should enforce reason requirement', async () => {
    await expect(
      service.createExport('tenant', 'branch', 'user', {
        reportType: 'CASHIER_REVERSAL_RECONCILIATION',
        filters: {},
        reason: '  ',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create export record and audit log', async () => {
    prisma.paymentReversal.count.mockResolvedValue(5);
    prisma.reportExport.create.mockResolvedValue({ id: 'export-id' });

    const result = await service.createExport('tenant', 'branch', 'user', {
      reportType: 'CASHIER_REVERSAL_RECONCILIATION',
      filters: {},
      reason: 'testing',
    });

    expect(result.id).toBe('export-id');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'REPORT_EXPORTED' }),
      expect.anything(),
      'branch',
    );
  });

  it('scopes audit events export count to branch when branchId is set', async () => {
    prisma.auditLog.count.mockResolvedValue(3);
    prisma.reportExport.create.mockResolvedValue({ id: 'export-audit' });

    await service.createExport('tenant', 'branch-b', 'user', {
      reportType: 'AUDIT_EVENTS_SUMMARY',
      filters: {},
      reason: 'audit review',
    });

    expect(prisma.auditLog.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant', branchId: 'branch-b' },
    });
    expect(prisma.reportExport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rowCount: 3 }),
      }),
    );
  });

  it('rejects filter.branchId conflicting with authenticated branch context', async () => {
    await expect(
      service.createExport('tenant', 'branch-b', 'user', {
        reportType: 'CASHIER_REVERSAL_RECONCILIATION',
        filters: { branchId: 'other-branch' },
        reason: 'no',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.paymentReversal.count).not.toHaveBeenCalled();
  });
});
