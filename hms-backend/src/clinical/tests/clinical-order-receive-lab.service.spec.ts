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

describe('ClinicalWorkflowService (receiveLabOrder)', () => {
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
    status: 'PENDING',
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
    specimenType: 'Whole Blood',
    collectionMode: 'ROUTINE',
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      labSpecimen: {
        findUnique: jest.fn(),
        create: jest.fn(),
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

  // --- 1. Unauthorized request rejected ---
  it('should reject request with missing roles', async () => {
    const user = {
      userId: mockUserId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      roles: [],
    };
    await expect(
      service.receiveLabOrder(
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
      service.receiveLabOrder(
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
      service.receiveLabOrder(
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
      service.receiveLabOrder(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockNurseUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 5. Doctor role rejected for receiving lab specimen ---
  it('should reject Doctor role', async () => {
    await expect(
      service.receiveLabOrder(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockDoctorUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 6. Lab Technician allowed ---
  it('should allow Lab Technician role', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-1',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    const result = await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.status).toBe('RECEIVED');
    expect(result.specimenType).toBe('Whole Blood');
  });

  // --- 7. Branch Admin allowed ---
  it('should allow Branch Admin role', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-2',
      orderId: mockOrderId,
      specimenType: 'Serum',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: 'branch-admin-1',
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    const result = await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockBranchAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.specimenType).toBe('Serum');
  });

  // --- 8. Super Admin allowed ---
  it('should allow Super Admin role', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-3',
      orderId: mockOrderId,
      specimenType: 'Urine',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: 'super-admin-1',
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    const result = await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockSuperAdminUser,
      validDto,
    );
    expect(result).toBeDefined();
    expect(result.specimenType).toBe('Urine');
  });

  // --- 9. Missing branchId fails closed ---
  it('should fail closed when branch-scoped user has no branchId', async () => {
    const user = mockLabTechUser({ branchId: undefined });
    await expect(
      service.receiveLabOrder(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        user,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 10. Branch A lab tech cannot receive Branch B order ---
  it('should reject cross-branch access', async () => {
    const crossBranchOrder = { ...baseOrder, branchId: 'branch-2' };
    prisma.order.findUnique.mockResolvedValue(crossBranchOrder);

    await expect(
      service.receiveLabOrder(
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
      service.receiveLabOrder(
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
      service.receiveLabOrder(
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
      service.receiveLabOrder(
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
      service.receiveLabOrder(
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
      service.receiveLabOrder(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 16. Terminal states rejected ---
  it.each(['COMPLETED', 'BILLED', 'DRAFT'])(
    'should reject %s order',
    async (status) => {
      const terminalOrder = { ...baseOrder, status };
      prisma.order.findUnique.mockResolvedValue(terminalOrder);

      await expect(
        service.receiveLabOrder(
          mockPatientId,
          mockOrderId,
          mockTenantId,
          mockLabTechUser(),
          validDto,
        ),
      ).rejects.toThrow(BadRequestException);
    },
  );

  // --- 17. Empty specimenType rejected ---
  it('should reject empty specimenType', async () => {
    await expect(
      service.receiveLabOrder(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        {
          ...validDto,
          specimenType: '',
        },
      ),
    ).rejects.toThrow();
  });

  // --- 18. Invalid collectionMode rejected ---
  it('should reject invalid collectionMode', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);

    await expect(
      service.receiveLabOrder(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        {
          ...validDto,
          collectionMode: 'INVALID',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 19. Overlong accessionNumber rejected ---
  it('should reject overlong accessionNumber', async () => {
    await expect(
      service.receiveLabOrder(
        mockPatientId,
        mockOrderId,
        mockTenantId,
        mockLabTechUser(),
        {
          ...validDto,
          accessionNumber: 'A'.repeat(51),
        },
      ),
    ).rejects.toThrow();
  });

  // --- 20. Valid Lab Technician receive succeeds ---
  it('should succeed for Lab Technician with valid data', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-4',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: 'ACC-001',
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    const dto = { ...validDto, accessionNumber: 'ACC-001' };
    const result = await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      dto,
    );
    expect(result).toBeDefined();
    expect(result.accessionNumber).toBe('ACC-001');
    expect(result.receivedById).toBe(mockUserId);
  });

  // --- 21. Status transition is safe and expected ---
  it('should transition order status to RECEIVED', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-5',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    const result = await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result.status).toBe('RECEIVED');
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockOrderId },
        data: expect.objectContaining({ status: 'RECEIVED' }),
      }),
    );
  });

  // --- 22. Specimen metadata persisted ---
  it('should persist specimen metadata via labSpecimen.create', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-6',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(prisma.labSpecimen.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          specimenType: 'Whole Blood',
          collectionMode: 'ROUTINE',
          receivedById: mockUserId,
        }),
      }),
    );
  });

  // --- 23. Audit log created in same transaction ---
  it('should create audit log in same transaction', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-7',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'LAB_ORDER_RECEIVED',
        recordType: 'LabSpecimen',
        newValues: expect.objectContaining({
          oldStatus: 'PENDING',
          newStatus: 'RECEIVED',
          specimenType: 'Whole Blood',
        }),
      }),
      prisma,
      mockBranchId,
    );
  });

  // --- 24. Audit log excludes raw clinical indication ---
  it('should exclude raw clinical indication from audit logs', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-8',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    const auditCall = audit.log.mock.calls[0][0];
    expect(auditCall.newValues).not.toHaveProperty('clinicalIndication');
  });

  // --- 25. No lab result value created ---
  it('should not create lab result values', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-9',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    // labResult should not be created or modified
    expect(prisma.labResult).toBeUndefined();
  });

  // --- 26. No result validation/release mutation occurs ---
  it('should not trigger result validation or release', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-10',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(prisma.labResult?.update).toBeUndefined();
    expect(prisma.labResult?.create).toBeUndefined();
  });

  // --- 27. No prescription mutation occurs ---
  it('should not mutate prescriptions', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-11',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(prisma.prescription).toBeUndefined();
  });

  // --- 28. No billing/invoice/payment mutation occurs ---
  it('should not mutate billing/invoices/payments', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-12',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(prisma.invoice).toBeUndefined();
    expect(prisma.payment).toBeUndefined();
  });

  // --- 29. No SOAP status mutation occurs ---
  it('should not mutate SOAP status', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-13',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(prisma.clinicalNote).toBeUndefined();
  });

  // --- 30. Order item records remain preserved ---
  it('should not delete or modify order items', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-14',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    // order items should not be touched
    expect(prisma.clinicalOrderItem?.deleteMany).toBeUndefined();
    expect(prisma.orderItem?.deleteMany).toBeUndefined();
  });

  // --- 31. Returned DTO is safe and not raw Prisma entity ---
  it('should return safe DTO, not raw entity', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    prisma.labSpecimen.findUnique.mockResolvedValue(null);
    prisma.labSpecimen.create.mockResolvedValue({
      id: 'spec-15',
      orderId: mockOrderId,
      specimenType: 'Whole Blood',
      accessionNumber: null,
      collectionMode: 'ROUTINE',
      collectedAt: null,
      receivedAt: new Date(),
      receivedById: mockUserId,
      status: 'RECEIVED',
      createdAt: new Date(),
    });
    prisma.order.update.mockResolvedValue({ ...baseOrder, status: 'RECEIVED' });

    const result = await service.receiveLabOrder(
      mockPatientId,
      mockOrderId,
      mockTenantId,
      mockLabTechUser(),
      validDto,
    );
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('specimenType');
    expect(result).toHaveProperty('receivedAt');
    expect(result).toHaveProperty('receivedById');
    expect(result).toHaveProperty('accessLabel');
    expect(result).toHaveProperty('isReadOnly');
    // Should NOT have raw Prisma internals
    expect(result).not.toHaveProperty('tenantId');
    expect(result).not.toHaveProperty('branchId');
  });
});
