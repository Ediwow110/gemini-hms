import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import type { RequestUser } from '../../common/types/authenticated-request.type';
import { CancelClinicalOrderDto } from '../dto/cancel-clinical-order.dto';

describe('ClinicalWorkflowService.cancelClinicalOrder', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const otherTenantId = 'tenant-b';
  const userId = 'doctor-1';
  const patientId = 'patient-1';
  const encounterId = 'encounter-1';
  const orderId = 'order-1';
  const otherOrderId = 'order-999';

  const mockEncounter = (overrides = {}) => ({
    id: encounterId,
    tenantId,
    branchId,
    patientId,
    status: 'IN_PROGRESS',
    type: 'OUTPATIENT',
    createdAt: new Date(),
    archivedAt: null,
    ...overrides,
  });

  const mockClinicalItem = (overrides = {}) => ({
    id: 'item-1',
    itemName: 'Complete Blood Count',
    notes: null,
    status: 'PENDING',
    createdAt: new Date(),
    ...overrides,
  });

  const mockOrder = (overrides = {}) => ({
    id: orderId,
    orderNumber: 'CLN-000001',
    tenantId,
    branchId,
    patientId,
    encounterId,
    status: 'PENDING',
    orderType: 'LAB',
    priority: 'ROUTINE',
    clinicalIndication: 'Routine checkup',
    requestedById: userId,
    requestedAt: new Date(),
    cancelledReason: null,
    cancelledById: null,
    cancelledAt: null,
    createdById: userId,
    updatedById: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    encounter: mockEncounter(),
    clinicalItems: [mockClinicalItem()],
    ...overrides,
  });

  const doctorUser: RequestUser = {
    userId,
    tenantId,
    branchId,
    roles: ['Doctor'],
  };

  const branchAdminUser: RequestUser = {
    userId: 'admin-branch-1',
    tenantId,
    branchId,
    roles: ['Branch Admin'],
  };

  const superAdminUser: RequestUser = {
    userId: 'super-admin-1',
    tenantId,
    roles: ['Super Admin'],
  };

  const nurseUser: RequestUser = {
    userId: 'nurse-1',
    tenantId,
    branchId,
    roles: ['Nurse'],
  };

  const patientUser: RequestUser = {
    userId: patientId,
    tenantId,
    roles: ['Patient'],
  };

  const cashierUser: RequestUser = {
    userId: 'cash-1',
    tenantId,
    branchId,
    roles: ['Cashier'],
  };

  const labUser: RequestUser = {
    userId: 'lab-1',
    tenantId,
    branchId,
    roles: ['Lab Technician'],
  };

  const validDto: CancelClinicalOrderDto = {
    reason: 'Order placed by mistake',
  };

  function createMockPrisma() {
    const mockTx = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockPrisma = {
      $transaction: jest.fn((cb: (tx: any) => any) => cb(mockTx)),
      order: {
        findUnique: mockTx.order.findUnique,
        update: mockTx.order.update,
      },
    };

    return { mockPrisma, mockTx };
  }

  const numberingService = {
    generateNumber: jest.fn(),
  };

  beforeEach(async () => {
    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        {
          provide: PrismaService,
          useValue: createMockPrisma().mockPrisma,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
        {
          provide: NumberingService,
          useValue: numberingService,
        },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. Unauthorized request rejected ---
  it('should reject when user has no roles', async () => {
    const noRoleUser: RequestUser = {
      userId: 'no-role',
      tenantId,
      branchId,
      roles: [],
    };
    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        noRoleUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 2. Patient role rejected ---
  it('should reject Patient role', async () => {
    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        patientUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 3. Nurse role rejected ---
  it('should reject Nurse role', async () => {
    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        nurseUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 4. Cashier role rejected ---
  it('should reject Cashier role', async () => {
    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        cashierUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 5. Lab Technician rejected for cancellation ---
  it('should reject Lab Technician role for cancellation', async () => {
    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        labUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 6. Missing branchId fails closed ---
  it('should fail closed when branch-scoped user has no branchId', async () => {
    const noBranchUser: RequestUser = {
      userId: 'doc-no-branch',
      tenantId,
      roles: ['Doctor'],
    };
    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        noBranchUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 7. Branch A doctor cannot cancel Branch B order ---
  it('should reject cross-branch order cancellation', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(
      mockOrder({ branchId: otherBranchId }),
    );

    const otherBranchDoctor: RequestUser = {
      userId: 'doc-branch-1',
      tenantId,
      branchId,
      roles: ['Doctor'],
    };

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        otherBranchDoctor,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 8. Tenant mismatch rejected ---
  it('should reject tenant mismatch', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(
      mockOrder({ tenantId: otherTenantId }),
    );

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 9. Route patientId mismatch rejected ---
  it('should reject patientId mismatch between route and order', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(
      mockOrder({ patientId: 'other-patient' }),
    );

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 10. Route encounterId mismatch rejected ---
  it('should reject encounterId mismatch between route and order', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(
      mockOrder({ encounterId: 'other-encounter' }),
    );

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 11. Route orderId mismatch rejected (nonexistent order) ---
  it('should reject nonexistent order', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(null);

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        otherOrderId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // --- 12. Already cancelled order rejected ---
  it('should reject already cancelled order', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(
      mockOrder({ status: 'CANCELLED' }),
    );

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 13. Terminal/completed/resulted/billed order rejected ---
  it('should reject COMPLETED order', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(
      mockOrder({ status: 'COMPLETED' }),
    );

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject BILLED order', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder({ status: 'BILLED' }));

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 14. Empty reason rejected ---
  it('should reject empty cancellation reason', async () => {
    const emptyDto = new CancelClinicalOrderDto();
    emptyDto.reason = '';

    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        emptyDto,
      ),
    ).rejects.toThrow();
  });

  // --- 15. Overlong reason rejected ---
  it('should reject overlong cancellation reason', async () => {
    const longReason = 'A'.repeat(301);
    const longDto = new CancelClinicalOrderDto();
    longDto.reason = longReason;

    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());

    await expect(
      service.cancelClinicalOrder(
        patientId,
        encounterId,
        orderId,
        tenantId,
        doctorUser,
        longDto,
      ),
    ).rejects.toThrow();
  });

  // --- 16. Valid Doctor cancellation succeeds ---
  it('should succeed for Doctor with valid cancellation', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(
      mockOrder({
        status: 'CANCELLED',
        cancelledReason: 'Order placed by mistake',
        cancelledById: userId,
        cancelledAt: new Date(),
      }),
    );

    const result = await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(result.status).toBe('CANCELLED');
    expect(result.cancelledReason).toBe('Order placed by mistake');
    expect(result.cancelledById).toBe(userId);
    expect(result.cancelledAt).toBeDefined();
    expect(mockTx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: orderId },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelledReason: 'Order placed by mistake',
          cancelledById: userId,
        }),
      }),
    );
  });

  // --- 17. Branch Admin cancellation succeeds ---
  it('should succeed for Branch Admin', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(
      mockOrder({
        status: 'CANCELLED',
        cancelledReason: 'Admin override',
        cancelledById: branchAdminUser.userId,
        cancelledAt: new Date(),
      }),
    );

    const adminDto: CancelClinicalOrderDto = {
      reason: 'Admin override',
    };

    const result = await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      branchAdminUser,
      adminDto,
    );

    expect(result.status).toBe('CANCELLED');
    expect(result.cancelledReason).toBe('Admin override');
    expect(result.cancelledById).toBe(branchAdminUser.userId);
  });

  // --- 18. Super Admin cancellation succeeds ---
  it('should succeed for Super Admin', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(
      mockOrder({
        status: 'CANCELLED',
        cancelledReason: 'Super Admin cancellation',
        cancelledById: superAdminUser.userId,
        cancelledAt: new Date(),
      }),
    );

    const superAdminDto: CancelClinicalOrderDto = {
      reason: 'Super Admin cancellation',
    };

    const result = await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      superAdminUser,
      superAdminDto,
    );

    expect(result.status).toBe('CANCELLED');
    expect(result.cancelledReason).toBe('Super Admin cancellation');
    expect(result.cancelledById).toBe(superAdminUser.userId);
  });

  // --- 19. Audit log created in same transaction ---
  it('should create audit log in same transaction', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(
      mockOrder({
        status: 'CANCELLED',
        cancelledReason: 'Test reason',
        cancelledById: userId,
        cancelledAt: new Date(),
      }),
    );

    await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(auditService.log).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'CLINICAL_ORDER_CANCELLED',
        recordType: 'Order',
        recordId: orderId,
        newValues: expect.objectContaining({
          patientId,
          encounterId,
          branchId,
          orderId,
          oldStatus: 'PENDING',
          newStatus: 'CANCELLED',
        }),
      }),
      mockTx,
      branchId,
    );
  });

  // --- 20. Audit log excludes raw long clinical indication and raw long reason ---
  it('should not store raw clinical indication or full reason in audit', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(
      mockOrder({
        status: 'CANCELLED',
        cancelledReason: 'Test reason',
        cancelledById: userId,
        cancelledAt: new Date(),
      }),
    );

    await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    const auditCall = auditService.log.mock.calls[0][0];
    expect(auditCall.newValues).not.toHaveProperty('clinicalIndication');
    expect(auditCall.newValues.reasonCode).toBeDefined();
    expect(auditCall.newValues.reasonCode.length).toBeLessThanOrEqual(100);
  });

  // --- 21. Order item records remain preserved ---
  it('should preserve clinical items after cancellation', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(
      mockOrder({
        status: 'CANCELLED',
        cancelledReason: 'Test',
        cancelledById: userId,
        cancelledAt: new Date(),
        clinicalItems: [mockClinicalItem()],
      }),
    );

    const result = await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].itemName).toBe('Complete Blood Count');
    expect(result.items[0].status).toBe('PENDING');
  });

  // --- 22. No lab result created or modified ---
  it('should not create or modify lab results', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(mockOrder({ status: 'CANCELLED' }));

    await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.order.update).toHaveBeenCalled();
    expect(mockTx.labResult).toBeUndefined();
  });

  // --- 23. No prescription created or modified ---
  it('should not create or modify prescriptions', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(mockOrder({ status: 'CANCELLED' }));

    await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.prescription).toBeUndefined();
  });

  // --- 24. No billing/invoice/payment mutation occurs ---
  it('should not mutate billing, invoice, or payment', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(mockOrder({ status: 'CANCELLED' }));

    await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.invoice).toBeUndefined();
    expect(mockTx.payment).toBeUndefined();
  });

  // --- 25. No SOAP status mutation occurs ---
  it('should not mutate SOAP status', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(mockOrder({ status: 'CANCELLED' }));

    await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.clinicalNote).toBeUndefined();
  });

  // --- 26. Returned DTO is safe and not raw Prisma entity ---
  it('should return safe DTO with expected shape', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.order.findUnique.mockResolvedValue(mockOrder());
    mockTx.order.update.mockResolvedValue(
      mockOrder({
        status: 'CANCELLED',
        cancelledReason: 'Test reason',
        cancelledById: userId,
        cancelledAt: new Date(),
      }),
    );

    const result = await service.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(result).not.toHaveProperty('tenantId');
    expect(result).not.toHaveProperty('branchId');
    expect(result).not.toHaveProperty('clinicalIndication');
    expect(result).not.toHaveProperty('encounterId');
    expect(result).not.toHaveProperty('deletedAt');
    expect(result).not.toHaveProperty('version');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('orderNumber');
    expect(result).toHaveProperty('patientId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('itemCount');
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('orderType');
    expect(result).toHaveProperty('cancelledReason');
    expect(result).toHaveProperty('cancelledById');
    expect(result).toHaveProperty('cancelledAt');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('accessLabel');
    expect(result).toHaveProperty('isReadOnly');
  });
});
