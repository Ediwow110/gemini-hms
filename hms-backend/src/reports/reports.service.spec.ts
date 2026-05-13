import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReportPolicyService, ReportRiskLevel } from './report-policy.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;
  let audit: any;
  let policyService: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
      paymentReversal: { count: jest.fn() },
      auditLog: { count: jest.fn() },
      reportExport: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn() };
    policyService = {
      getPolicyForExport: jest.fn().mockReturnValue({
        riskLevel: ReportRiskLevel.LOW,
        allowedFields: ['id'],
        maskedFields: [],
        fieldPolicySnapshot: { id: { riskLevel: 'LOW', sensitive: false } },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ReportPolicyService, useValue: policyService },
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
      expect.objectContaining({ eventKey: 'REPORT_EXPORT_REQUESTED' }),
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

  it('should reject unknown report types', async () => {
    policyService.getPolicyForExport.mockImplementation(() => {
      throw new BadRequestException('Unknown report type');
    });

    await expect(
      service.createExport('tenant', 'branch', 'user', {
        reportType: 'UNKNOWN_REPORT' as any,
        filters: {},
        reason: 'testing',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject unallowlisted fields', async () => {
    policyService.getPolicyForExport.mockImplementation(() => {
      throw new BadRequestException('Field not allowlisted');
    });

    await expect(
      service.createExport('tenant', 'branch', 'user', {
        reportType: 'CASHIER_REVERSAL_RECONCILIATION',
        filters: {},
        reason: 'testing',
        requestedFields: ['unknown_field'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns sanitized metadata response with no storage path or signed URL', async () => {
    prisma.paymentReversal.count.mockResolvedValue(5);
    prisma.reportExport.create.mockResolvedValue({
      id: 'export-id',
      status: 'PENDING_APPROVAL',
      reportType: 'CASHIER_REVERSAL_RECONCILIATION',
      riskLevel: 'HIGH',
      rowCount: 5,
      createdAt: new Date(),
    });
    policyService.getPolicyForExport.mockReturnValue({
      riskLevel: ReportRiskLevel.HIGH,
      allowedFields: ['id', 'amount'],
      maskedFields: [],
      fieldPolicySnapshot: {},
    });

    const result = await service.createExport('tenant', 'branch', 'user', {
      reportType: 'CASHIER_REVERSAL_RECONCILIATION',
      filters: {},
      reason: 'testing',
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('riskLevel', 'HIGH');
    expect(result).toHaveProperty('approvalRequired', true);
    expect(result).toHaveProperty('fileGenerationAvailable', false);
    expect(result).not.toHaveProperty('storageKey');
    expect(result).not.toHaveProperty('signedUrl');
  });

  describe('approveExport', () => {
    it('should approve pending export and update metadata', async () => {
      const exportRecord = {
        id: 'export-id',
        tenantId: 'tenant',
        status: 'PENDING_APPROVAL',
        reportType: 'CASHIER_REVERSAL_RECONCILIATION',
        requestedBy: 'requester-id',
        riskLevel: 'HIGH',
        branchId: 'branch',
      };
      prisma.reportExport.findUnique.mockResolvedValue(exportRecord);
      prisma.reportExport.update.mockResolvedValue({
        ...exportRecord,
        status: 'APPROVED',
        decidedById: 'approver-id',
        decidedAt: new Date(),
        decisionReason: 'Approved for compliance',
      });

      const result = await service.approveExport(
        'tenant',
        'approver-id',
        'export-id',
        { reason: 'Approved for compliance' },
      );

      expect(result.status).toBe('APPROVED');
      expect(result.decisionReason).toBe('Approved for compliance');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'REPORT_EXPORT_APPROVED' }),
        expect.anything(),
        'branch',
      );
    });

    it('should throw if export not found', async () => {
      prisma.reportExport.findUnique.mockResolvedValue(null);
      await expect(
        service.approveExport('tenant', 'user', 'export-id', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if export not pending', async () => {
      prisma.reportExport.findUnique.mockResolvedValue({ status: 'APPROVED' });
      await expect(
        service.approveExport('tenant', 'user', 'export-id', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if approver is requester', async () => {
      prisma.reportExport.findUnique.mockResolvedValue({
        status: 'PENDING_APPROVAL',
        requestedBy: 'user',
      });
      await expect(
        service.approveExport('tenant', 'user', 'export-id', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('rejectExport', () => {
    it('should reject pending export and update metadata', async () => {
      const exportRecord = {
        id: 'export-id',
        tenantId: 'tenant',
        status: 'PENDING_APPROVAL',
        reportType: 'CASHIER_REVERSAL_RECONCILIATION',
        requestedBy: 'requester-id',
        riskLevel: 'HIGH',
        branchId: 'branch',
      };
      prisma.reportExport.findUnique.mockResolvedValue(exportRecord);
      prisma.reportExport.update.mockResolvedValue({
        ...exportRecord,
        status: 'REJECTED',
        decidedById: 'rejector-id',
        decidedAt: new Date(),
        decisionReason: 'Insufficient justification',
      });

      const result = await service.rejectExport(
        'tenant',
        'rejector-id',
        'export-id',
        { reason: 'Insufficient justification' },
      );

      expect(result.status).toBe('REJECTED');
      expect(result.decisionReason).toBe('Insufficient justification');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'REPORT_EXPORT_REJECTED' }),
        expect.anything(),
        'branch',
      );
    });

    it('should throw if export not found', async () => {
      prisma.reportExport.findUnique.mockResolvedValue(null);
      await expect(
        service.rejectExport('tenant', 'user', 'export-id', { reason: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if export not pending', async () => {
      prisma.reportExport.findUnique.mockResolvedValue({ status: 'APPROVED' });
      await expect(
        service.rejectExport('tenant', 'user', 'export-id', { reason: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if rejector is requester', async () => {
      prisma.reportExport.findUnique.mockResolvedValue({
        status: 'PENDING_APPROVAL',
        requestedBy: 'user',
      });
      await expect(
        service.rejectExport('tenant', 'user', 'export-id', { reason: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
