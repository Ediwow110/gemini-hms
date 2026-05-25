import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { TicketStatus, TicketPriority, TicketIssueType } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketIssueType)
  issueType?: TicketIssueType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
