import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, NotImplementedException } from '@nestjs/common';
import { ErxService } from '../erx.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ErxService - Advanced Clinical Hardening', () => {
  let service: ErxService;
  let prisma: any;

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

    it('should throw NotImplementedException instead of returning a fake TRANSMITTED status', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue({
        id: 'presc-1',
        tenantId: 'tenant-1',
        patient: { firstName: 'John', lastName: 'Doe' },
        medicationName: 'Amoxicillin',
        dosage: '500mg',
        notes: 'Take twice daily',
      });
      await expect(
        service.transmitPrescription('tenant-1', 'presc-1'),
      ).rejects.toThrow(NotImplementedException);
    });
  });

  describe('getTransmissionStatus', () => {
    it('should throw NotImplementedException instead of returning a fabricated status', async () => {
      await expect(
        service.getTransmissionStatus('tenant-1', 'TX-123'),
      ).rejects.toThrow(NotImplementedException);
    });
  });
});
