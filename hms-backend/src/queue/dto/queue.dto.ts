import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const QUEUE_CATEGORIES = [
  'REGULAR',
  'ROUTINE',
  'PRIORITY',
  'EMERGENCY',
] as const;

export class QueueBranchQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class CallNextQueueQueryDto extends QueueBranchQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  serviceType!: string;
}

export class JoinQueueDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  serviceType!: string;

  @IsOptional()
  @IsIn(QUEUE_CATEGORIES)
  category?: (typeof QUEUE_CATEGORIES)[number];

  @IsUUID()
  branchId!: string;
}
