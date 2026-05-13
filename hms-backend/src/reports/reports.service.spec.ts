import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs';

jest.mock('node:fs');

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
      paymentReversal: { count: jest.fn(), findMany: jest.fn() },
      auditLog: { count: jest.fn(), findMany: jest.fn() },
      reportExport: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      file: { create: jest.fn() },
    };
    audit = { log: jest.fn() };

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

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
    prisma.paymentReversal.findMany.mockResolvedValue([]);
    prisma.reportExport.create.mockResolvedValue({ id: 'export-id' });
    prisma.reportExport.update.mockResolvedValue({ id: 'export-id', status: 'COMPLETED' });
    prisma.file.create.mockResolvedValue({ id: 'file-id' });

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
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('scopes audit events export to branch when branchId is set', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.reportExport.create.mockResolvedValue({ id: 'export-audit' });
    prisma.reportExport.update.mockResolvedValue({ id: 'export-audit', rowCount: 0 });
    prisma.file.create.mockResolvedValue({ id: 'file-id' });

    await service.createExport('tenant', 'branch-b', 'user', {
      reportType: 'AUDIT_EVENTS_SUMMARY',
      filters: {},
      reason: 'audit review',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ branchId: 'branch-b' }),
      }),
    );
  });

  it('rejects filter.branchId conflicting with authenticated branch context', async () => {
    // Note: TheConflicting branch check is handled before data fetching
    await expect(
      service.createExport('tenant', 'branch-b', 'user', {
        reportType: 'CASHIER_REVERSAL_RECONCILIATION',
        filters: { branchId: 'other-branch' },
        reason: 'no',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
