import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      patient: {
        findFirst: jest.fn(),
      },
      encounter: {
        findFirst: jest.fn(),
      },
      prescription: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
  });

  const mockCreateDto = {
    patientId: 'patient-uuid',
    encounterId: 'encounter-uuid',
    medicationName: 'Amlodipine 5mg',
    dosage: '1 tablet',
    frequency: 'Once daily',
    duration: '30 days',
    notes: 'Take in the morning',
  };

  describe('create', () => {
    it('should create a prescription and audit log', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'patient-uuid', tenantId: 'tenant1', status: 'ACTIVE' });
      prisma.encounter.findFirst.mockResolvedValue({ id: 'encounter-uuid', patientId: 'patient-uuid', tenantId: 'tenant1' });
      prisma.prescription.create.mockResolvedValue({
        id: 'rx-uuid',
        ...mockCreateDto,
        tenantId: 'tenant1',
        branchId: 'branch1',
        prescribedById: 'doctor-uuid',
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      const result = await service.create('tenant1', 'branch1', 'doctor-uuid', mockCreateDto);

      expect(prisma.prescription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            medicationName: 'Amlodipine 5mg',
            dosage: '1 tablet',
            status: 'ACTIVE',
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PRESCRIPTION_CREATED',
          recordType: 'Prescription',
        }),
        undefined,
        'branch1',
      );
    });

    it('should throw NotFoundException if patient not found in tenant', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant1', 'branch1', 'doctor-uuid', mockCreateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if encounter not found for patient', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'patient-uuid', tenantId: 'tenant1' });
      prisma.encounter.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant1', 'branch1', 'doctor-uuid', mockCreateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatient', () => {
    it('should return prescriptions for a patient', async () => {
      const mockPrescriptions = [
        { id: 'rx-1', medicationName: 'Metformin', tenantId: 'tenant1', patientId: 'patient-uuid' },
        { id: 'rx-2', medicationName: 'Amlodipine', tenantId: 'tenant1', patientId: 'patient-uuid' },
      ];
      prisma.prescription.findMany.mockResolvedValue(mockPrescriptions);

      const result = await service.findByPatient('tenant1', 'patient-uuid');

      expect(prisma.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant1',
            patientId: 'patient-uuid',
            deletedAt: null,
          }),
        }),
      );
      expect(result).toEqual(mockPrescriptions);
    });

    it('should return empty array when no prescriptions exist', async () => {
      prisma.prescription.findMany.mockResolvedValue([]);

      const result = await service.findByPatient('tenant1', 'patient-uuid');

      expect(result).toEqual([]);
    });
  });
});
