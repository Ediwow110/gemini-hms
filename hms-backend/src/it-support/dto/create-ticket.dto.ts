import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TicketIssueType, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsEnum(TicketIssueType)
  issueType: TicketIssueType;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  summary: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
