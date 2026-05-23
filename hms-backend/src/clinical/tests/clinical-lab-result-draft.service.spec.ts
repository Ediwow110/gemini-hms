import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('ClinicalWorkflowService (saveDraftLabResult)', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let audit: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockPatientId = 'patient-1';
  const mockOrderId = 'order-1';
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
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  const baseEncodedResult = {
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

  const baseFinalizedResult = {
    ...baseEncodedResult,
    status: 'APPROVED',
    approvedById: 'approver-1',
    lockedAt: null,
  };

  const baseReleasedResult = {
    ...baseEncodedResult,
    status: 'RELEASED',
    lockedAt: new Date(),
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

  const validDto = {
    results: { WBC: '5.2', RBC: '4.8', HGB: '15.0' },
    remarks: 'All values within normal range',
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      order: {
        findUnique: jest.fn(),
      },
      labSpecimen: {
        findUnique: jest.fn(),
      },
      labResult: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
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

  // --- 1. Unauthenticated request rejected ---
  it('should reject request with missing roles', async () => {
    const user = {
      userId: mockUserId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      roles: [],
    };
    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        user,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 2. Patient role rejected ---
  it('should reject Patient role', async () => {
    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockPatientUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 3. Cashier role rejected ---
  it('should reject Cashier role', async () => {
    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockCashierUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 4. Nurse role rejected ---
  it('should reject Nurse role', async () => {
    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockNurseUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 5. Doctor role rejected ---
  it('should reject Doctor role', async () => {
    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockDoctorUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 6. Lab Technician allowed (create new draft) ---
  it('should allow Lab Technician to create a new draft result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);
    prisma.labResult.create.mockResolvedValue({
      ...baseEncodedResult,
      id: 'result-new',
      status: 'ENCODED',
      results: validDto.results,
      remarks: validDto.remarks,
      encodedById: mockUserId,
      encodedAt: expect.any(Date),
      lastEditedById: mockUserId,
      lastEditedAt: expect.any(Date),
      createdById: mockUserId,
      updatedById: mockUserId,
      version: 0,
      createdAt: new Date(),
    });

    const result = await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('ENCODED');
    expect(result.encodedById).toBe(mockUserId);
    expect(prisma.labResult.create).toHaveBeenCalled();
  });

  // --- 7. Branch Admin allowed ---
  it('should allow Branch Admin to create a new draft result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);
    prisma.labResult.create.mockResolvedValue({
      ...baseEncodedResult,
      id: 'result-ba',
      encodedById: 'branch-admin-1',
      createdById: 'branch-admin-1',
    });

    const result = await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('ENCODED');
  });

  // --- 8. Super Admin allowed ---
  it('should allow Super Admin to create a new draft result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);
    prisma.labResult.create.mockResolvedValue({
      ...baseEncodedResult,
      id: 'result-sa',
      encodedById: 'super-admin-1',
      createdById: 'super-admin-1',
    });

    const result = await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockSuperAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('ENCODED');
  });

  // --- 9. Missing branchId fails closed ---
  it('should fail closed when branch-scoped user has no branchId', async () => {
    const user = mockLabTechUser({ branchId: undefined });
    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        user,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 10. Cross-branch access rejected ---
  it('should reject cross-branch access for branch-scoped user', async () => {
    const crossBranchOrder = { ...baseOrder, branchId: 'branch-2' };
    prisma.order.findUnique.mockResolvedValue(crossBranchOrder);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 11. Tenant mismatch rejected ---
  it('should reject tenant mismatch', async () => {
    const wrongTenantOrder = { ...baseOrder, tenantId: 'tenant-2' };
    prisma.order.findUnique.mockResolvedValue(wrongTenantOrder);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 12. PatientId mismatch rejected ---
  it('should reject patientId mismatch', async () => {
    const wrongPatientOrder = { ...baseOrder, patientId: 'patient-2' };
    prisma.order.findUnique.mockResolvedValue(wrongPatientOrder);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 13. Nonexistent order rejected ---
  it('should reject nonexistent order', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // --- 14. Non-LAB order rejected ---
  it('should reject non-LAB order', async () => {
    const imagingOrder = { ...baseOrder, orderType: 'IMAGING' };
    prisma.order.findUnique.mockResolvedValue(imagingOrder);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 15. Cancelled order rejected ---
  it('should reject CANCELLED order', async () => {
    const cancelledOrder = { ...baseOrder, status: 'CANCELLED' };
    prisma.order.findUnique.mockResolvedValue(cancelledOrder);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 16. Order without received specimen rejected ---
  it('should reject order without specimen', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 17. Specimen with non-received status rejected ---
  it('should reject specimen with non-received status', async () => {
    const rejectedSpecimen = { ...baseSpecimen, status: 'REJECTED' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(rejectedSpecimen);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 18. Existing DRAFT result can be updated ---
  it('should update existing ENCODED draft result', async () => {
    const existingDraft = { ...baseEncodedResult };
    const updatedResult = {
      ...existingDraft,
      results: { WBC: '6.0', RBC: '5.0' },
      remarks: 'Updated: slightly elevated WBC',
      lastEditedById: mockUserId,
      lastEditedAt: new Date(),
      updatedById: mockUserId,
      version: 2,
    };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(existingDraft);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(updatedResult);

    const updateDto = {
      results: { WBC: '6.0', RBC: '5.0' },
      remarks: 'Updated: slightly elevated WBC',
    };

    const result = await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      updateDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('ENCODED');
    expect(result.version).toBe(2);
    expect(prisma.labResult.updateMany).toHaveBeenCalled();
    expect(prisma.labResult.create).not.toHaveBeenCalled();
  });

  // --- 19. Approved result cannot be edited ---
  it('should reject editing an APPROVED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseFinalizedResult);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 20. Released result cannot be edited ---
  it('should reject editing a RELEASED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseReleasedResult);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 21. Locked result cannot be edited ---
  it('should reject editing a locked result', async () => {
    const lockedResult = {
      ...baseEncodedResult,
      lockedAt: new Date(),
      status: 'ENCODED',
    };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(lockedResult);

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 22. Audit log written ---
  it('should write audit log', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);
    prisma.labResult.create.mockResolvedValue({
      ...baseEncodedResult,
      id: 'result-audit',
    });

    await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'LAB_RESULT_DRAFT_SAVED',
        recordType: 'LabResult',
      }),
      prisma,
      mockBranchId,
    );
  });

  // --- 23. Audit log contains metadata only (no raw result payload) ---
  it('should exclude raw result payload from audit logs', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);
    prisma.labResult.create.mockResolvedValue({
      ...baseEncodedResult,
      id: 'result-audit-safe',
    });

    await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    const auditCall = audit.log.mock.calls[0][0];
    expect(auditCall.newValues).not.toHaveProperty('results');
    expect(auditCall.newValues).not.toHaveProperty('remarks');
    expect(auditCall.newValues).toHaveProperty('fieldCount');
    expect(auditCall.newValues).toHaveProperty('hasRemarks');
    expect(auditCall.newValues).toHaveProperty('oldStatus');
    expect(auditCall.newValues).toHaveProperty('newStatus');
  });

  // --- 24. DTO does not leak tenantId or branchId ---
  it('should return safe DTO without raw tenantId or branchId', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);
    prisma.labResult.create.mockResolvedValue({
      ...baseEncodedResult,
      id: 'result-dto',
    });

    const result = await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('orderId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('accessLabel');
    expect(result).toHaveProperty('isReadOnly');
    expect(result).not.toHaveProperty('tenantId');
    expect(result).not.toHaveProperty('branchId');
  });

  // --- 25. No side-effect mutations on billing/invoice/prescription ---
  it('should not mutate billing, invoice, or prescription data', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);
    prisma.labResult.create.mockResolvedValue({
      ...baseEncodedResult,
      id: 'result-safe',
    });

    await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(prisma.invoice).toBeUndefined();
    expect(prisma.payment).toBeUndefined();
    expect(prisma.prescription).toBeUndefined();
    expect(prisma.clinicalNote).toBeUndefined();
  });

  // --- 26. Stale version update is rejected with ConflictException ---
  it('should reject update when version mismatch (optimistic lock)', async () => {
    const existingDraft = { ...baseEncodedResult, version: 1 };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(existingDraft);
    prisma.labResult.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.saveDraftLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(ConflictException);
  });

  // --- 27. Successful update increments version exactly once ---
  it('should increment version on successful update', async () => {
    const existingDraft = { ...baseEncodedResult, version: 1 };
    const updatedResult = {
      ...existingDraft,
      results: { WBC: '6.0' },
      version: 2,
    };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(existingDraft);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(updatedResult);

    const result = await service.saveDraftLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      { results: { WBC: '6.0' } },
    );
    expect(result).toBeDefined();
    expect(result.version).toBe(2);
    const updateManyCall = prisma.labResult.updateMany.mock.calls[0][0];
    expect(updateManyCall.data.version).toEqual({ increment: 1 });
  });
});
