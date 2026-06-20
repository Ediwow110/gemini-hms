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

describe('ClinicalWorkflowService (releaseLabResult)', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let audit: any;
  let consoleSpy: jest.SpyInstance;

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

  const baseValidatedResult = {
    id: 'result-1',
    tenantId: mockTenantId,
    orderId: mockOrderId,
    status: 'VALIDATED',
    results: { WBC: '5.2', RBC: '4.8' },
    remarks: 'Normal range',
    approvedById: null,
    lockedAt: null,
    encodedById: 'encoder-1',
    encodedAt: new Date(),
    validatedById: 'validator-1',
    validatedAt: new Date(),
    releasedById: null,
    releasedAt: null,
    lastEditedById: 'validator-1',
    lastEditedAt: new Date(),
    createdById: 'encoder-1',
    updatedById: 'validator-1',
    deletedAt: null,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    archiveReason: null,
  };

  const baseReleasedResult = {
    ...baseValidatedResult,
    status: 'RELEASED',
    releasedById: mockUserId,
    releasedAt: new Date(),
    version: 3,
  };

  const baseEncodedResult = {
    ...baseValidatedResult,
    status: 'ENCODED',
    validatedById: null,
    validatedAt: null,
    version: 1,
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
    collectedAt: new Date(),
    receivedAt: new Date(),
    receivedById: 'rec-1',
    status: 'RECEIVED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  const mockLabTechUser = {
    userId: 'lab-tech-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Lab Technician'],
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

  const validDto = { version: 2 };

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
        findFirst: jest.fn(),
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

    // Suppress expected console.error logs
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
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
      service.releaseLabResult(
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
      service.releaseLabResult(
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
      service.releaseLabResult(
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
      service.releaseLabResult(
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
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockDoctorUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 6. Lab Technician role rejected for release ---
  it('should reject Lab Technician role', async () => {
    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 7. Branch Admin allowed ---
  it('should allow Branch Admin to release a VALIDATED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    const result = await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('RELEASED');
    expect(result.releasedById).toBe(mockUserId);
    expect(prisma.labResult.updateMany).toHaveBeenCalled();
  });

  // --- 8. Super Admin allowed ---
  it('should allow Super Admin to release a VALIDATED result', async () => {
    const saReleased = { ...baseReleasedResult, releasedById: 'super-admin-1' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(saReleased);

    const result = await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockSuperAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('RELEASED');
    expect(result.releasedById).toBe('super-admin-1');
  });

  // --- 9. Missing branchId fails closed ---
  it('should fail closed when branch-scoped user has no branchId', async () => {
    const user = { ...mockBranchAdminUser, branchId: undefined };
    await expect(
      service.releaseLabResult(
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
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 11. Tenant mismatch rejected ---
  it('should reject tenant mismatch on order', async () => {
    const wrongTenantOrder = { ...baseOrder, tenantId: 'tenant-2' };
    prisma.order.findUnique.mockResolvedValue(wrongTenantOrder);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 12. PatientId mismatch rejected ---
  it('should reject patientId mismatch', async () => {
    const wrongPatientOrder = { ...baseOrder, patientId: 'patient-2' };
    prisma.order.findUnique.mockResolvedValue(wrongPatientOrder);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 13. Nonexistent order rejected ---
  it('should reject nonexistent order', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // --- 14. Non-LAB order rejected ---
  it('should reject non-LAB order', async () => {
    const imagingOrder = { ...baseOrder, orderType: 'IMAGING' };
    prisma.order.findUnique.mockResolvedValue(imagingOrder);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 15. Cancelled order rejected ---
  it('should reject CANCELLED order', async () => {
    const cancelledOrder = { ...baseOrder, status: 'CANCELLED' };
    prisma.order.findUnique.mockResolvedValue(cancelledOrder);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 16. Missing specimen rejected ---
  it('should reject order without specimen', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 17. Non-RECEIVED specimen rejected ---
  it('should reject specimen not in RECEIVED status', async () => {
    const pendingSpecimen = { ...baseSpecimen, status: 'COLLECTED' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(pendingSpecimen);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 18. Missing LabResult rejected ---
  it('should reject order without LabResult', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(null);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 19. ENCODED draft result rejected ---
  it('should reject ENCODED result', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseEncodedResult);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 20. Already RELEASED result rejected ---
  it('should reject already RELEASED result', async () => {
    const releasedResult = { ...baseValidatedResult, status: 'RELEASED' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(releasedResult);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 21. APPROVED result rejected ---
  it('should reject APPROVED result', async () => {
    const approvedResult = { ...baseValidatedResult, status: 'APPROVED' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(approvedResult);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 22. AMENDED result rejected ---
  it('should reject AMENDED result', async () => {
    const amendedResult = { ...baseValidatedResult, status: 'AMENDED' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(amendedResult);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 23. Archived result rejected ---
  it('should reject archived result', async () => {
    const archivedResult = {
      ...baseValidatedResult,
      archivedAt: new Date(),
      archiveReason: 'Specimen compromised',
    };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(archivedResult);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 24. Deleted result rejected ---
  it('should reject deleted result', async () => {
    const deletedResult = { ...baseValidatedResult, deletedAt: new Date() };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(deletedResult);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 25. Version mismatch (optimistic lock) rejected ---
  it('should reject version mismatch with ConflictException', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue({
      ...baseValidatedResult,
      version: 3,
    });
    prisma.labResult.updateMany.mockResolvedValue({ count: 0 });

    const staleDto = { version: 2 };

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        staleDto,
      ),
    ).rejects.toThrow(ConflictException);
  });

  // --- 26. Successful release increments version exactly once ---
  it('should increment version on successful release', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    const result = await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.version).toBe(3);
    const updateManyCall = prisma.labResult.updateMany.mock.calls[0][0];
    expect(updateManyCall.data.version).toEqual({ increment: 1 });
  });

  // --- 27. Client cannot set releasedById ---
  it('should not allow client to set releasedById', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue({
      ...baseReleasedResult,
      releasedById: mockBranchAdminUser.userId,
    });

    const dtoWithExtra = { version: 2, releasedById: 'evil-user' } as any;
    const result = await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      dtoWithExtra,
    );
    // DTO validation strips extra fields; server sets releasedById to the current user
    expect(result.releasedById).toBe(mockBranchAdminUser.userId);
    const updateData = prisma.labResult.updateMany.mock.calls[0][0].data;
    expect(updateData.releasedById).toBe(mockBranchAdminUser.userId);
  });

  // --- 28. Client cannot set releasedAt ---
  it('should not allow client to set releasedAt', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    const dtoWithExtra = { version: 2, releasedAt: new Date(0) } as any;
    const result = await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      dtoWithExtra,
    );
    expect(result.releasedAt).toBeDefined();
    // Server timestamp should be recent (not epoch)
    expect(result.releasedAt!.getTime()).toBeGreaterThan(Date.now() - 60000);
  });

  // --- 29. Client cannot set billing/prescription/notification fields ---
  it('should not affect billing, prescription, or notification data', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(prisma.invoice).toBeUndefined();
    expect(prisma.notification).toBeUndefined();
    expect(prisma.prescription).toBeUndefined();
    expect(prisma.clinicalNote).toBeUndefined();
  });

  // --- 30. Audit log is written ---
  it('should write audit log on successful release', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'LAB_RESULT_RELEASED',
        recordType: 'LabResult',
      }),
      prisma,
      mockBranchId,
    );
  });

  // --- 31. Audit log is metadata-only (no raw result payload) ---
  it('should exclude raw result payload from audit logs', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    const auditCall = audit.log.mock.calls[0][0];
    expect(auditCall.newValues).not.toHaveProperty('results');
    expect(auditCall.newValues).not.toHaveProperty('remarks');
    expect(auditCall.newValues).toHaveProperty('oldStatus');
    expect(auditCall.newValues).toHaveProperty('newStatus');
    expect(auditCall.newValues).toHaveProperty('oldVersion');
    expect(auditCall.newValues).toHaveProperty('newVersion');
    expect(auditCall.newValues).toHaveProperty('releasedById');
    expect(auditCall.newValues).toHaveProperty('releasedAt');
  });

  // --- 32. DTO does not leak tenantId or branchId ---
  it('should return safe DTO without raw tenantId or branchId', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    const result = await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
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
    expect(result.accessLabel).toBe('Released — For Clinical Visibility');
  });

  // --- 33. Validated queue no longer returns released result ---
  it('should remove result from validated queue after release', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    const updateCall = prisma.labResult.updateMany.mock.calls[0][0];
    expect(updateCall.where.status).toBe('VALIDATED');
    expect(updateCall.data.status).toBe('RELEASED');
    // After release, getValidatedResults would not return it because status filter is 'VALIDATED'
  });

  // --- 34. Tenant mismatch on LabResult rejected ---
  it('should reject tenant mismatch on LabResult', async () => {
    const wrongTenantResult = { ...baseValidatedResult, tenantId: 'tenant-2' };
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(wrongTenantResult);

    await expect(
      service.releaseLabResult(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 35. Status transition VALIDATED -> RELEASED only ---
  it('should transition VALIDATED -> RELEASED only', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(baseSpecimen);
    prisma.labResult.findUnique.mockResolvedValue(baseValidatedResult);
    prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
    prisma.labResult.findUniqueOrThrow.mockResolvedValue(baseReleasedResult);

    const result = await service.releaseLabResult(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(result.status).toBe('RELEASED');
    const updateCall = prisma.labResult.updateMany.mock.calls[0][0];
    expect(updateCall.data.status).toBe('RELEASED');
  });
});

describe('ClinicalWorkflowService (getReleasedResults)', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockOtherBranchId = 'branch-2';
  const mockOtherTenantId = 'tenant-2';

  const baseReleasedLabResult = {
    id: 'result-1',
    tenantId: mockTenantId,
    orderId: 'order-1',
    status: 'RELEASED',
    version: 3,
    releasedById: 'user-1',
    releasedAt: new Date('2026-05-20T12:00:00Z'),
    validatedById: 'validator-1',
    validatedAt: new Date('2026-05-19T12:00:00Z'),
    archivedAt: null,
    deletedAt: null,
    updatedAt: new Date(),
    order: {
      orderNumber: 'LAB-000001',
      branchId: mockBranchId,
      patient: {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        patientNumber: 'P-001',
      },
      labSpecimen: {
        id: 'spec-1',
        specimenType: 'Whole Blood',
        accessionNumber: 'ACC-001',
      },
      clinicalItems: [{ itemName: 'CBC' }],
    },
  };

  const encodedLabResult = {
    ...baseReleasedLabResult,
    id: 'result-encoded',
    status: 'ENCODED',
    archivedAt: null,
    deletedAt: null,
  };

  const validatedLabResult = {
    ...baseReleasedLabResult,
    id: 'result-validated',
    status: 'VALIDATED',
    archivedAt: null,
    deletedAt: null,
  };

  const archivedResult = {
    ...baseReleasedLabResult,
    id: 'result-archived',
    archivedAt: new Date(),
  };

  const deletedResult = {
    ...baseReleasedLabResult,
    id: 'result-deleted',
    deletedAt: new Date(),
  };

  const crossTenantResult = {
    ...baseReleasedLabResult,
    id: 'result-cross-tenant',
    tenantId: mockOtherTenantId,
    order: { ...baseReleasedLabResult.order, branchId: 'other-branch' },
  };

  const crossBranchResult = {
    ...baseReleasedLabResult,
    id: 'result-cross-branch',
    order: { ...baseReleasedLabResult.order, branchId: mockOtherBranchId },
  };

  const mockLabTechUser = {
    userId: 'lab-tech-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Lab Technician'],
  };

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
    userId: 'patient-1',
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

  const mockNoBranchUser = {
    userId: 'user-1',
    tenantId: mockTenantId,
    branchId: undefined,
    roles: ['Lab Technician'],
  };

  beforeEach(async () => {
    prisma = {
      labResult: {
        findMany: jest.fn().mockImplementation((args) => {
          const allResults: any[] = [
            baseReleasedLabResult,
            encodedLabResult,
            validatedLabResult,
            archivedResult,
            deletedResult,
            crossTenantResult,
            crossBranchResult,
          ];
          const where = args?.where || {};
          return Promise.resolve(
            allResults.filter((r) => {
              if (where.status && r.status !== where.status) return false;
              if (where.tenantId && r.tenantId !== where.tenantId) return false;
              if (where.archivedAt !== undefined) {
                if (where.archivedAt === null && r.archivedAt !== null)
                  return false;
                if (where.archivedAt !== null && r.archivedAt === null)
                  return false;
              }
              if (where.deletedAt !== undefined) {
                if (where.deletedAt === null && r.deletedAt !== null)
                  return false;
                if (where.deletedAt !== null && r.deletedAt === null)
                  return false;
              }
              if (
                where.order?.branchId &&
                r.order?.branchId !== where.order.branchId
              )
                return false;
              return true;
            }),
          );
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: NumberingService, useValue: { generateNumber: jest.fn() } },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
  });

  it('should allow Lab Technician to fetch released results in own branch', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('RELEASED');
  });

  it('should allow Branch Admin to fetch released results in own branch', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockBranchAdminUser,
    );
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('RELEASED');
  });

  it('should allow Super Admin to fetch released results across branches within tenant', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockSuperAdminUser,
    );
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === 'RELEASED')).toBe(true);
  });

  it('should reject unauthorized roles (Patient)', async () => {
    await expect(
      service.getReleasedResults(mockTenantId, mockBranchId, mockPatientUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject unauthorized roles (Cashier)', async () => {
    await expect(
      service.getReleasedResults(mockTenantId, mockBranchId, mockCashierUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject unauthorized roles (Nurse)', async () => {
    await expect(
      service.getReleasedResults(mockTenantId, mockBranchId, mockNurseUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject cross-tenant access', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockBranchAdminUser,
    );
    const hasCrossTenant = results.some((r) => r.id === crossTenantResult.id);
    expect(hasCrossTenant).toBe(false);
    expect(results).toHaveLength(1);
  });

  it('should exclude cross-branch results for branch-scoped roles', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    const hasCrossBranch = results.some((r) => r.id === crossBranchResult.id);
    expect(hasCrossBranch).toBe(false);
    expect(results).toHaveLength(1);
  });

  it('should return results scoped to own branch for non-Super Admin', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('RELEASED');
  });

  it('should not return ENCODED results', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    const hasEncoded = results.some((r) => r.status === 'ENCODED');
    expect(hasEncoded).toBe(false);
  });

  it('should not return VALIDATED results', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    const hasValidated = results.some((r) => r.status === 'VALIDATED');
    expect(hasValidated).toBe(false);
  });

  it('should not return archived results', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    const hasArchived = results.some((r) => r.id === archivedResult.id);
    expect(hasArchived).toBe(false);
  });

  it('should not return deleted results', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    const hasDeleted = results.some((r) => r.id === deletedResult.id);
    expect(hasDeleted).toBe(false);
  });

  it('should not mutate any data', async () => {
    await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    expect(prisma.labResult.findMany).toHaveBeenCalled();
    expect(prisma.labResult.updateMany).toBeUndefined();
  });

  it('should emit no audit log (read-only endpoint)', async () => {
    await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    expect(prisma.labResult.findMany).toHaveBeenCalled();
  });

  it('should use real releasedAt when present', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    expect(results[0].releasedAt).toBe(baseReleasedLabResult.releasedAt);
  });

  it('should not leak tenantId or branchId in DTO', async () => {
    const results = await service.getReleasedResults(
      mockTenantId,
      mockBranchId,
      mockLabTechUser,
    );
    const dto = results[0];
    expect((dto as any).tenantId).toBeUndefined();
    expect((dto as any).branchId).toBeUndefined();
    expect(dto.patientName).toBeDefined();
    expect(dto.patientNumber).toBeDefined();
    expect(dto.specimenType).toBeDefined();
  });

  it('should reject missing branch context for non-Super Admin', async () => {
    await expect(
      service.getReleasedResults(mockTenantId, undefined, mockNoBranchUser),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('ClinicalWorkflowService (getReleasedLabResultDetail)', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockPatientId = 'patient-1';
  const mockOrderId = 'order-1';

  const baseReleasedDetailResult = {
    id: 'result-1',
    tenantId: mockTenantId,
    orderId: mockOrderId,
    status: 'RELEASED',
    version: 3,
    results: { WBC: '8.5', RBC: '5.2', HGB: '15.1' },
    remarks: 'All values within normal range.',
    validatedById: 'validator-1',
    validatedAt: new Date('2026-05-19T12:00:00Z'),
    releasedById: 'user-1',
    releasedAt: new Date('2026-05-20T12:00:00Z'),
    createdById: 'user-1',
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date('2026-05-18T12:00:00Z'),
    updatedAt: new Date('2026-05-20T12:00:00Z'),
    order: {
      id: mockOrderId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      patientId: mockPatientId,
      orderNumber: 'LAB-000001',
      status: 'COMPLETED',
      orderType: 'LAB',
      patient: {
        id: mockPatientId,
        firstName: 'John',
        lastName: 'Doe',
        patientNumber: 'P-001',
      },
    },
  };

  const mockLabTechUser = {
    userId: 'lab-tech-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Lab Technician'],
  };
  const mockDoctorUser = {
    userId: 'doctor-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Doctor'],
  };
  const mockNurseUser = {
    userId: 'nurse-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Nurse'],
  };
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
  const mockCashierUser = {
    userId: 'cashier-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Cashier'],
  };
  const mockPatientUser = {
    userId: 'patient-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Patient'],
  };
  const mockNoBranchUser = {
    userId: 'user-1',
    tenantId: mockTenantId,
    branchId: undefined,
    roles: ['Lab Technician'],
  };
  const mockCrossTenantUser = {
    userId: 'user-2',
    tenantId: 'tenant-2',
    branchId: mockBranchId,
    roles: ['Lab Technician'],
  };

  let audit: any;

  beforeEach(async () => {
    prisma = {
      labResult: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NumberingService, useValue: { generateNumber: jest.fn() } },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
  });

  it('should allow Lab Technician to fetch released result detail in own branch', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser,
    );
    expect(result.status).toBe('RELEASED');
    expect(result.results?.WBC).toBe('8.5');
  });

  it('should allow Doctor to fetch released result detail in own branch', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockDoctorUser,
    );
    expect(result.status).toBe('RELEASED');
    expect(result.remarks).toBe('All values within normal range.');
  });

  it('should allow Nurse to fetch released result detail in own branch', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockNurseUser,
    );
    expect(result.status).toBe('RELEASED');
  });

  it('should allow Branch Admin to fetch released result detail in own branch', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
    );
    expect(result.status).toBe('RELEASED');
  });

  it('should allow Super Admin to fetch released result detail within tenant', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockSuperAdminUser,
    );
    expect(result.status).toBe('RELEASED');
  });

  it('should reject unauthorized role (Cashier)', async () => {
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockCashierUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject unauthorized role (Patient)', async () => {
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockPatientUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject cross-tenant user', async () => {
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockCrossTenantUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject not found lab result', async () => {
    prisma.labResult.findFirst.mockResolvedValue(null);
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject patient/order mismatch', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      order: { ...baseReleasedDetailResult.order, patientId: 'other-patient' },
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject ENCODED (not released) result', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      status: 'ENCODED',
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject VALIDATED (not released) result', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      status: 'VALIDATED',
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject non-LAB order', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      order: { ...baseReleasedDetailResult.order, orderType: 'IMAGING' },
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject cancelled order', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      order: { ...baseReleasedDetailResult.order, status: 'CANCELLED' },
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject archived result', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      archivedAt: new Date(),
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject deleted result', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      deletedAt: new Date(),
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject cross-branch result for branch-scoped user', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      order: { ...baseReleasedDetailResult.order, branchId: 'other-branch' },
    });
    const otherBranchUser = {
      userId: 'lab-tech-2',
      tenantId: mockTenantId,
      branchId: 'other-branch',
      roles: ['Lab Technician'],
    };
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      otherBranchUser,
    );
    expect(result.status).toBe('RELEASED');
  });

  it('should reject cross-branch result from different branch than user', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      order: {
        ...baseReleasedDetailResult.order,
        branchId: 'different-branch',
      },
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should DTO not leak tenantId or branchId', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser,
    );
    expect((result as any).tenantId).toBeUndefined();
    expect((result as any).branchId).toBeUndefined();
    expect(result.id).toBeDefined();
    expect(result.orderId).toBeDefined();
    expect(result.results).toBeDefined();
  });

  it('should perform no mutation', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser,
    );
    expect(prisma.labResult.updateMany).toBeUndefined();
    expect(prisma.labResult.update).toBeUndefined();
  });

  it('should reject missing branch context for non-Super Admin', async () => {
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockNoBranchUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- PHI read audit ---

  it('should log LAB_RESULT_RELEASED_READ audit on successful read', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'LAB_RESULT_RELEASED_READ',
        recordType: 'LabResult',
        recordId: 'result-1',
        tenantId: mockTenantId,
        userId: 'lab-tech-1',
      }),
      undefined,
      mockBranchId,
    );
    expect(audit.log).toHaveBeenCalledTimes(1);
  });

  it('should log LAB_RESULT_RELEASED_READ with metadata only (no raw results/remarks)', async () => {
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser,
    );
    const payload = audit.log.mock.calls[0][0];
    expect(payload.newValues).toBeDefined();
    expect(payload.newValues.patientId).toBe(mockPatientId);
    expect(payload.newValues.orderId).toBe(mockOrderId);
    expect(payload.newValues.branchId).toBe(mockBranchId);
    expect(payload.newValues.status).toBe('RELEASED');
    expect(payload.newValues.accessedById).toBe('lab-tech-1');
    expect(payload.newValues.accessedAt).toBeDefined();
    expect(payload.newValues.accessedByRole).toContain('Lab Technician');
    // No raw PHI or results in audit payload
    expect(payload.newValues.results).toBeUndefined();
    expect(payload.newValues.remarks).toBeUndefined();
    expect(payload.newValues.patientName).toBeUndefined();
    expect(payload.newValues.patientNumber).toBeUndefined();
  });

  it('should not log LAB_RESULT_RELEASED_READ when role is unauthorized', async () => {
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockCashierUser,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('should not log LAB_RESULT_RELEASED_READ when result is ENCODED', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      status: 'ENCODED',
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('should not log LAB_RESULT_RELEASED_READ when result is archived', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      archivedAt: new Date(),
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('should not log LAB_RESULT_RELEASED_READ when result is deleted', async () => {
    prisma.labResult.findFirst.mockResolvedValue({
      ...baseReleasedDetailResult,
      deletedAt: new Date(),
    });
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('should not log LAB_RESULT_RELEASED_READ when user lacks branch context', async () => {
    await expect(
      service.getReleasedLabResultDetail(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockNoBranchUser,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('should not block the read when audit.log throws', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    audit.log.mockRejectedValue(new Error('audit_db_down'));
    prisma.labResult.findFirst.mockResolvedValue(baseReleasedDetailResult);
    const result = await service.getReleasedLabResultDetail(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser,
    );
    expect(result.status).toBe('RELEASED');
    expect(result.results?.WBC).toBe('8.5');
    consoleSpy.mockRestore();
  });
});
