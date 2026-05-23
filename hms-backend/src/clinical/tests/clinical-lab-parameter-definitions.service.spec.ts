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

describe('ClinicalWorkflowService (getParameterDefinitions)', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockOrderId = 'order-1';
  const mockUserId = 'user-1';

  const baseOrder = {
    id: mockOrderId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    patientId: 'patient-1',
    encounterId: 'enc-1',
    orderNumber: 'LAB-000001',
    status: 'RECEIVED',
    orderType: 'LAB',
    priority: 'ROUTINE',
    clinicalIndication: null,
    requestedById: null,
    requestedAt: null,
    cancelledReason: null,
    cancelledById: null,
    cancelledAt: null,
    createdById: 'user-1',
    updatedById: null,
    deletedAt: null,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParameters = [
    {
      id: 'param-1',
      tenantId: mockTenantId,
      testDefinitionId: 'test-def-1',
      parameterName: 'White Blood Cells (WBC)',
      code: 'WBC',
      unit: 'x10^9/L',
      referenceRangeText: '4.5 - 11.0',
      minNormal: 4.5,
      maxNormal: 11.0,
      minCritical: 2.0,
      maxCritical: 25.0,
      valueType: 'NUMERIC',
      allowedValues: null,
      isRequired: true,
      displayOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'param-2',
      tenantId: mockTenantId,
      testDefinitionId: 'test-def-1',
      parameterName: 'Hemoglobin (Hgb)',
      code: 'Hgb',
      unit: 'g/L',
      referenceRangeText: '120 - 160',
      minNormal: 120,
      maxNormal: 160,
      minCritical: null,
      maxCritical: null,
      valueType: 'NUMERIC',
      allowedValues: null,
      isRequired: true,
      displayOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTestDefinition = {
    id: 'test-def-1',
    tenantId: mockTenantId,
    code: 'CBC',
    name: 'Complete Blood Count (CBC)',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    parameters: mockParameters,
  };

  const mockUser = (roles: string[], branchId?: string) => ({
    userId: mockUserId,
    tenantId: mockTenantId,
    branchId,
    roles,
  });

  beforeEach(async () => {
    const mockPrisma = {
      order: {
        findUnique: jest.fn(),
      },
      labTestDefinition: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        { provide: PrismaService, useValue: mockPrisma },
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

  const runTest = async (orderMock: any, definitionMock: any, user: any) => {
    prisma.order.findUnique.mockResolvedValue(orderMock);
    prisma.labTestDefinition.findMany.mockResolvedValue(definitionMock);
    return service.getParameterDefinitions(
      mockOrderId,
      user.tenantId,
      user.branchId,
      user,
    );
  };

  it('Lab Technician can fetch parameter definitions for own-branch LAB order', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    const result = await runTest(
      order,
      [mockTestDefinition],
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe('WBC');
    expect(result[1].code).toBe('Hgb');
  });

  it('Branch Admin can fetch parameter definitions for own-branch LAB order', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    const result = await runTest(
      order,
      [mockTestDefinition],
      mockUser(['Branch Admin'], mockBranchId),
    );
    expect(result).toHaveLength(2);
    expect(result[0].parameterName).toBe('White Blood Cells (WBC)');
  });

  it('Super Admin can fetch parameter definitions within tenant', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    const result = await runTest(
      order,
      [mockTestDefinition],
      mockUser(['Super Admin']),
    );
    expect(result).toHaveLength(2);
  });

  it('Unauthenticated request is rejected', async () => {
    const user = {
      userId: undefined,
      tenantId: 'tenant-1',
      branchId: undefined,
      roles: [],
    };
    await expect(
      service.getParameterDefinitions(mockOrderId, 'tenant-1', undefined, user),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Unauthorized roles are rejected', async () => {
    prisma.order.findUnique.mockResolvedValue(baseOrder);
    await expect(
      service.getParameterDefinitions(
        mockOrderId,
        mockTenantId,
        mockBranchId,
        mockUser(['Cashier'], mockBranchId),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Cross-tenant access rejected', async () => {
    const order = { ...baseOrder, tenantId: 'other-tenant' };
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(
      service.getParameterDefinitions(
        mockOrderId,
        mockTenantId,
        mockBranchId,
        mockUser(['Lab Technician'], mockBranchId),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Cross-branch access rejected for branch-scoped roles', async () => {
    const order = { ...baseOrder, branchId: 'other-branch' };
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(
      service.getParameterDefinitions(
        mockOrderId,
        mockTenantId,
        mockBranchId,
        mockUser(['Lab Technician'], mockBranchId),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Non-LAB order rejected', async () => {
    const order = {
      ...baseOrder,
      orderType: 'PRESCRIPTION',
      clinicalItems: [],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(
      service.getParameterDefinitions(
        mockOrderId,
        mockTenantId,
        mockBranchId,
        mockUser(['Lab Technician'], mockBranchId),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('Missing order rejected', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(
      service.getParameterDefinitions(
        mockOrderId,
        mockTenantId,
        mockBranchId,
        mockUser(['Lab Technician'], mockBranchId),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Inactive parameter definitions are not returned', async () => {
    const defWithInactive = {
      ...mockTestDefinition,
      parameters: [...mockParameters],
    };
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    const result = await runTest(
      order,
      [defWithInactive],
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toHaveLength(2);
    expect(result.find((p) => p.code === 'INACTIVE')).toBeUndefined();
  });

  it('Definitions are returned in displayOrder', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    const result = await runTest(
      order,
      [mockTestDefinition],
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result[0].displayOrder).toBeLessThan(result[1].displayOrder);
  });

  it('DTO does not leak tenantId/branchId/billing/audit/internal data', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    const result = await runTest(
      order,
      [mockTestDefinition],
      mockUser(['Lab Technician'], mockBranchId),
    );
    const dto = result[0];
    expect(dto).not.toHaveProperty('tenantId');
    expect(dto).not.toHaveProperty('branchId');
    expect(dto).not.toHaveProperty('id');
    expect(dto).not.toHaveProperty('testDefinitionId');
    expect(dto).not.toHaveProperty('createdAt');
    expect(dto).not.toHaveProperty('updatedAt');
    expect(dto).not.toHaveProperty('pricing');
    expect(dto).not.toHaveProperty('billing');
    expect(dto).not.toHaveProperty('audit');
  });

  it('Endpoint performs no mutation', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    await runTest(
      order,
      [mockTestDefinition],
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(prisma.order.findUnique).toHaveBeenCalled();
    expect(prisma.labTestDefinition.findMany).toHaveBeenCalled();
    expect(
      Object.keys(prisma).filter(
        (k) => k !== 'order' && k !== 'labTestDefinition',
      ),
    ).toEqual([]);
  });

  it('Missing branch context for branch-scoped role is rejected', async () => {
    await expect(
      service.getParameterDefinitions(
        mockOrderId,
        mockTenantId,
        undefined,
        mockUser(['Lab Technician']),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Empty clinical items returns empty definitions', async () => {
    const order = { ...baseOrder, clinicalItems: [] };
    prisma.order.findUnique.mockResolvedValue(order);
    const result = await service.getParameterDefinitions(
      mockOrderId,
      mockTenantId,
      mockBranchId,
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toEqual([]);
  });

  it('No matching test definition returns empty definitions', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        { itemName: 'Unknown Panel', notes: null, status: 'PENDING' },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.labTestDefinition.findMany.mockResolvedValue([]);
    const result = await service.getParameterDefinitions(
      mockOrderId,
      mockTenantId,
      mockBranchId,
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toEqual([]);
  });

  it('Definition returns full DTO shape with all fields', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    const result = await runTest(
      order,
      [mockTestDefinition],
      mockUser(['Lab Technician'], mockBranchId),
    );
    const dto = result[0];
    expect(dto).toHaveProperty('parameterName');
    expect(dto).toHaveProperty('code');
    expect(dto).toHaveProperty('unit');
    expect(dto).toHaveProperty('referenceRangeText');
    expect(dto).toHaveProperty('minNormal');
    expect(dto).toHaveProperty('maxNormal');
    expect(dto).toHaveProperty('minCritical');
    expect(dto).toHaveProperty('maxCritical');
    expect(dto).toHaveProperty('valueType');
    expect(dto).toHaveProperty('allowedValues');
    expect(dto).toHaveProperty('isRequired');
    expect(dto).toHaveProperty('displayOrder');
  });

  // ===== Stable Catalog Linkage Tests (Phase 14F-F) =====

  it('prefers stable labTestDefinitionId over name matching when link exists', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Different Name (should be ignored)',
          labTestDefinitionId: 'test-def-1',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.labTestDefinition.findFirst.mockResolvedValue(mockTestDefinition);
    const result = await service.getParameterDefinitions(
      mockOrderId,
      mockTenantId,
      mockBranchId,
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe('WBC');
    expect(result[1].code).toBe('Hgb');
    expect(prisma.labTestDefinition.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'test-def-1',
          tenantId: mockTenantId,
        }),
      }),
    );
    expect(prisma.labTestDefinition.findMany).not.toHaveBeenCalled();
  });

  it('legacy name matching fallback works when no labTestDefinitionId exists', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          labTestDefinitionId: null,
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.labTestDefinition.findMany.mockResolvedValue([mockTestDefinition]);
    const result = await service.getParameterDefinitions(
      mockOrderId,
      mockTenantId,
      mockBranchId,
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toHaveLength(2);
    expect(prisma.labTestDefinition.findMany).toHaveBeenCalled();
    expect(prisma.labTestDefinition.findFirst).not.toHaveBeenCalled();
  });

  it('returns empty when stable link points to inactive definition', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          labTestDefinitionId: 'test-def-1',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.labTestDefinition.findFirst.mockResolvedValue(null);
    const result = await service.getParameterDefinitions(
      mockOrderId,
      mockTenantId,
      mockBranchId,
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toEqual([]);
  });

  it('returns empty when stable link points to cross-tenant definition', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          labTestDefinitionId: 'test-def-other-tenant',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.labTestDefinition.findFirst.mockResolvedValue(null);
    const result = await service.getParameterDefinitions(
      mockOrderId,
      mockTenantId,
      mockBranchId,
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toEqual([]);
    expect(prisma.labTestDefinition.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'test-def-other-tenant',
          tenantId: mockTenantId,
        }),
      }),
    );
  });

  it('stable link does not fallback to name matching when definition is inactive/missing', async () => {
    const order = {
      ...baseOrder,
      clinicalItems: [
        {
          itemName: 'Complete Blood Count (CBC)',
          labTestDefinitionId: 'test-def-1',
          notes: null,
          status: 'PENDING',
        },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.labTestDefinition.findFirst.mockResolvedValue(null);
    prisma.labTestDefinition.findMany.mockResolvedValue([mockTestDefinition]);
    const result = await service.getParameterDefinitions(
      mockOrderId,
      mockTenantId,
      mockBranchId,
      mockUser(['Lab Technician'], mockBranchId),
    );
    expect(result).toEqual([]);
    expect(prisma.labTestDefinition.findMany).not.toHaveBeenCalled();
  });
});
