import { Test, TestingModule } from '@nestjs/testing';
import { PortalService } from './portal.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('PortalService', () => {
  let service: PortalService;

  const mockPrisma = {
    patient: {
      findUnique: jest.fn(),
    },
    portalOtp: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    labResult: {
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockNotificationsService = {
    sendExternalNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PortalService>(PortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should create a valid PortalOtp record and send notification', async () => {
      const patient = {
        id: 'patient-1',
        firstName: 'John',
        patientNumber: 'P001',
      };
      mockPrisma.patient.findUnique.mockResolvedValue(patient);
      mockPrisma.portalOtp.create.mockResolvedValue({ id: 'otp-1' });

      const result = await service.requestOtp({
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        patientNumber: 'P001',
        email: 'john@example.com',
      });

      expect(result).toEqual({ message: 'OTP sent successfully' });
      expect(mockPrisma.portalOtp.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            patientId: 'patient-1',
            otpCode: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
      expect(
        mockNotificationsService.sendExternalNotification,
      ).toHaveBeenCalled();
    });

    it('should throw NotFoundException if patient does not exist', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.requestOtp({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          patientNumber: 'P001',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyOtp', () => {
    it('should return a token if OTP is valid', async () => {
      const patient = {
        id: 'patient-1',
        patientNumber: 'P001',
        firstName: 'John',
        lastName: 'Doe',
      };
      const hashedOtp = await bcrypt.hash('123456', 10);
      const otpRecord = { id: 'otp-1', otpCode: hashedOtp };

      mockPrisma.patient.findUnique.mockResolvedValue(patient);
      mockPrisma.portalOtp.findFirst.mockResolvedValue(otpRecord);
      mockPrisma.portalOtp.update.mockResolvedValue({
        ...otpRecord,
        isUsed: true,
      });

      const result = await service.verifyOtp({
        tenantId: 'tenant-1',
        patientNumber: 'P001',
        otpCode: '123456',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.patient.id).toBe('patient-1');
      expect(mockPrisma.portalOtp.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if OTP is invalid', async () => {
      const patient = { id: 'patient-1', patientNumber: 'P001' };
      const hashedOtp = await bcrypt.hash('123456', 10);
      const otpRecord = { id: 'otp-1', otpCode: hashedOtp };

      mockPrisma.patient.findUnique.mockResolvedValue(patient);
      mockPrisma.portalOtp.findFirst.mockResolvedValue(otpRecord);

      await expect(
        service.verifyOtp({
          tenantId: 'tenant-1',
          patientNumber: 'P001',
          otpCode: 'wrong-otp',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getResults (Data Exposure Boundary)', () => {
    it('should only return RELEASED lab results', async () => {
      await service.getResults('tenant-1', 'patient-1');

      expect(mockPrisma.labResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            order: { patientId: 'patient-1' },
            status: 'RELEASED',
          }),
        }),
      );
    });
  });

  describe('IDOR Prevention (Tenant & Identity Scope)', () => {
    it('should filter invoices by both tenantId and patientId', async () => {
      await service.getInvoices('tenant-1', 'patient-1');

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            order: { patientId: 'patient-1' },
          }),
        }),
      );
    });
  });
});
