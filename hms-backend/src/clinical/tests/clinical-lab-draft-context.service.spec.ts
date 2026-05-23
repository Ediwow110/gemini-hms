import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('ClinicalWorkflowService (getLabDraftEncodingContext)', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockPatientId = 'patient-1';
  const mockOrderId = 'order-1';
  const mockUserId = 'user-1';

  const basePatient = {
    id: mockPatientId,
    firstName: 'John',
    lastName: 'Doe',
    patientNumber: 'MRN-001',
    dob: new Date('1990-01-15'),
  };

  const baseClinicalItems = [
    {
      id: 'item-1',
      itemName: 'Complete Blood Count (CBC)',
      notes: null,
      status: 'PENDING',
      createdAt: new Date(),
    },
    {
      id: 'item-2',
      itemName: 'Lipid Panel',
      notes: 'Fasting required',
      status: 'PENDING',
      createdAt: new Date(),
    },
  ];

  const baseSpecimen = {
    id: 'spec-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    patientId: mockPatientId,
    orderId: mockOrderId,
    specimenType: 'Whole Blood',
    accessionNumber: 'ACC-001',
    collectionMode: 'ROUTINE',
    collectedAt: null,
    receivedAt: new Date(),
    receivedById: 'rec-1',
    status: 'RECEIVED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseLabResult = {
    id: 'result-1',
    tenantId: mockTenantId,
    orderId: mockOrderId,
    status: 'ENCODED',
    results: { WBC: '5.2', RBC: '4.8' },
    remarks: 'Normal range',
    approvedById: null,
    lockedAt: null,
    encodedById: mockUserId,
    encodedAt: new Date(),
    lastEditedById: mockUserId,
    lastEditedAt: new Date(),
    createdById: mockUserId,
    updatedById: mockUserId,
    deletedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    archiveReason: null,
  };

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
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: basePatient,
    clinicalItems: baseClinicalItems,
    labSpecimen: baseSpecimen,
    labResult: baseLabResult,
  };

  const baseOrderNoResult = {
    ...baseOrder,
    labResult: null,
  };

  const baseOrderNoSpecimen = {
    ...baseOrder,
    labSpecimen: null,
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

  const mockNurseUser = {
    userId: 'nurse-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Nurse'],
  };

  const mockDoctorUser = {
    userId: 'doc-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Doctor'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
    prisma = module.get(PrismaService);
  });

  // --- 1. Happy path: Lab Technician fetches full context ---
  it('should return full encoding context for Lab Technician', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(result).toBeDefined();
    expect(result.orderId).toBe(mockOrderId);
    expect(result.orderNumber).toBe('LAB-000001');
    expect(result.orderStatus).toBe('RECEIVED');
    expect(result.patientName).toBe('John Doe');
    expect(result.patientNumber).toBe('MRN-001');
    expect(result.panelName).toBe('Complete Blood Count (CBC)');
    expect(result.specimenType).toBe('Whole Blood');
    expect(result.accessionNumber).toBe('ACC-001');
    expect(result.collectionMode).toBe('ROUTINE');
    expect(result.testItems).toHaveLength(2);
    expect(result.draftResultId).toBe('result-1');
    expect(result.draftStatus).toBe('ENCODED');
    expect(result.draftVersion).toBe(1);
    expect(result.draftResults).toEqual({ WBC: '5.2', RBC: '4.8' });
    expect(result.draftRemarks).toBe('Normal range');
    expect(result.accessLabel).toBe('Lab Draft Encoding Context');
    expect(result.isReadOnly).toBe(true);
  });

  // --- 2. Happy path: Branch Admin fetches context ---
  it('should return context for Branch Admin', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
    );

    expect(result).toBeDefined();
    expect(result.orderId).toBe(mockOrderId);
  });

  // --- 3. Happy path: Super Admin fetches context ---
  it('should return context for Super Admin', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockSuperAdminUser,
    );

    expect(result).toBeDefined();
    expect(result.orderId).toBe(mockOrderId);
  });

  // --- 4. Happy path: Returns draft result data when it exists ---
  it('should return draft result fields when labResult exists', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(result.draftResultId).toBe('result-1');
    expect(result.draftStatus).toBe('ENCODED');
    expect(result.draftVersion).toBe(1);
    expect(result.draftResults).toBeDefined();
  });

  // --- 5. Happy path: Returns undefined draft fields when no labResult ---
  it('should return undefined draft fields when no existing labResult', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrderNoResult);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(result.draftResultId).toBeUndefined();
    expect(result.draftStatus).toBeUndefined();
    expect(result.draftVersion).toBeUndefined();
    expect(result.draftResults).toBeUndefined();
    expect(result.draftRemarks).toBeUndefined();
  });

  // --- 6. Order not found ---
  it('should throw NotFoundException when order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // --- 7. Tenant isolation violation ---
  it('should throw ForbiddenException for tenant mismatch', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      tenantId: 'other-tenant',
    });

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 8. Patient ID mismatch ---
  it('should throw BadRequestException for patient mismatch', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      patientId: 'other-patient',
    });

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 9. Branch isolation violation ---
  it('should throw ForbiddenException for branch mismatch', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      branchId: 'other-branch',
    });

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 10. Not a LAB order ---
  it('should throw BadRequestException when orderType is not LAB', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      orderType: 'IMAGING',
    });

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 11. Cancelled order ---
  it('should throw BadRequestException for cancelled order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: 'CANCELLED',
    });

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 12. Specimen not received ---
  it('should throw BadRequestException when no specimen received', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrderNoSpecimen);

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 13. Specimen tenant isolation violation ---
  it('should throw ForbiddenException when specimen tenant mismatches', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      labSpecimen: { ...baseSpecimen, tenantId: 'other-tenant' },
    });

    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 14. Unauthorized role: Patient ---
  it('should throw ForbiddenException for Patient role', async () => {
    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockPatientUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 15. Unauthorized role: Cashier ---
  it('should throw ForbiddenException for Cashier role', async () => {
    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockCashierUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 16. Unauthorized role: Nurse ---
  it('should throw ForbiddenException for Nurse role', async () => {
    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockNurseUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 17. Unauthorized role: Doctor ---
  it('should throw ForbiddenException for Doctor role', async () => {
    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockDoctorUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 18. Missing branch context ---
  it('should throw ForbiddenException when branch-scoped user lacks branchId', async () => {
    await expect(
      service.getLabDraftEncodingContext(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        {
          userId: mockUserId,
          tenantId: mockTenantId,
          roles: ['Lab Technician'],
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 19. Safe DTO: no tenantId or branchId leak ---
  it('should return safe DTO without tenantId/branchId', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(result).not.toHaveProperty('tenantId');
    expect(result).not.toHaveProperty('branchId');
  });

  // --- 20. Super Admin bypasses branch check ---
  it('should allow Super Admin even with different branchId on order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      branchId: 'different-branch',
    });

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockSuperAdminUser,
    );

    expect(result).toBeDefined();
    expect(result.orderId).toBe(mockOrderId);
  });

  // --- 21. No audit log written (read-only) ---
  it('should not write any audit log', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    const auditService = (service as any).audit;
    expect(auditService.log).not.toHaveBeenCalled();
  });

  // --- 22. No transaction used ---
  it('should not use $transaction for read-only operation', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  // --- 23. DTO has correct type for all returned fields ---
  it('should return correct DTO field types', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(typeof result.orderId).toBe('string');
    expect(typeof result.orderNumber).toBe('string');
    expect(typeof result.orderStatus).toBe('string');
    expect(typeof result.patientName).toBe('string');
    expect(typeof result.patientNumber).toBe('string');
    expect(result.dob).toBeInstanceOf(Date);
    expect(Array.isArray(result.testItems)).toBe(true);
    expect(typeof result.specimenType).toBe('string');
    expect(result.receivedAt).toBeInstanceOf(Date);
    expect(typeof result.accessLabel).toBe('string');
    expect(result.isReadOnly).toBe(true);
  });

  // --- 24. Panel name uses first clinical item name ---
  it('should set panelName to first clinical item name', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(result.panelName).toBe('Complete Blood Count (CBC)');
  });

  // --- 25. Returns undefined panelName when no clinical items ---
  it('should return undefined panelName when no clinical items', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      clinicalItems: [],
    });

    const result = await service.getLabDraftEncodingContext(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
    );

    expect(result.panelName).toBeUndefined();
    expect(result.testItems).toEqual([]);
  });
});
