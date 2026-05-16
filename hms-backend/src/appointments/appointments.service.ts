import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { IssueQueueTicketDto } from './dto/issue-queue-ticket.dto';
import { AppointmentStatus, QueueStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createAppointment(
    tenantId: string,
    userId: string,
    dto: CreateAppointmentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tenant Scope & Existence Check
      const patient = await tx.patient.findFirst({
        where: { id: dto.patientId, tenantId },
      });
      if (!patient) throw new NotFoundException('Patient not found');

      // 2. Double-Booking Guard (Golden Rule)
      // We assume a 30-minute slot for conflict detection
      const appointmentDate = new Date(dto.appointmentDate);
      const conflictWindowStart = new Date(
        appointmentDate.getTime() - 29 * 60000,
      );
      const conflictWindowEnd = new Date(
        appointmentDate.getTime() + 29 * 60000,
      );

      const conflict = await tx.appointment.findFirst({
        where: {
          tenantId,
          doctorId: dto.doctorId,
          status: {
            in: [
              AppointmentStatus.SCHEDULED,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.ARRIVED,
              AppointmentStatus.IN_CONSULTATION,
            ],
          },
          appointmentDate: {
            gte: conflictWindowStart,
            lte: conflictWindowEnd,
          },
        },
      });

      if (conflict) {
        throw new ConflictException('doctor_schedule_conflict');
      }

      // 3. Create Appointment
      const appointment = await tx.appointment.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          departmentId: dto.departmentId,
          appointmentDate,
          reason: dto.reason,
          createdBy: userId,
          updatedBy: userId,
          status: AppointmentStatus.SCHEDULED,
        },
      });

      // 4. Transactional Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'appointment.create',
          recordType: 'Appointment',
          recordId: appointment.id,
          newValues: appointment,
        },
        tx,
      );

      return appointment;
    });
  }

  async updateAppointmentStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id, tenantId },
      });

      if (!appointment) throw new NotFoundException('Appointment not found');

      // State Machine Validation
      this.validateStatusTransition(appointment.status, dto.status);

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
          updatedBy: userId,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'appointment.status_update',
          recordType: 'Appointment',
          recordId: appointment.id,
          oldValues: { status: appointment.status },
          newValues: { status: dto.status },
        },
        tx,
      );

      return updated;
    });
  }

  private validateStatusTransition(
    current: AppointmentStatus,
    target: AppointmentStatus,
  ) {
    const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
        AppointmentStatus.ARRIVED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.ARRIVED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
      ],
      [AppointmentStatus.ARRIVED]: [
        AppointmentStatus.IN_CONSULTATION,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.IN_CONSULTATION]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [AppointmentStatus.SCHEDULED],
    };

    if (!transitions[current].includes(target)) {
      throw new ConflictException(
        `Invalid status transition from ${current} to ${target}`,
      );
    }
  }

  async createDoctorSchedule(
    tenantId: string,
    userId: string,
    dto: CreateDoctorScheduleDto,
  ) {
    // Basic CRUD for schedule
    return this.prisma.doctorSchedule.create({
      data: {
        tenantId,
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async issueQueueTicket(
    tenantId: string,
    userId: string,
    dto: IssueQueueTicketDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Safe Daily Numbering (Idempotency Guard)
      const lastTicket = await tx.queueTicket.findFirst({
        where: {
          tenantId,
          branchId: dto.branchId,
          date: today,
        },
        orderBy: { createdAt: 'desc' },
      });

      const nextNumber = lastTicket
        ? parseInt(lastTicket.ticketNumber.split('-')[1]) + 1
        : 1;
      const ticketNumber = `Q-${String(nextNumber).padStart(3, '0')}`;

      // 2. Create Ticket
      const ticket = await tx.queueTicket.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          patientId: dto.patientId,
          appointmentId: dto.appointmentId,
          ticketNumber,
          date: today,
          status: QueueStatus.WAITING,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'queue.ticket_issued',
          recordType: 'QueueTicket',
          recordId: ticket.id,
          newValues: ticket,
        },
        tx,
      );

      return ticket;
    });
  }
}
