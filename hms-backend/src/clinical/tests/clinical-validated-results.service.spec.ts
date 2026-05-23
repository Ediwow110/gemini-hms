import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import { ForbiddenException } from '@nestjs/common';

describe('ClinicalWorkflowService (getValidatedResults)', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let audit: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockPatientId = 'patient-1';
  const mockOrderId = 'order-1';
  const mockResultId = 'result-1';
  const mockSpecimenId = 'spec-1';
  const mockUserId = 'user-1';

  const baseOrder = {
    id: mockOrderId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    patientId: mockPatientId,
    encounterId: 'enc-1',
    orderNumber: 'LAB-000001',
    status: 'RECEIVED',
    orderType: 'LAB',
    priority: 'ROUTINE',
    clinicalIndication: 'Routine checkup',
    requestedById: 'doc-1',
    requestedAt: new Date(),
    cancelledReason: null,
    cancelledById: null,
    cancelledAt: null,
    createdById: 'doc-1',
    updatedById: 'doc-1',
    deletedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const basePatient = {
    id: mockPatientId,
    firstName: 'John',
    lastName: 'Doe',
    patientNumber: 'MRN-001',
  };

  const baseLabSpecimen = {
    id: mockSpecimenId,
    specimenType: 'Whole Blood',
    accessionNumber: 'ACC-001',
  };

  const baseClinicalItem = {
    itemName: 'Complete Blood Count (CBC)',
  };

  const baseLabResult = {
    id: mockResultId,
    tenantId: mockTenantId,
    orderId: mockOrderId,
    status: 'VALIDATED',
    results: { WBC: '5.2' },
    remarks: 'Verified',
    approvedById: null,
    lockedAt: null,
    encodedById: 'encoder-1',
    encodedAt: new Date(),
    validatedById: mockUserId,
    validatedAt: new Date(),
    lastEditedById: 'encoder-1',
    lastEditedAt: new Date(),
    createdById: 'encoder-1',
    updatedById: mockUserId,
    deletedAt: null,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    archiveReason: null,
  };

  const baseLinkedOrder = {
    ...baseOrder,
    patient: basePatient,
    labSpecimen: baseLabSpecimen,
    clinicalItems: [baseClinicalItem],
  };

  const mockLabTechUser = (overrides = {}) => ({
    userId: mockUserId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Lab Technician'],
    ...overrides,
  });

  const mockBranchAdminUser = {
    userId: 'branch-admin-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Branch Admin'],
  };

  const mockSuperAdminUser = {
    userId: 'super-admin-1',
    tenantId: mockTenantId,
    branchId: 'any-branch',
    roles: ['Super Admin'],
  };

  const mockPatientUser = {
    userId: mockPatientId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Patient'],
  };

  const mockCashierUser = {
    userId: 'cashier-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Cashier'],
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      labResult: {
        findMany: jest.fn(),
      },
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('SEQ-001') },
        },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
  });

  const buildMockResult = (overrides = {}) => ({
    ...baseLabResult,
    order: {
      ...baseLinkedOrder,
      ...(overrides as any),
    },
    ...overrides,
  });

  // --- 1. Lab Technician can fetch validated results in own branch ---
  it('should return validated results for Lab Technician in own branch', async () => {
    prisma.labResult.findMany.mockResolvedValue([buildMockResult()]);

    const results = await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('VALIDATED');
    expect(results[0].id).toBe(mockResultId);
    expect(results[0].orderNumber).toBe('LAB-000001');
  });

  // --- 2. Branch Admin can fetch in own branch ---
  it('should return validated results for Branch Admin in own branch', async () => {
    prisma.labResult.findMany.mockResolvedValue([buildMockResult()]);

    const results = await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockBranchAdminUser,
    );

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('VALIDATED');
  });

  // --- 3. Super Admin can fetch validated results within tenant ---
  it('should return validated results for Super Admin within tenant', async () => {
    prisma.labResult.findMany.mockResolvedValue([buildMockResult()]);

    const results = await service.getValidatedResults(
      mockTenantId,
      'any-branch',
      mockSuperAdminUser,
    );

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('VALIDATED');
  });

  // --- 4. Unauthenticated request (empty roles) rejected ---
  it('should reject user with missing roles', async () => {
    const user = {
      userId: mockUserId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      roles: [],
    };

    await expect(
      service.getValidatedResults(mockTenantId, mockBranchId, user),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 5. Patient role rejected ---
  it('should reject Patient role', async () => {
    await expect(
      service.getValidatedResults(mockTenantId, mockBranchId, mockPatientUser),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 6. Cashier role rejected ---
  it('should reject Cashier role', async () => {
    await expect(
      service.getValidatedResults(mockTenantId, mockBranchId, mockCashierUser),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 7. Cross-tenant results excluded (tenant isolation) ---
  it('should query with correct tenantId filter', async () => {
    prisma.labResult.findMany.mockResolvedValue([]);

    await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    const callArgs = prisma.labResult.findMany.mock.calls[0][0];
    expect(callArgs.where.tenantId).toBe(mockTenantId);
  });

  // --- 8. Cross-branch exclusion for branch-scoped users ---
  it('should include branchId filter for non-Super Admin', async () => {
    prisma.labResult.findMany.mockResolvedValue([]);

    await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    const callArgs = prisma.labResult.findMany.mock.calls[0][0];
    expect(callArgs.where.order.branchId).toBe(mockBranchId);
  });

  // --- 9. ENCODED drafts not returned ---
  it('should only query for VALIDATED status', async () => {
    prisma.labResult.findMany.mockResolvedValue([]);

    await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    const callArgs = prisma.labResult.findMany.mock.calls[0][0];
    expect(callArgs.where.status).toBe('VALIDATED');
    expect(callArgs.where.archivedAt).toBeNull();
    expect(callArgs.where.deletedAt).toBeNull();
  });

  // --- 10. Empty queue returns empty array ---
  it('should return empty array when no validated results exist', async () => {
    prisma.labResult.findMany.mockResolvedValue([]);

    const results = await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    expect(results).toEqual([]);
  });

  // --- 11. DTO does not leak tenantId, branchId, or raw PHI ---
  it('should return safe DTO without tenantId, branchId, or raw audit data', async () => {
    prisma.labResult.findMany.mockResolvedValue([buildMockResult()]);

    const results = await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    expect(results).toHaveLength(1);
    const dto = results[0];
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('orderId');
    expect(dto).toHaveProperty('status');
    expect(dto).toHaveProperty('accessLabel');
    expect(dto).toHaveProperty('isReadOnly');
    expect(dto).not.toHaveProperty('tenantId');
    expect(dto).not.toHaveProperty('branchId');
    expect(dto.accessLabel).toBe('Validated — Pending Release');
    expect(dto.isReadOnly).toBe(true);
  });

  // --- 12. No audit log written for read-only fetch ---
  it('should not write any audit log', async () => {
    prisma.labResult.findMany.mockResolvedValue([buildMockResult()]);

    await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    expect(audit.log).not.toHaveBeenCalled();
  });

  // --- 13. Missing branchId fails closed for branch-scoped user ---
  it('should fail closed when branch-scoped user has no branchId', async () => {
    const user = mockLabTechUser({ branchId: undefined });

    await expect(
      service.getValidatedResults(mockTenantId, undefined, user),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 14. Result maps patient name correctly ---
  it('should map patient full name from firstName and lastName', async () => {
    prisma.labResult.findMany.mockResolvedValue([buildMockResult()]);

    const results = await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    expect(results[0].patientName).toBe('John Doe');
  });

  // --- 15. Multiple results returned correctly ---
  it('should return multiple validated results', async () => {
    const result2 = {
      ...buildMockResult(),
      id: 'result-2',
      orderId: 'order-2',
      order: {
        ...baseLinkedOrder,
        id: 'order-2',
        orderNumber: 'LAB-000002',
      },
    };
    prisma.labResult.findMany.mockResolvedValue([buildMockResult(), result2]);

    const results = await service.getValidatedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser(),
    );

    expect(results).toHaveLength(2);
  });
});
