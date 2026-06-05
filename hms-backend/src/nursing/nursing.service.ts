import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClinicalScopePolicy } from '../clinical/clinical-workflow.policy';
import { CreateNurseTaskDto } from './dto/create-nurse-task.dto';
import { UpdateNurseTaskDto } from './dto/update-nurse-task.dto';
import { QueryNurseTaskDto } from './dto/query-nurse-task.dto';
import { NurseTaskResponseDto } from './dto/nurse-task-response.dto';
import { TaskStatus } from '@prisma/client';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { MAX_PAGE_SIZE } from '../common/utils/pagination';

const TASK_INCLUDE = {
  patient: {
    select: { id: true, firstName: true, lastName: true, patientNumber: true },
  },
  assignedTo: { select: { id: true, email: true } },
  createdBy: { select: { id: true, email: true } },
  completedBy: { select: { id: true, email: true } },
  cancelledBy: { select: { id: true, email: true } },
} as const;

@Injectable()
export class NursingService {
  private readonly logger = new Logger(NursingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listTasks(
    tenantId: string,
    branchId: string,
    query: QueryNurseTaskDto,
    user: RequestUser,
  ): Promise<NurseTaskResponseDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const effectiveBranchId = user.roles?.includes('Super Admin')
      ? branchId
      : user.branchId;
    if (!effectiveBranchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const where: any = {
      tenantId,
      branchId: effectiveBranchId,
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.patientId) {
      where.patientId = query.patientId;
    }
    if (query.assignedToMe) {
      where.assignedUserId = user.userId;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await this.prisma.nurseTask.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: MAX_PAGE_SIZE,
    });

    return tasks.map((t) => this.mapToDto(t));
  }

  async getTask(
    tenantId: string,
    taskId: string,
    user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const task = await this.prisma.nurseTask.findFirst({
      where: { id: taskId, tenantId },
      include: TASK_INCLUDE,
    });

    if (!task) {
      throw new NotFoundException('Nurse task not found');
    }

    if (
      !user.roles?.includes('Super Admin') &&
      task.branchId !== user.branchId
    ) {
      throw new ForbiddenException('access_denied: wrong_branch');
    }

    return this.mapToDto(task);
  }

  async createTask(
    tenantId: string,
    branchId: string,
    dto: CreateNurseTaskDto,
    user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const effectiveBranchId = user.roles?.includes('Super Admin')
      ? branchId
      : user.branchId;
    if (!effectiveBranchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    if (dto.patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: dto.patientId, tenantId },
      });
      if (!patient) {
        throw new BadRequestException('Patient not found in this tenant');
      }
    }

    if (dto.assignedUserId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: dto.assignedUserId, tenantId },
      });
      if (!assignee) {
        throw new BadRequestException('Assigned user not found in this tenant');
      }
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.nurseTask.create({
        data: {
          tenantId,
          branchId: effectiveBranchId,
          patientId: dto.patientId || null,
          assignedUserId: dto.assignedUserId || null,
          createdById: user.userId!,
          title: dto.title,
          description: dto.description || null,
          priority: dto.priority || 'MEDIUM',
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        },
        include: TASK_INCLUDE,
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'NURSE_TASK_CREATED',
          recordType: 'NurseTask',
          recordId: created.id,
          newValues: {
            title: created.title,
            priority: created.priority,
            patientId: created.patientId,
            assignedUserId: created.assignedUserId,
          },
        },
        tx,
        effectiveBranchId,
      );

      return created;
    });

    return this.mapToDto(task);
  }

  async updateTask(
    tenantId: string,
    taskId: string,
    dto: UpdateNurseTaskDto,
    user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const existing = await this.prisma.nurseTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Nurse task not found');
    }

    if (
      !user.roles?.includes('Super Admin') &&
      existing.branchId !== user.branchId
    ) {
      throw new ForbiddenException('access_denied: wrong_branch');
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot update a task in ${existing.status.toLowerCase()} status`,
      );
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.patientId !== undefined) {
      if (dto.patientId) {
        const patient = await this.prisma.patient.findFirst({
          where: { id: dto.patientId, tenantId },
        });
        if (!patient) {
          throw new BadRequestException('Patient not found in this tenant');
        }
      }
      updateData.patientId = dto.patientId || null;
    }
    if (dto.assignedUserId !== undefined) {
      if (dto.assignedUserId) {
        const assignee = await this.prisma.user.findFirst({
          where: { id: dto.assignedUserId, tenantId },
        });
        if (!assignee) {
          throw new BadRequestException(
            'Assigned user not found in this tenant',
          );
        }
      }
      updateData.assignedUserId = dto.assignedUserId || null;
    }
    if (dto.dueAt !== undefined) {
      updateData.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.nurseTask.update({
        where: { id: taskId },
        data: updateData,
        include: TASK_INCLUDE,
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'NURSE_TASK_UPDATED',
          recordType: 'NurseTask',
          recordId: updated.id,
          oldValues: { status: existing.status, priority: existing.priority },
          newValues: { ...updateData },
        },
        tx,
        existing.branchId,
      );

      return updated;
    });

    return this.mapToDto(task);
  }

  async startTask(
    tenantId: string,
    taskId: string,
    user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.transitionTask(tenantId, taskId, 'IN_PROGRESS', user, {
      eventKey: 'NURSE_TASK_STARTED',
      allowedFrom: ['OPEN'],
    });
  }

  async completeTask(
    tenantId: string,
    taskId: string,
    user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.transitionTask(tenantId, taskId, 'COMPLETED', user, {
      eventKey: 'NURSE_TASK_COMPLETED',
      allowedFrom: ['OPEN', 'IN_PROGRESS'],
      setCompletedBy: true,
    });
  }

  async cancelTask(
    tenantId: string,
    taskId: string,
    user: RequestUser,
    reason?: string,
  ): Promise<NurseTaskResponseDto> {
    return this.transitionTask(tenantId, taskId, 'CANCELLED', user, {
      eventKey: 'NURSE_TASK_CANCELLED',
      allowedFrom: ['OPEN', 'IN_PROGRESS'],
      setCancelledBy: true,
      reason,
    });
  }

  async reopenTask(
    tenantId: string,
    taskId: string,
    user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.transitionTask(tenantId, taskId, 'OPEN', user, {
      eventKey: 'NURSE_TASK_REOPENED',
      allowedFrom: ['COMPLETED', 'CANCELLED'],
      clearCompleted: true,
      clearCancelled: true,
    });
  }

  private async transitionTask(
    tenantId: string,
    taskId: string,
    targetStatus: TaskStatus,
    user: RequestUser,
    options: {
      eventKey: string;
      allowedFrom: TaskStatus[];
      setCompletedBy?: boolean;
      setCancelledBy?: boolean;
      reason?: string;
      clearCompleted?: boolean;
      clearCancelled?: boolean;
    },
  ): Promise<NurseTaskResponseDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const existing = await this.prisma.nurseTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Nurse task not found');
    }

    if (
      !user.roles?.includes('Super Admin') &&
      existing.branchId !== user.branchId
    ) {
      throw new ForbiddenException('access_denied: wrong_branch');
    }

    if (!options.allowedFrom.includes(existing.status)) {
      throw new BadRequestException(
        `Cannot transition task from ${existing.status} to ${targetStatus}`,
      );
    }

    const updateData: any = { status: targetStatus };

    if (options.setCompletedBy) {
      updateData.completedAt = new Date();
      updateData.completedById = user.userId;
    }
    if (options.setCancelledBy) {
      updateData.cancelledAt = new Date();
      updateData.cancelledById = user.userId;
      if (options.reason) {
        updateData.cancellationReason = options.reason;
      }
    }
    if (options.clearCompleted) {
      updateData.completedAt = null;
      updateData.completedById = null;
    }
    if (options.clearCancelled) {
      updateData.cancelledAt = null;
      updateData.cancelledById = null;
      updateData.cancellationReason = null;
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.nurseTask.update({
        where: { id: taskId },
        data: updateData,
        include: TASK_INCLUDE,
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: options.eventKey,
          recordType: 'NurseTask',
          recordId: updated.id,
          oldValues: { status: existing.status },
          newValues: { status: targetStatus, reason: options.reason },
        },
        tx,
        existing.branchId,
      );

      return updated;
    });

    return this.mapToDto(task);
  }

  private mapToDto(task: any): NurseTaskResponseDto {
    const patientName = task.patient
      ? `${task.patient.firstName} ${task.patient.lastName}`
      : null;
    return {
      id: task.id,
      tenantId: task.tenantId,
      branchId: task.branchId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      patientId: task.patientId,
      patientName,
      patientMrn: task.patient?.patientNumber || null,
      assignedUserId: task.assignedUserId,
      assignedUserName: task.assignedTo?.email || null,
      createdById: task.createdById,
      createdByName: task.createdBy?.email || null,
      dueAt: task.dueAt?.toISOString() || null,
      completedAt: task.completedAt?.toISOString() || null,
      completedById: task.completedById,
      completedByName: task.completedBy?.email || null,
      cancelledAt: task.cancelledAt?.toISOString() || null,
      cancelledById: task.cancelledById,
      cancellationReason: task.cancellationReason,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
