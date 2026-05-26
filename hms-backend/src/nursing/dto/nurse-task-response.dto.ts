import { TaskPriority, TaskStatus } from '@prisma/client';

export class NurseTaskResponseDto {
  id!: string;
  title!: string;
  description?: string | null;
  priority!: TaskPriority;
  status!: TaskStatus;
  patientId?: string | null;
  patientName?: string | null;
  patientMrn?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  createdById!: string;
  createdByName?: string;
  dueAt?: string | null;
  completedAt?: string | null;
  completedById?: string | null;
  completedByName?: string | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  cancellationReason?: string | null;
  createdAt!: string;
  updatedAt!: string;
  branchId!: string;
  tenantId!: string;
}
