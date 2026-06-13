import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { BillingService } from '../../billing/billing.service';
import { LabService } from '../../lab/lab.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PharmacyService } from '../../pharmacy/pharmacy.service';
import { NursingService } from '../../nursing/nursing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryNurseTaskDto } from '../../nursing/dto/query-nurse-task.dto';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { LedgerService } from '../../ledger/ledger.service';

const TENANT_A = 'tenant-A';
const BRANCH_A = 'branch-A';
const USER_A = 'user-A';

function prismaMock(): any {
  return {
    $transaction: jest.fn(async (cb: any) => cb(prismaMock())),
    patient: { count: jest.fn().mockResolvedValue(0) },
    encounter: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    labResult: { count: jest.fn().mockResolvedValue(0), findFirst: jest.fn() },
    branchStock: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
    },
    auditLog: { count: jest.fn().mockResolvedValue(0), create: jest.fn() },
    invoice: { findMany: jest.fn().mockResolvedValue([]) },
    inventoryItem: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
    },
    prescription: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
    },
    nurseTask: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('Branch Isolation — DashboardService', () => {
  let service: DashboardService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  it('getAdminSummary scopes branchId-dependent queries by passed branchId', async () => {
    await service.getAdminSummary(
      { branchId: BRANCH_A, dateFrom: '2026-01-01', dateTo: '2026-12-31' },
      USER_A,
      TENANT_A,
    );
    expect(prisma.encounter.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          branchId: BRANCH_A,
          tenantId: TENANT_A,
        }),
      }),
    );
    expect(prisma.branchStock.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          branchId: BRANCH_A,
          tenantId: TENANT_A,
        }),
      }),
    );
  });
});

describe('Branch Isolation — BillingService', () => {
  let service: BillingService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    const module = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('INV-001') },
        },
        {
          provide: ApprovalsService,
          useValue: { createRequest: jest.fn(), processRequest: jest.fn() },
        },
        { provide: LedgerService, useValue: { record: jest.fn() } },
      ],
    }).compile();
    service = module.get(BillingService);
  });

  it('getInvoices scopes by branchId', async () => {
    prisma.invoice.findMany.mockResolvedValue([]);
    await service.getInvoices(TENANT_A, BRANCH_A);
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          order: { tenantId: TENANT_A, branchId: BRANCH_A },
        }),
      }),
    );
  });
});

describe('Branch Isolation — LabService', () => {
  let service: LabService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
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

  it('findOne scopes by branchId in order chain', async () => {
    prisma.labResult.findFirst.mockResolvedValue(null);
    await expect(
      service.findOne(TENANT_A, BRANCH_A, 'result-b'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.labResult.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'result-b',
          order: { tenantId: TENANT_A, branchId: BRANCH_A },
          deletedAt: null,
        },
      }),
    );
  });
});

describe('Branch Isolation — InventoryService', () => {
  let service: InventoryService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  it('getCatalog scopes branchStocks by branchId', async () => {
    prisma.inventoryItem.findMany.mockResolvedValue([]);
    await service.getCatalog(TENANT_A, BRANCH_A);
    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_A, status: expect.any(String) },
        include: { branchStocks: { where: { branchId: BRANCH_A } } },
      }),
    );
  });
});

describe('Branch Isolation — PharmacyService', () => {
  let service: PharmacyService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
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
    userId: USER_A,
    tenantId: TENANT_A,
    branchId: BRANCH_A,
    roles: ['Pharmacist'],
  } as any;

  it('getPrescriptionQueue scopes by effectiveBranchId', async () => {
    prisma.prescription.findMany.mockResolvedValue([]);
    await service.getPrescriptionQueue(TENANT_A, undefined, mockUser, 'ACTIVE');
    expect(prisma.prescription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
        }),
      }),
    );
  });

  it('dispenseMedication rejects cross-branch prescription', async () => {
    prisma.prescription.findFirst.mockResolvedValue(null);
    await expect(
      service.dispenseMedication('rx-b', TENANT_A, mockUser, {
        quantity: 1,
        inventoryItemId: 'item-1',
        version: 1,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.prescription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rx-b', tenantId: TENANT_A } }),
    );
  });
});

describe('Branch Isolation — NursingService', () => {
  let service: NursingService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
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

  it('listTasks scopes by effectiveBranchId', async () => {
    prisma.nurseTask.findMany.mockResolvedValue([]);
    await service.listTasks(
      TENANT_A,
      BRANCH_A,
      new QueryNurseTaskDto(),
      mockUser,
    );
    expect(prisma.nurseTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_A,
          branchId: BRANCH_A,
        }),
      }),
    );
  });
});
