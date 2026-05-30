// PatientsService cross-tenant write isolation test
import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

describe('PatientsService write isolation', () => {
  let service: PatientsService;
  let prisma: any;

  beforeEach(async () => {
    const patientMock = {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation(async (fn: any) => {
              return fn({ patient: patientMock });
            }),
            patient: patientMock,
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: NumberingService,
          useValue: {
            generateNumber: jest.fn().mockResolvedValue('PAT-000001'),
          },
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const tenantId = 'tenant-A';
  const otherTenantId = 'tenant-B';
  const patientId = 'patient-123';

  it('should reject update when patient belongs to another tenant', async () => {
    // Simulate existing patient belonging to another tenant
    prisma.patient.findFirst.mockResolvedValue({
      id: patientId,
      tenantId: otherTenantId,
      firstName: 'John',
      lastName: 'Doe',
      dob: new Date('1990-01-01'),
    });
    prisma.patient.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.update(tenantId, 'user-1', patientId, { firstName: 'John' }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.patient.updateMany).toHaveBeenCalledWith({
      where: { id: patientId, tenantId },
      data: expect.any(Object),
    });
  });

  describe('findAll with search', () => {
    it('should find all patients without search', async () => {
      const mockPatients = [
        {
          id: 'p1',
          firstName: 'John',
          lastName: 'Doe',
          patientNumber: 'MRN-001',
          tenantId,
        },
        {
          id: 'p2',
          firstName: 'Jane',
          lastName: 'Smith',
          patientNumber: 'MRN-002',
          tenantId,
        },
      ];
      prisma.patient.findMany = jest.fn().mockResolvedValue(mockPatients);

      const result = await service.findAll(tenantId);

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should search patients by name', async () => {
      prisma.patient.findMany = jest.fn().mockResolvedValue([
        {
          id: 'p1',
          firstName: 'John',
          lastName: 'Doe',
          patientNumber: 'MRN-001',
          tenantId,
        },
      ]);

      const result = await service.findAll(tenantId, 'john');

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            OR: expect.arrayContaining([
              expect.objectContaining({
                firstName: { contains: 'john', mode: 'insensitive' },
              }),
            ]),
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should search patients by patient number', async () => {
      prisma.patient.findMany = jest.fn().mockResolvedValue([
        {
          id: 'p1',
          firstName: 'John',
          lastName: 'Doe',
          patientNumber: 'MRN-001',
          tenantId,
        },
      ]);

      const result = await service.findAll(tenantId, 'MRN-001');

      expect(result).toHaveLength(1);
    });

    it('should return empty array for non-matching search', async () => {
      prisma.patient.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.findAll(tenantId, 'nonexistent');

      expect(result).toEqual([]);
    });
  });
});
