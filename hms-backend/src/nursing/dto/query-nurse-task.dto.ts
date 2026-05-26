import { IsOptional, IsEnum, IsUUID, IsBoolean, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class QueryNurseTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsBoolean()
  assignedToMe?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
