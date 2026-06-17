import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import type { RequestUser } from '../../common/types/authenticated-request.type';

describe('ClinicalWorkflowService read isolation', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;

  const tenantId = 'tenant-1';
  const branchId = 'branch-1';
  const patientId = 'patient-1';

  const doctorUser: RequestUser = {
    userId: 'doctor-1',
    tenantId,
    branchId,
    roles: ['Doctor'],
  };

  const superAdminUser: RequestUser = {
    userId: 'admin-1',
    tenantId,
    roles: ['Super Admin'],
  };

  beforeEach(async () => {
    prisma = {
      patient: { findFirst: jest.fn() },
      encounter: { count: jest.fn() },
      prescription: { count: jest.fn(), findMany: jest.fn() },
      labResult: { count: jest.fn(), findMany: jest.fn() },
      vitals: { findMany: jest.fn() },
      triage: { findMany: jest.fn() },
      order: { findMany: jest.fn() },
      invoice: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
  });

  it('fails closed for non-super-admin read access without branch context', async () => {
    await expect(
      service.getVitals(patientId, tenantId, {
        ...doctorUser,
        branchId: undefined,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('scopes patient summary counts by branch for branch-bound users', async () => {
    prisma.patient.findFirst.mockResolvedValue({
      id: patientId,
      firstName: 'John',
      lastName: 'Doe',
      patientNumber: 'PT-1',
      dob: new Date('1990-01-01'),
      status: 'ACTIVE',
    });
    prisma.encounter.count.mockResolvedValue(2);
    prisma.prescription.count.mockResolvedValue(3);
    prisma.labResult.count.mockResolvedValue(1);

    await service.getPatientSummary(patientId, tenantId, doctorUser);

    expect(prisma.encounter.count).toHaveBeenCalledWith({
      where: {
        tenantId,
        patientId,
        branchId,
        archivedAt: null,
      },
    });
    expect(prisma.prescription.count).toHaveBeenCalledWith({
      where: {
        tenantId,
        patientId,
        branchId,
        deletedAt: null,
      },
    });
    expect(prisma.labResult.count).toHaveBeenCalledWith({
      where: {
        tenantId,
        order: { patientId, branchId },
        status: { notIn: ['COMPLETED', 'RELEASED'] },
        archivedAt: null,
      },
    });
  });

  it('omits branch filters from patient summary counts for Super Admin', async () => {
    prisma.patient.findFirst.mockResolvedValue({
      id: patientId,
      firstName: 'John',
      lastName: 'Doe',
      patientNumber: 'PT-1',
      dob: new Date('1990-01-01'),
      status: 'ACTIVE',
    });
    prisma.encounter.count.mockResolvedValue(2);
    prisma.prescription.count.mockResolvedValue(3);
    prisma.labResult.count.mockResolvedValue(1);

    await service.getPatientSummary(patientId, tenantId, superAdminUser);

    expect(prisma.encounter.count).toHaveBeenCalledWith({
      where: {
        tenantId,
        patientId,
        branchId: undefined,
        archivedAt: null,
      },
    });
    expect(prisma.labResult.count).toHaveBeenCalledWith({
      where: {
        tenantId,
        order: { patientId },
        status: { notIn: ['COMPLETED', 'RELEASED'] },
        archivedAt: null,
      },
    });
  });

  it('scopes vitals reads by encounter branch', async () => {
    prisma.vitals.findMany.mockResolvedValue([]);

    await service.getVitals(patientId, tenantId, doctorUser);

    expect(prisma.vitals.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          encounter: { patientId, archivedAt: null, branchId },
        },
      }),
    );
  });

  it('scopes triage reads by branch', async () => {
    prisma.triage.findMany.mockResolvedValue([]);

    await service.getTriage(patientId, tenantId, doctorUser);

    expect(prisma.triage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          patientId,
          branchId,
        },
      }),
    );
  });

  it('scopes order reads by branch', async () => {
    prisma.order.findMany.mockResolvedValue([]);

    await service.getOrders(patientId, tenantId, doctorUser);

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patientId,
          tenantId,
          branchId,
          deletedAt: null,
        }),
      }),
    );
  });

  it('scopes lab result reads by order branch', async () => {
    prisma.labResult.findMany.mockResolvedValue([]);

    await service.getLabResults(patientId, tenantId, doctorUser);

    expect(prisma.labResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          order: { patientId, branchId },
          deletedAt: null,
          archivedAt: null,
        }),
      }),
    );
  });

  it('scopes prescription reads by branch', async () => {
    prisma.prescription.findMany.mockResolvedValue([]);

    await service.getPrescriptions(patientId, tenantId, doctorUser);

    expect(prisma.prescription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          patientId,
          tenantId,
          branchId,
          deletedAt: null,
        },
      }),
    );
  });

  it('scopes billing handoff reads by order branch', async () => {
    prisma.invoice.findMany.mockResolvedValue([]);

    await service.getBillingHandoff(patientId, tenantId, doctorUser);

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          order: { patientId, branchId },
          deletedAt: null,
          archivedAt: null,
        }),
      }),
    );
  });
});
