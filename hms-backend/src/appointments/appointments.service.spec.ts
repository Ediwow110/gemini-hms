import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    patient: {
      findFirst: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    doctorSchedule: {
      create: jest.fn(),
    },
    queueTicket: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    mockAudit.log.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const dto = {
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      departmentId: 'dept-1',
      branchId: 'branch-1',
      appointmentDate: new Date().toISOString(),
      reason: 'Checkup',
    };

    it('should create an appointment and log audit if no conflict exists', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.create.mockResolvedValue({ id: 'appt-1', ...dto });

      const result = await service.createAppointment(tenantId, userId, dto);

      expect(result.id).toBe('appt-1');
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if double-booked', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.appointment.findFirst.mockResolvedValue({
        id: 'existing-appt',
      });

      await expect(
        service.createAppointment(tenantId, userId, dto as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if patient belongs to another tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createAppointment(tenantId, userId, dto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rollback if audit fails', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.create.mockResolvedValue({ id: 'appt-1' });
      mockAudit.log.mockRejectedValueOnce(new Error('Audit failed'));

      await expect(
        service.createAppointment(tenantId, userId, dto as any),
      ).rejects.toThrow('Audit failed');
    });
  });

  describe('issueQueueTicket', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const dto = {
      patientId: 'patient-1',
      branchId: 'branch-1',
    };

    it('should increment ticket number correctly', async () => {
      mockPrisma.queueTicket.findFirst.mockResolvedValue({
        ticketNumber: 'Q-005',
      });
      mockPrisma.queueTicket.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'ticket-1', ...data }),
      );

      const result = await service.issueQueueTicket(tenantId, userId, dto);

      expect(result.ticketNumber).toBe('Q-006');
    });

    it('should start at Q-001 if no tickets today', async () => {
      mockPrisma.queueTicket.findFirst.mockResolvedValue(null);
      mockPrisma.queueTicket.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'ticket-1', ...data }),
      );

      const result = await service.issueQueueTicket(tenantId, userId, dto);

      expect(result.ticketNumber).toBe('Q-001');
    });
  });
});
