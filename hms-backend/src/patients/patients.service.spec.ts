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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: PrismaService,
          useValue: {
            patient: {
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
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
});
