import { IsNotEmpty, IsString, IsObject, IsArray, IsOptional } from 'class-validator';

export class CreateReportExportDto {
  @IsString()
  @IsNotEmpty()
  reportType: 'CASHIER_REVERSAL_RECONCILIATION' | 'AUDIT_EVENTS_SUMMARY' | string;

  @IsObject()
  filters: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestedFields?: string[];
}
