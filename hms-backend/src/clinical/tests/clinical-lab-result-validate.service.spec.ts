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

describe('ClinicalWorkflowService (validateLabResult)', () => {
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

  const baseEncodedResult = {
    id: 'result-1',
    tenantId: mockTenantId,
    orderId: mockOrderId,
    status: 'ENCODED',
    results: { WBC: '5.2', RBC: '4.8' },
    remarks: 'Normal range',
    approvedById: null,
    lockedAt: null,
    encodedById: 'encoder-1',
    encodedAt: new Date(),
    validatedById: null,
    validatedAt: null,
    lastEditedById: 'encoder-1',
    lastEditedAt: new Date(),
    createdById: 'encoder-1',
    updatedById: 'encoder-1',
    deletedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    archiveReason: null,
  };

  const baseValidatedResult = {
    ...baseEncodedResult,
    status: 'VALIDATED',
    validatedById: mockUserId,
    validatedAt: new Date(),
    version: 2,
  };

  const baseFinalizedResult = {
    ...baseEncodedResult,
    status: 'APPROVED',
    approvedById: 'approver-1',
  };

  const baseReleasedResult = {
    ...baseEncodedResult,
    status: 'RELEASED',
    lockedAt: new Date(),
  };

  const baseAmendedResult = {
    ...baseEncodedResult,
    status: 'AMENDED',
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
    version: 1,
    remarks: 'Verified against original requisition',
  };
  const dtoNoRemarks = { version: 1 };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      order: {
        findUnique: jest.fn(),
      },
      labResult: {
        findUnique: jest.fn(),
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
      service.validateLabResult(
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
      service.validateLabResult(
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
      service.validateLabResult(
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
      service.validateLabResult(
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
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockDoctorUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 6. Lab Technician allowed ---
  it('should allow Lab Technician to validate an ENCODED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseValidatedResult);

    const result = await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('VALIDATED');
    expect(result.validatedById).toBe(mockUserId);
    expect(prisma.labResult.updateMany).toHaveBeenCalled();
  });

  // --- 7. Branch Admin allowed ---
  it('should allow Branch Admin to validate', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    const baValidated = {
      ...baseValidatedResult,
      validatedById: 'branch-admin-1',
    };
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baValidated);

    const result = await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('VALIDATED');
    expect(result.validatedById).toBe('branch-admin-1');
  });

  // --- 8. Super Admin allowed ---
  it('should allow Super Admin to validate', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    const saValidated = {
      ...baseValidatedResult,
      validatedById: 'super-admin-1',
    };
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(saValidated);

    const result = await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockSuperAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('VALIDATED');
  });

  // --- 9. Missing branchId fails closed ---
  it('should fail closed when branch-scoped user has no branchId', async () => {
    const user = mockLabTechUser({ branchId: undefined });
    await expect(
      service.validateLabResult(
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
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 11. Tenant mismatch rejected ---
  it('should reject tenant mismatch on order', async () => {
    const wrongTenantOrder = { ...baseOrder, tenantId: 'tenant-2' };
    prisma.order.findUnique.mockResolvedValue(wrongTenantOrder);

    await expect(
      service.validateLabResult(
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
      service.validateLabResult(
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
      service.validateLabResult(
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
      service.validateLabResult(
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
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 16. No existing LabResult (not encoded) rejected ---
  it('should reject order without LabResult', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(null);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 17. Non-ENCODED status (PENDING_COLLECTION) rejected ---
  it('should reject result with PENDING_COLLECTION status', async () => {
    const pendingResult = {
      ...baseEncodedResult,
      status: 'PENDING_COLLECTION',
    };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(pendingResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 18. Already VALIDATED result rejected ---
  it('should reject already VALIDATED result', async () => {
    const validatedResult = { ...baseValidatedResult };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(validatedResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 19. Approved result cannot be validated ---
  it('should reject APPROVED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseFinalizedResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 20. Released result cannot be validated ---
  it('should reject RELEASED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseReleasedResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 21. Amended result cannot be validated ---
  it('should reject AMENDED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseAmendedResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 22. Locked result rejected ---
  it('should reject locked result', async () => {
    const lockedResult = {
      ...baseEncodedResult,
      lockedAt: new Date(),
      status: 'ENCODED',
    };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(lockedResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 23. Archived result rejected ---
  it('should reject archived result', async () => {
    const archivedResult = {
      ...baseEncodedResult,
      archivedAt: new Date(),
      archiveReason: 'Specimen compromised',
    };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(archivedResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 24. Version mismatch (optimistic lock) rejected with ConflictException ---
  it('should reject version mismatch (optimistic lock)', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue({
      ...baseEncodedResult,
      version: 2,
    });
    prisma.labResult.updateMany.mockResolvedValue({ count: 0 });

    const staleDto = { version: 1 };

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        staleDto,
      ),
    ).rejects.toThrow(ConflictException);
  });

  // --- 25. Successful validation increments version ---
  it('should increment version on successful validation', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseValidatedResult);

    const result = await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.version).toBe(2);
    const updateManyCall = prisma.labResult.updateMany.mock.calls[0][0];
    expect(updateManyCall.data.version).toEqual({ increment: 1 });
  });

  // --- 26. Audit log written ---
  it('should write audit log', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseValidatedResult);

    await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'LAB_RESULT_VALIDATED',
        recordType: 'LabResult',
      }),
      prisma,
      mockBranchId,
    );
  });

  // --- 27. Audit log contains metadata only (no raw result payload or PHI) ---
  it('should exclude raw result payload from audit logs', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseValidatedResult);

    await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    const auditCall = audit.log.mock.calls[0][0];
    expect(auditCall.newValues).not.toHaveProperty('results');
    expect(auditCall.newValues).toHaveProperty('oldStatus');
    expect(auditCall.newValues).toHaveProperty('newStatus');
    expect(auditCall.newValues).toHaveProperty('oldVersion');
    expect(auditCall.newValues).toHaveProperty('newVersion');
    expect(auditCall.newValues).toHaveProperty('hasRemarks');
  });

  // --- 28. DTO does not leak tenantId or branchId ---
  it('should return safe DTO without raw tenantId or branchId', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseValidatedResult);

    const result = await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('orderId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('accessLabel');
    expect(result).toHaveProperty('isReadOnly');
    expect(result).not.toHaveProperty('tenantId');
    expect(result).not.toHaveProperty('branchId');
    expect(result.accessLabel).toBe('Lab Validation');
  });

  // --- 29. No side-effect mutations on billing/invoice/prescription ---
  it('should not mutate billing, invoice, or prescription data', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseValidatedResult);

    await service.validateLabResult(
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

  // --- 30. ValidatedById and validatedAt set correctly ---
  it('should set validatedById and validatedAt on successful validation', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue({
      ...baseEncodedResult,
      status: 'VALIDATED',
      validatedById: mockUserId,
      validatedAt: new Date(),
      version: 2,
    });

    const result = await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result.validatedById).toBe(mockUserId);
    expect(result.validatedAt).toBeDefined();
    expect(result.validatedAt instanceof Date).toBe(true);
  });

  // --- 31. Validation with no remarks still succeeds ---
  it('should allow validation without remarks', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseValidatedResult);

    const result = await service.validateLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      dtoNoRemarks,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('VALIDATED');
  });

  // --- 32. Tenant mismatch on LabResult rejected ---
  it('should reject tenant mismatch on LabResult', async () => {
    const wrongTenantResult = { ...baseEncodedResult, tenantId: 'tenant-2' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labResult.findUnique.mockResolvedValue(wrongTenantResult);

    await expect(
      service.validateLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
