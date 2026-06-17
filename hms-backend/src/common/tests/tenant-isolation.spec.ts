import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PatientsService } from '../../patients/patients.service';
import { BillingService } from '../../billing/billing.service';
import { LabService } from '../../lab/lab.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PharmacyService } from '../../pharmacy/pharmacy.service';
import { NursingService } from '../../nursing/nursing.service';
import { AdminService } from '../../admin/admin.service';
import { MetricsService } from '../../admin/metrics.service';
import { AuditService } from '../../audit/audit.service';
import { EncountersService } from '../../encounters/encounters.service';
import { OrdersService } from '../../orders/orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NumberingService } from '../../numbering/numbering.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { LedgerService } from '../../ledger/ledger.service';

const TENANT_A = 'tenant-A';
const USER_A = 'user-A';
const BRANCH_A = 'branch-A';

describe('Tenant Isolation — PatientsService', () => {
  let service: PatientsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      patient: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('P-001') },
        },
      ],
    }).compile();
    service = module.get(PatientsService);
  });

  it('findOne rejects cross-tenant patient', async () => {
    prisma.patient.findFirst.mockResolvedValue(null);
    await expect(service.findOne(TENANT_A, 'any-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.patient.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'any-id',
          tenantId: TENANT_A,
          archivedAt: null,
        }),
      }),
    );
  });

  it('findAll scopes by tenantId', async () => {
    await service.findAll(TENANT_A);
    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
  });

  it('update scopes by tenantId in query', async () => {
    prisma.patient.findFirst.mockResolvedValue({
      id: 'p1',
      tenantId: TENANT_A,
      firstName: 'X',
      lastName: 'Y',
      dob: new Date(),
    });
    prisma.patient.updateMany.mockResolvedValue({ count: 1 });
    prisma.patient.findFirst.mockResolvedValueOnce({
      id: 'p1',
      tenantId: TENANT_A,
      firstName: 'A',
      lastName: 'B',
      dob: new Date(),
    });
    const result = await service.update(TENANT_A, USER_A, 'p1', {
      firstName: 'Updated',
    });
    expect(result).toBeDefined();
    expect(prisma.patient.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'p1',
          tenantId: TENANT_A,
          archivedAt: null,
        }),
      }),
    );
  });
});

describe('Tenant Isolation — BillingService', () => {
  let service: BillingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      payment: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      cashierSession: {
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
      paymentReversal: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
      refund: { create: jest.fn() },
      paymentVoid: { create: jest.fn() },
      cashierLedgerEntry: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      approvalRequest: {
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      idempotencyRecord: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const module = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: ApprovalsService,
          useValue: { createRequest: jest.fn(), processRequest: jest.fn() },
        },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('R-001') },
        },
        { provide: LedgerService, useValue: { postEntry: jest.fn() } },
      ],
    }).compile();
    service = module.get(BillingService);
  });

  it('requestRefund rejects cross-tenant payment', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    await expect(
      service.requestRefund(TENANT_A, USER_A, BRANCH_A, {
        paymentId: 'p-b',
        amount: 100,
        reason: 'test',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'p-b',
          cashierSession: { tenantId: TENANT_A, branchId: BRANCH_A },
        },
      }),
    );
  });

  it('requestVoid rejects cross-tenant payment', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    await expect(
      service.requestVoid(TENANT_A, USER_A, BRANCH_A, {
        paymentId: 'p-b',
        reason: 'test',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('getInvoices scopes by tenantId', async () => {
    prisma.invoice.findMany.mockResolvedValue([]);
    await service.getInvoices(TENANT_A, BRANCH_A);
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { order: { tenantId: TENANT_A, branchId: BRANCH_A } },
      }),
    );
  });

  it('applyVoid rejects cross-tenant reversal', async () => {
    prisma.paymentReversal.findFirst.mockResolvedValue(null);
    await expect(
      service.applyVoid(TENANT_A, USER_A, BRANCH_A, 'rv-b'),
    ).rejects.toThrow(NotFoundException);
  });

  it('applyRefund rejects cross-tenant reversal', async () => {
    prisma.paymentReversal.findFirst.mockResolvedValue(null);
    await expect(
      service.applyRefund(TENANT_A, USER_A, BRANCH_A, 'rv-b'),
    ).rejects.toThrow(NotFoundException);
  });

  it('approveVoid rejects cross-tenant reversal', async () => {
    prisma.paymentReversal.findFirst.mockResolvedValue(null);
    await expect(
      service.approveVoid(TENANT_A, USER_A, BRANCH_A, 'rv-b', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejectRefund rejects cross-tenant reversal', async () => {
    prisma.paymentReversal.findFirst.mockResolvedValue(null);
    await expect(
      service.rejectRefund(TENANT_A, USER_A, BRANCH_A, 'rv-b', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('openSession scopes by tenantId', async () => {
    prisma.cashierSession.findFirst.mockResolvedValue(null);
    prisma.cashierSession.create.mockResolvedValue({
      id: 'session-1',
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      userId: USER_A,
      status: 'OPEN',
      openingBalance: 0,
    });
    await service.openSession(TENANT_A, USER_A, BRANCH_A, {
      openingBalance: 0,
      branchId: BRANCH_A,
    });
    expect(prisma.cashierSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: TENANT_A,
          userId: USER_A,
          branchId: BRANCH_A,
          status: 'OPEN',
        },
      }),
    );
  });
});

describe('Tenant Isolation — LabService', () => {
  let service: LabService;
  let prisma: any;

  beforeEach(async () => {
    const mockOrder = {
      id: 'o1',
      tenantId: TENANT_A,
      branchId: BRANCH_A,
      patient: {
        id: 'p1',
        firstName: 'A',
        lastName: 'B',
        patientNumber: 'P-001',
      },
      clinicalItems: [],
    };
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      labResult: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      labSpecimen: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      labParameterDefinition: { findMany: jest.fn().mockResolvedValue([]) },
      labTestKit: { findUnique: jest.fn() },
      notification: { create: jest.fn() },
      user: { findUnique: jest.fn() },
      order: { findFirst: jest.fn().mockResolvedValue(mockOrder) },
      audit: { findFirst: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        LabService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: ApprovalsService,
          useValue: { createRequest: jest.fn(), processRequest: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(LabService);
  });

  it('findOne rejects cross-tenant lab result', async () => {
    prisma.labResult.findFirst.mockResolvedValue(null);
    await expect(
      service.findOne(TENANT_A, BRANCH_A, 'result-b'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.labResult.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'result-b',
          order: { tenantId: TENANT_A, branchId: BRANCH_A },
          deletedAt: null,
          archivedAt: null,
        }),
      }),
    );
  });

  it('getPendingWorklist scopes by tenantId and excludes archived', async () => {
    prisma.labResult.findMany.mockResolvedValue([]);
    await service.getPendingWorklist(TENANT_A, BRANCH_A);
    expect(prisma.labResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          order: { tenantId: TENANT_A, branchId: BRANCH_A },
          archivedAt: null,
        }),
      }),
    );
  });
});

describe('Tenant Isolation — InventoryService', () => {
  let service: InventoryService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      inventoryItem: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      branchStock: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      stockLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      notification: { findFirst: jest.fn(), create: jest.fn() },
    };
    prisma.branchStock.fields = { reorderLevel: 'reorderLevel' };
    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  it('getCatalog scopes by tenantId', async () => {
    prisma.inventoryItem.findMany.mockResolvedValue([]);
    await service.getCatalog(TENANT_A, BRANCH_A);
    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
  });

  it('updateItem rejects cross-tenant item', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValue(null);
    await expect(
      service.updateItem(TENANT_A, USER_A, 'item-b', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'item-b', tenantId: TENANT_A } }),
    );
  });

  it('deactivateItem rejects cross-tenant item', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValue(null);
    await expect(
      service.deactivateItem(TENANT_A, USER_A, 'item-b'),
    ).rejects.toThrow(NotFoundException);
  });

  it('receiveStock rejects cross-tenant item', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValue(null);
    await expect(
      service.receiveStock(TENANT_A, BRANCH_A, USER_A, 'item-b', {
        quantity: 10,
        supplierName: 'S',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('adjustStock rejects cross-tenant stock', async () => {
    prisma.branchStock.findFirst.mockResolvedValue(null);
    await expect(
      service.adjustStock(TENANT_A, BRANCH_A, USER_A, 'item-b', {
        newQuantity: 5,
        reason: 'adjust',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('getLowStockAlerts scopes by tenantId', async () => {
    prisma.branchStock.findMany.mockResolvedValue([]);
    await service.getLowStockAlerts(TENANT_A, BRANCH_A);
    expect(prisma.branchStock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A, branchId: BRANCH_A },
      }),
    );
  });
});

describe('Tenant Isolation — PharmacyService', () => {
  let service: PharmacyService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      prescription: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        PharmacyService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: InventoryService, useValue: { dispenseItem: jest.fn() } },
      ],
    }).compile();
    service = module.get(PharmacyService);
  });

  const mockUser = {
    userId: TENANT_A,
    tenantId: TENANT_A,
    branchId: BRANCH_A,
    roles: ['Pharmacist'],
  } as any;

  it('getPrescriptionQueue scopes by tenantId', async () => {
    prisma.prescription.findMany.mockResolvedValue([]);
    await service.getPrescriptionQueue(TENANT_A, BRANCH_A, mockUser, 'ACTIVE');
    expect(prisma.prescription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
  });

  it('dispenseMedication rejects cross-tenant prescription', async () => {
    prisma.prescription.findFirst.mockResolvedValue(null);
    await expect(
      service.dispenseMedication('rx-b', TENANT_A, mockUser, {
        quantity: 1,
        inventoryItemId: 'item-1',
        version: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('Tenant Isolation — NursingService', () => {
  let service: NursingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      nurseTask: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      order: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const module = await Test.createTestingModule({
      providers: [
        NursingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = module.get(NursingService);
  });

  const mockUser = {
    userId: USER_A,
    tenantId: TENANT_A,
    branchId: BRANCH_A,
    roles: ['Nurse'],
  } as any;

  it('listTasks scopes by tenantId', async () => {
    prisma.nurseTask.findMany.mockResolvedValue([]);
    await service.listTasks(TENANT_A, BRANCH_A, {}, mockUser);
    expect(prisma.nurseTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
  });
});

describe('Tenant Isolation — AdminService', () => {
  let service: AdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      userBranch: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      permission: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      rolePermission: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      branch: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      tenant: { findUnique: jest.fn() },
      roleChangeRequest: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      permissionChangeRequest: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      privilegedUserChangeRequest: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      privilegeEscalationRequest: { create: jest.fn(), findFirst: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: MetricsService,
          useValue: { getMetrics: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  const mockActor = {
    userId: USER_A,
    tenantId: TENANT_A,
    roles: ['Super Admin'],
  } as any;

  it('createUser scopes branch lookup by actor tenant', async () => {
    prisma.branch.findMany.mockResolvedValue([
      { id: 'b1', tenantId: TENANT_A },
    ]);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u-new', tenantId: TENANT_A });
    const result = await service.createUser(mockActor, {
      email: 'test@test.com',
      firstName: 'A',
      lastName: 'B',
      password: 'Pass123!',
      reason: 'Creating tenant isolation test user',
      roleNames: ['Doctor'],
      branchIds: ['b1'],
    } as any);
    expect(prisma.branch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['b1'] }, tenantId: TENANT_A },
      }),
    );
    expect(result).toBeDefined();
  });
});

describe('Tenant Isolation — AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
    };
    const module = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AuditService);
  });

  it('findAll scopes by tenantId', async () => {
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([]);
    await service.findAll(TENANT_A, undefined, [], {});
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
  });
});

describe('Tenant Isolation — EncountersService', () => {
  let service: EncountersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      encounter: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        EncountersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = module.get(EncountersService);
  });

  it('findOne rejects cross-tenant encounter', async () => {
    prisma.encounter.findFirst.mockResolvedValue(null);
    await expect(service.findOne(TENANT_A, 'enc-b')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.encounter.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'enc-b',
          tenantId: TENANT_A,
          archivedAt: null,
        }),
      }),
    );
  });
});

describe('Tenant Isolation — OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      order: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('O-001') },
        },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('findOne rejects cross-tenant order', async () => {
    prisma.order.findFirst.mockResolvedValue(null);
    await expect(
      service.findOne(TENANT_A, BRANCH_A, 'order-b'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-b', tenantId: TENANT_A, branchId: BRANCH_A },
      }),
    );
  });
});
