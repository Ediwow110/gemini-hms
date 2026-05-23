import { Test, TestingModule } from '@nestjs/testing';
import { ErxService } from '../erx.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ErxService - Advanced Clinical Hardening', () => {
  let service: ErxService;
  let prisma: Partial<PrismaService>;

  beforeEach(async () => {
    prisma = {
      prescription: {
        findUnique: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ErxService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ErxService>(ErxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transmitPrescription', () => {
    it('should throw NotFoundException if prescription does not exist', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.transmitPrescription('tenant-1', 'presc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if prescription tenantId mismatches (cross-tenant)', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue({
        id: 'presc-1',
        tenantId: 'tenant-2', // mismatched
        patient: { firstName: 'John', lastName: 'Doe' },
      });
      await expect(
        service.transmitPrescription('tenant-1', 'presc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return a payload with isStub indicating honest mocking', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue({
        id: 'presc-1',
        tenantId: 'tenant-1',
        patient: { firstName: 'John', lastName: 'Doe' },
        medicationName: 'Amoxicillin',
        dosage: '500mg',
        notes: 'Take twice daily',
      });
      const result = await service.transmitPrescription('tenant-1', 'presc-1');
      expect(result.status).toBe('TRANSMITTED');
      expect(result.isStub).toBe(true);
      expect(result.warning).toContain('mock transmission');
    });
  });

  describe('getTransmissionStatus', () => {
    it('should return honest mock status with isStub', async () => {
      const result = await service.getTransmissionStatus('tenant-1', 'TX-123');
      expect(result.isStub).toBe(true);
      expect(result.remarks).toContain('MOCK_STUB');
    });
  });
});
