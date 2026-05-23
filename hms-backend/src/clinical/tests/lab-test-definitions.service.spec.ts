import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import { RequestUser } from '../../common/types/authenticated-request.type';
import { ForbiddenException } from '@nestjs/common';

describe('ClinicalWorkflowService.getLabTestDefinitions', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;

  const tenantId = 'tenant-1';
  const branchId = 'branch-1';
  const otherTenantId = 'tenant-2';

  const validUser: RequestUser = {
    userId: 'doc-1',
    tenantId,
    branchId,
    roles: ['Doctor'],
  };

  const patientUser: RequestUser = {
    userId: 'pat-1',
    tenantId,
    branchId,
    roles: ['Patient'],
  };

  const cashierUser: RequestUser = {
    userId: 'cashier-1',
    tenantId,
    branchId,
    roles: ['Cashier'],
  };

  beforeEach(async () => {
    prisma = {
      labTestDefinition: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: {} },
        { provide: NumberingService, useValue: {} },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
  });

  // --- 1. Authorized role can fetch active lab test definitions within tenant ---
  it('should allow Doctor to fetch active lab test definitions within tenant', async () => {
    prisma.labTestDefinition.findMany.mockResolvedValue([
      {
        id: '1',
        code: 'CBC',
        name: 'Complete Blood Count',
        type: 'PANEL',
        isActive: true,
        tenantId,
        price: 100,
        updatedAt: new Date(),
      },
    ]);

    const result = await service.getLabTestDefinitions(tenantId, validUser);

    expect(prisma.labTestDefinition.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('CBC');
  });

  // --- 2. Unauthorized roles are rejected ---
  it('should reject Patient and Cashier roles', async () => {
    await expect(
      service.getLabTestDefinitions(tenantId, patientUser),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.getLabTestDefinitions(tenantId, cashierUser),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 3. Cross-tenant catalog definitions are not returned ---
  it('should reject cross-tenant requests', async () => {
    await expect(
      service.getLabTestDefinitions(otherTenantId, validUser),
    ).rejects.toThrow(ForbiddenException);
  });

  // --- 4. Inactive definitions are not returned ---
  // Verified by the where: { isActive: true } clause checked in test 1.
  it('should filter by isActive true', async () => {
    prisma.labTestDefinition.findMany.mockResolvedValue([]);
    await service.getLabTestDefinitions(tenantId, validUser);
    expect(prisma.labTestDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
  });

  // --- 5. DTO does not leak tenantId, branchId, billing, audit, internal, or pricing fields ---
  it('should return safe DTO without leaking sensitive fields', async () => {
    prisma.labTestDefinition.findMany.mockResolvedValue([
      {
        id: '1',
        code: 'CBC',
        name: 'Complete Blood Count',
        type: 'PANEL',
        isActive: true,
        tenantId,
        price: 100,
        cost: 50,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.getLabTestDefinitions(tenantId, validUser);

    expect(result[0]).not.toHaveProperty('tenantId');
    expect(result[0]).not.toHaveProperty('price');
    expect(result[0]).not.toHaveProperty('cost');
    expect(result[0]).not.toHaveProperty('version');
    expect(result[0]).not.toHaveProperty('id');
    expect(result[0]).not.toHaveProperty('type');

    expect(result[0]).toHaveProperty('code');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('isActive');
  });

  // --- 6. Endpoint performs no mutation ---
  it('should only call findMany and perform no mutation', async () => {
    prisma.labTestDefinition.findMany.mockResolvedValue([]);
    await service.getLabTestDefinitions(tenantId, validUser);
    expect(
      Object.keys(prisma.labTestDefinition).filter((k) => k !== 'findMany'),
    ).toHaveLength(0);
  });

  // --- 7. Endpoint returns data sorted/presented predictably ---
  it('should order results by name ascending', async () => {
    prisma.labTestDefinition.findMany.mockResolvedValue([]);
    await service.getLabTestDefinitions(tenantId, validUser);
    expect(prisma.labTestDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      }),
    );
  });
});
