import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { IssueQueueTicketDto } from './dto/issue-queue-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @RequirePermissions('appointment.create')
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.createAppointment(
      req.user.tenantId,
      req.user.userId!,
      dto,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('appointment.update')
  async updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateAppointmentStatus(
      req.user.tenantId,
      req.user.userId!,
      id,
      dto,
    );
  }

  @Post('schedules')
  @RequirePermissions('doctor_schedule.create')
  async createSchedule(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateDoctorScheduleDto,
  ) {
    return this.appointmentsService.createDoctorSchedule(
      req.user.tenantId,
      req.user.userId!,
      dto,
    );
  }

  @Post('queue/issue-ticket')
  @RequirePermissions('queue.issue_ticket')
  async issueTicket(
    @Request() req: AuthenticatedRequest,
    @Body() dto: IssueQueueTicketDto,
  ) {
    return this.appointmentsService.issueQueueTicket(
      req.user.tenantId,
      req.user.userId!,
      dto,
    );
  }
}
