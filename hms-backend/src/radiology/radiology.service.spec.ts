import { Test, TestingModule } from '@nestjs/testing';
import { RadiologyService } from './radiology.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import { CreateRadiologyOrderDto } from './dto/create-radiology-order.dto';
import { RadiologyOrderStatus, RadiologyReportStatus } from '@prisma/client';

describe('RadiologyService', () => {
  let service: RadiologyService;

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    patient: {
      findFirst: jest.fn(),
    },
    radiologyOrder: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    radiologyReport: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    radiologyReportVersion: {
      create: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RadiologyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<RadiologyService>(RadiologyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const dto: CreateRadiologyOrderDto = {
      patientId: 'patient-1',
      branchId: 'branch-1',
      modality: 'XRAY',
      clinicalNotes: 'Persistent cough',
    };

    it('should create a radiology order if patient exists', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.radiologyOrder.create.mockResolvedValue({
        id: 'order-1',
        ...dto,
      });

      const result = await service.createOrder(tenantId, userId, dto);

      expect(result.id).toBe('order-1');
      expect(mockPrisma.radiologyOrder.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if patient not in tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.createOrder(tenantId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('draftReport', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const orderId = 'order-1';
    const dto = { findings: 'Normal lungs', conclusion: 'No issues' };

    it('should create a report and move order to IN_PROGRESS', async () => {
      const mockOrder = {
        id: orderId,
        tenantId,
        branchId: 'branch-1',
        status: RadiologyOrderStatus.PENDING,
      };
      mockPrisma.radiologyOrder.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.radiologyReport.create.mockResolvedValue({ id: 'report-1' });

      await service.draftReport(tenantId, userId, orderId, dto);

      expect(mockPrisma.radiologyReport.create).toHaveBeenCalled();
      expect(mockPrisma.radiologyOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderId },
          data: expect.objectContaining({
            status: RadiologyOrderStatus.IN_PROGRESS,
          }),
        }),
      );
    });

    it('should throw ConflictException if trying to draft for approved report', async () => {
      const mockOrder = {
        id: orderId,
        report: { status: RadiologyReportStatus.APPROVED },
      };
      mockPrisma.radiologyOrder.findFirst.mockResolvedValue(mockOrder);

      await expect(
        service.draftReport(tenantId, userId, orderId, dto),
      ).rejects.toThrow('report_locked');
    });
  });

  describe('approveReport', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const reportId = 'report-1';

    it('should approve report and move order to COMPLETED', async () => {
      const mockReport = {
        id: reportId,
        tenantId,
        radiologyOrderId: 'order-1',
        status: RadiologyReportStatus.DRAFT,
      };
      mockPrisma.radiologyReport.findFirst.mockResolvedValue(mockReport);
      mockPrisma.radiologyReport.update.mockResolvedValue({
        ...mockReport,
        status: RadiologyReportStatus.APPROVED,
      });

      await service.approveReport(tenantId, userId, reportId);

      expect(mockPrisma.radiologyReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: RadiologyReportStatus.APPROVED, updatedBy: userId },
        }),
      );
      expect(mockPrisma.radiologyOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: RadiologyOrderStatus.COMPLETED, updatedBy: userId },
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'RADIOLOGY_REPORT_APPROVED' }),
        expect.anything(),
      );
    });
  });

  describe('amendReport', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const reportId = 'report-1';
    const dto = {
      findings: 'Revised findings',
      conclusion: 'Revised conclusion',
      reasonForAmendment: 'Error in first draft',
    };

    it('should create a version and update report to AMENDED', async () => {
      const mockReport = {
        id: reportId,
        tenantId,
        findings: 'Old findings',
        conclusion: 'Old conclusion',
        status: RadiologyReportStatus.APPROVED,
      };
      mockPrisma.radiologyReport.findFirst.mockResolvedValue(mockReport);

      await service.amendReport(tenantId, userId, reportId, dto);

      expect(mockPrisma.radiologyReportVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            previousFindings: 'Old findings',
            reasonForAmendment: 'Error in first draft',
          }),
        }),
      );
      expect(mockPrisma.radiologyReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            findings: 'Revised findings',
            status: RadiologyReportStatus.AMENDED,
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'RADIOLOGY_REPORT_AMENDED' }),
        expect.anything(),
      );
    });
  });

  describe('Tenant Isolation (IDOR Protection)', () => {
    it('should fail closed if report does not belong to tenant', async () => {
      mockPrisma.radiologyReport.findFirst.mockResolvedValue(null);

      await expect(
        service.approveReport('wrong-tenant', 'user-1', 'report-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
