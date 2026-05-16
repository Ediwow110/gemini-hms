import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReportType, ExportFormat } from './dto/reports.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      payment: {
        findMany: jest.fn(),
      },
      inventoryItem: {
        findMany: jest.fn(),
      },
      patient: {
        findMany: jest.fn(),
      },
      reportExportLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockUserId = 'user-1';

  describe('exportReport Governance', () => {
    it('should throw BadRequestException for large exports without a reason', async () => {
      // Create a large mock dataset (1001 rows)
      const largeData = new Array(1001).fill({ id: 'some-id' });
      prisma.payment.findMany.mockResolvedValue(largeData);

      const dto = {
        reportType: ReportType.SALES,
        format: ExportFormat.CSV,
        filters: {},
      };

      await expect(
        service.exportReport(
          mockTenantId,
          mockBranchId,
          mockUserId,
          dto,
          false,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.reportExportLog.create).not.toHaveBeenCalled();
    });

    it('should allow large exports if a reason is provided', async () => {
      const largeData = new Array(1001).fill({ id: 'some-id' });
      prisma.payment.findMany.mockResolvedValue(largeData);
      prisma.reportExportLog.create.mockResolvedValue({ id: 'log-1' });

      const dto = {
        reportType: ReportType.SALES,
        format: ExportFormat.CSV,
        filters: {},
        reason: 'Monthly Audit',
      };

      const result = await service.exportReport(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
        false,
      );

      expect(result.logId).toBe('log-1');
      expect(prisma.reportExportLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rowCount: 1001,
            reason: 'Monthly Audit',
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalled();
    });
  });

  describe('Tenant Isolation', () => {
    it('should filter all queries by tenantId', async () => {
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.reportExportLog.create.mockResolvedValue({ id: 'log-1' });

      const dto = {
        reportType: ReportType.PATIENT_LIST,
        format: ExportFormat.CSV,
      };

      await service.exportReport(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
        false,
      );

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
          }),
        }),
      );
    });
  });

  describe('Data Masking', () => {
    it('should mask sensitive data if user does not have unmasked access', async () => {
      const sensitiveData = [
        {
          id: '1',
          name: 'John Doe',
          ssn: '123-456-7890',
          patientNumber: 'PAT123456',
        },
      ];
      prisma.patient.findMany.mockResolvedValue(sensitiveData);
      prisma.reportExportLog.create.mockResolvedValue({ id: 'log-1' });

      const dto = {
        reportType: ReportType.PATIENT_LIST,
        format: ExportFormat.CSV,
      };

      const result = await service.exportReport(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
        false, // No unmasked access
      );

      expect(result.data[0].ssn).toBe('***-**-****');
      expect(result.data[0].patientNumber).toBe('PAT****');
    });

    it('should NOT mask sensitive data if user has unmasked access', async () => {
      const sensitiveData = [
        {
          id: '1',
          name: 'John Doe',
          ssn: '123-456-7890',
          patientNumber: 'PAT123456',
        },
      ];
      prisma.patient.findMany.mockResolvedValue(sensitiveData);
      prisma.reportExportLog.create.mockResolvedValue({ id: 'log-1' });

      const dto = {
        reportType: ReportType.PATIENT_LIST,
        format: ExportFormat.CSV,
      };

      const result = await service.exportReport(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
        true, // Has unmasked access
      );

      expect(result.data[0].ssn).toBe('123-456-7890');
      expect(result.data[0].patientNumber).toBe('PAT123456');
    });
  });
});
