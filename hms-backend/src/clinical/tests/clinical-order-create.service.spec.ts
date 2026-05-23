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
import { CreateClinicalOrderDto } from '../dto/create-clinical-order.dto';

describe('ClinicalWorkflowService.createClinicalOrder', () => {
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

  const validDto: CreateClinicalOrderDto = {
    orderType: 'LAB',
    priority: 'ROUTINE',
    clinicalIndication: 'Routine checkup',
    items: [{ itemName: 'Complete Blood Count' }],
  };

  const createMockClinicalItem = (overrides = {}) => ({
    id: 'item-1',
    itemName: 'Complete Blood Count',
    notes: null,
    status: 'PENDING',
    createdAt: new Date(),
    ...overrides,
  });

  const mockOrder = (overrides = {}) => ({
    id: 'order-1',
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
    createdById: userId,
    updatedById: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    clinicalItems: [createMockClinicalItem()],
    ...overrides,
  });

  function createMockPrisma() {
    const mockTx = {
      encounter: {
        findUnique: jest.fn(),
      },
      order: {
        create: jest.fn(),
      },
    };

    const mockPrisma = {
      $transaction: jest.fn((cb: (tx: any) => any) => cb(mockTx)),
      encounter: {
        findUnique: mockTx.encounter.findUnique,
      },
      order: {
        create: mockTx.order.create,
      },
    };

    return { mockPrisma, mockTx };
  }

  const numberingService = {
    generateNumber: jest.fn().mockResolvedValue('CLN-000001'),
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
    numberingService.generateNumber.mockResolvedValue('CLN-000001');
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
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        noRoleUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 2. Patient role rejected ---
  it('should reject Patient role', async () => {
    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        patientUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 3. Nurse role rejected ---
  it('should reject Nurse role', async () => {
    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        nurseUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 4. Cashier role rejected ---
  it('should reject Cashier role', async () => {
    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        cashierUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 5. Lab Technician rejected for order creation ---
  it('should reject Lab Technician role for order creation', async () => {
    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
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
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        noBranchUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 7. Branch A doctor cannot create order for Branch B encounter ---
  it('should reject cross-branch order creation', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(
      mockEncounter({ branchId: otherBranchId }),
    );

    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 8. Tenant mismatch rejected ---
  it('should reject tenant mismatch', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(
      mockEncounter({ tenantId: otherTenantId }),
    );

    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 9. Route patientId mismatch rejected ---
  it('should reject patientId mismatch', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(
      mockEncounter({ patientId: 'other-patient' }),
    );

    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 10. Nonexistent encounter rejected ---
  it('should reject nonexistent encounter', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(null);

    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // --- 11. Closed/finalized encounter rejected ---
  it.each(['FINISHED', 'CANCELLED', 'CLOSED', 'ENTERED_IN_ERROR'])(
    'should reject %s encounter',
    async (status) => {
      const { mockTx } = createMockPrisma();
      prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
      mockTx.encounter.findUnique.mockResolvedValue(mockEncounter({ status }));

      await expect(
        service.createClinicalOrder(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(BadRequestException);
    },
  );

  // --- 12. Archived encounter rejected ---
  it('should reject archived encounter', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(
      mockEncounter({ archivedAt: new Date() }),
    );

    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --- 13. Empty items array — itemCount derived from persisted ClinicalOrderItems ---
  it('should report zero item count when items array is empty', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder({ clinicalItems: [] }));

    const emptyDto: CreateClinicalOrderDto = {
      orderType: 'LAB',
      items: [],
    };

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      emptyDto,
    );

    expect(result).toBeDefined();
    expect(result.itemCount).toBe(0);
    expect(result.items).toEqual([]);
    // Verify ClinicalOrderItems are created via nested create
    const createCall = mockTx.order.create.mock.calls[0][0];
    expect(createCall.data.clinicalItems.create).toEqual([]);
  });

  // --- 14. Invalid order type stored as-is (DTO @IsEnum enforced at controller level)
  it('should store order type as-is when not validated at service level', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder({ orderType: 'PHARMACY' }));

    const invalidDto = {
      orderType: 'PHARMACY',
      items: [{ itemName: 'Test' }],
    };

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      invalidDto,
    );

    expect(result).toBeDefined();
    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderType: 'PHARMACY',
        }),
      }),
    );
  });

  // --- 15. Invalid priority rejected at service level ---
  it('should default to ROUTINE when priority is invalid at service level', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    const dto: CreateClinicalOrderDto = {
      orderType: 'LAB',
      priority: undefined,
      items: [{ itemName: 'CBC' }],
    };

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      dto,
    );

    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          priority: 'ROUTINE',
        }),
      }),
    );
  });

  // --- 16. Clinical order items are persisted as ClinicalOrderItem records ---
  it('should persist clinical order items as ClinicalOrderItem records', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockImplementation((args) =>
      mockOrder({
        clinicalItems: args.data.clinicalItems.create.map((item: any) => ({
          id: 'item-generated',
          itemName: item.itemName,
          notes: item.notes,
          status: 'PENDING',
          createdAt: new Date(),
        })),
      }),
    );

    const longName = 'A'.repeat(201);
    const dto = {
      orderType: 'LAB',
      items: [{ itemName: longName }],
    };

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      dto,
    );

    expect(result).toBeDefined();
    expect(result.itemCount).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].itemName).toBe(longName);
    expect(result.items[0].status).toBe('PENDING');
    // Verify no OrderItem (billing) records are created
    const createCall = mockTx.order.create.mock.calls[0][0];
    expect(createCall.data.items).toBeUndefined();
  });

  // --- 17. Overlong clinicalIndication stored as-is (DTO @MaxLength enforced at controller level) ---
  it('should store overlong clinicalIndication when bypassing DTO validation', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    const longIndication = 'A'.repeat(501);
    const dto = {
      orderType: 'LAB',
      items: [{ itemName: 'CBC' }],
      clinicalIndication: longIndication,
    };

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      dto,
    );

    expect(result).toBeDefined();
    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clinicalIndication: longIndication,
        }),
      }),
    );
  });

  // --- 18. Valid Doctor order creation succeeds ---
  it('should create order successfully for Doctor', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('order-1');
    expect(result.status).toBe('PENDING');
    expect(result.orderType).toBe('LAB');
    expect(result.itemCount).toBe(1);
  });

  // --- 19. Branch Admin can create orders ---
  it('should create order successfully for Branch Admin', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      branchAdminUser,
      validDto,
    );

    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');
  });

  // --- 20. Super Admin can create orders ---
  it('should create order successfully for Super Admin', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      superAdminUser,
      validDto,
    );

    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');
  });

  // --- 21. Audit log created in same transaction ---
  it('should create audit log in same transaction', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        userId,
        eventKey: 'CLINICAL_ORDER_CREATED',
        recordType: 'Order',
        recordId: 'order-1',
      }),
      mockTx,
      branchId,
    );
  });

  // --- 22. Audit log excludes raw long clinical indication text ---
  it('should not store raw long clinicalIndication in audit log', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    const auditCall = auditService.log.mock.calls[0][0];
    expect(auditCall.newValues).not.toHaveProperty('clinicalIndication');
    expect(auditCall.newValues).toHaveProperty('orderType');
    expect(auditCall.newValues).toHaveProperty('priority');
    expect(auditCall.newValues).toHaveProperty('itemCount');
    expect(auditCall.newValues).toHaveProperty('status');
    expect(auditCall.newValues.status).toBe('PENDING');
  });

  // --- 23. Order status is safe initial state only ---
  it('should create order with PENDING status only', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(result.status).toBe('PENDING');
    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
        }),
      }),
    );
  });

  // --- 24. No lab result created ---
  it('should not create a lab result record', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    // We verify that labResult.create is never called
    mockTx.labResult = { create: jest.fn() };

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.labResult?.create).not.toHaveBeenCalled();
  });

  // --- 25. No prescription created ---
  it('should not create a prescription', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    mockTx.prescription = { create: jest.fn() };

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.prescription?.create).not.toHaveBeenCalled();
  });

  // --- 26. No billing/invoice/payment mutation occurs ---
  it('should not create invoice or payment', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    mockTx.invoice = { create: jest.fn() };
    mockTx.payment = { create: jest.fn() };

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.invoice?.create).not.toHaveBeenCalled();
    expect(mockTx.payment?.create).not.toHaveBeenCalled();
  });

  // --- 27. No SOAP status mutation occurs ---
  it('should not mutate SOAP note status', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    mockTx.clinicalNote = { update: jest.fn() };

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(mockTx.clinicalNote?.update).not.toHaveBeenCalled();
  });

  // --- 28. Returned DTO is safe and not raw Prisma entity ---
  it('should return safe DTO without raw Prisma fields', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    // Check safe DTO shape
    expect(result).not.toHaveProperty('tenantId');
    expect(result).not.toHaveProperty('branchId');
    expect(result).not.toHaveProperty('version');
    expect(result).not.toHaveProperty('deletedAt');
    expect(result).not.toHaveProperty('createdById');
    expect(result).not.toHaveProperty('updatedById');

    // Check required DTO fields
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('orderNumber');
    expect(result).toHaveProperty('patientId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('itemCount');
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('orderType');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('accessLabel');
    expect(result).toHaveProperty('isReadOnly');
    expect(result.isReadOnly).toBe(true);
    expect(Array.isArray(result.items)).toBe(true);
  });

  // --- 29. Order number is generated using NumberingService ---
  it('should generate order number via NumberingService in the same transaction', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());

    const generatedNumber = 'CLN-000042';
    numberingService.generateNumber.mockResolvedValue(generatedNumber);
    mockTx.order.create.mockImplementation((args) =>
      mockOrder({ orderNumber: args.data.orderNumber }),
    );

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(result.orderNumber).toBe(generatedNumber);
    expect(numberingService.generateNumber).toHaveBeenCalledWith(
      tenantId,
      'CLINICAL_ORDER',
      branchId,
      mockTx,
    );
  });

  // --- 30. Order number comes from NumberingService (not random generation) ---
  it('should not use random order number generation', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    numberingService.generateNumber.mockResolvedValue('CLN-000050');
    mockTx.order.create.mockImplementation((args) =>
      mockOrder({ orderNumber: args.data.orderNumber }),
    );

    const result = await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      validDto,
    );

    expect(result.orderNumber).toMatch(/^CLN-/);
    expect(result.orderNumber).toBe('CLN-000050');
    expect(numberingService.generateNumber).toHaveBeenCalledTimes(1);
  });

  // --- 31. catalogCode resolves server-side to the correct LabTestDefinition ---
  it('should resolve catalogCode to labTestDefinitionId', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());
    mockTx.labTestDefinition = {
      findFirst: jest.fn().mockResolvedValue({ id: 'def-1' }),
    };

    const dto: CreateClinicalOrderDto = {
      orderType: 'LAB',
      items: [{ itemName: 'CBC', catalogCode: 'CBC-CODE' }],
    };

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      dto,
    );

    expect(mockTx.labTestDefinition.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId, code: 'CBC-CODE', isActive: true },
      }),
    );
    const createCall = mockTx.order.create.mock.calls[0][0];
    expect(createCall.data.clinicalItems.create[0].labTestDefinitionId).toBe(
      'def-1',
    );
  });

  // --- 32. cross-tenant or invalid catalog definitions are rejected (fail closed) ---
  it('should reject order if catalogCode is invalid or cross-tenant', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());
    mockTx.labTestDefinition = {
      // Simulate not found because of tenant isolation or invalid
      findFirst: jest.fn().mockResolvedValue(null),
    };

    const dto: CreateClinicalOrderDto = {
      orderType: 'LAB',
      items: [{ itemName: 'CBC', catalogCode: 'CBC-INVALID' }],
    };

    await expect(
      service.createClinicalOrder(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        dto,
      ),
    ).rejects.toThrow('validation_error: invalid_lab_test_catalog_code');

    // Ensure no partial order is created
    expect(mockTx.order.create).not.toHaveBeenCalled();
  });

  // --- 33. missing catalogCode preserves legacy behavior ---
  it('should preserve legacy behavior without catalogCode', async () => {
    const { mockTx } = createMockPrisma();
    prisma.$transaction = jest.fn((cb: any) => cb(mockTx));
    mockTx.encounter.findUnique.mockResolvedValue(mockEncounter());
    mockTx.order.create.mockResolvedValue(mockOrder());
    mockTx.labTestDefinition = {
      findFirst: jest.fn(),
    };

    const dto: CreateClinicalOrderDto = {
      orderType: 'LAB',
      items: [{ itemName: 'Legacy Test' }],
    };

    await service.createClinicalOrder(
      patientId,
      encounterId,
      tenantId,
      doctorUser,
      dto,
    );

    expect(mockTx.labTestDefinition.findFirst).not.toHaveBeenCalled();
    const createCall = mockTx.order.create.mock.calls[0][0];
    expect(
      createCall.data.clinicalItems.create[0].labTestDefinitionId,
    ).toBeNull();
    expect(createCall.data.clinicalItems.create[0].itemName).toBe(
      'Legacy Test',
    );
  });
});
