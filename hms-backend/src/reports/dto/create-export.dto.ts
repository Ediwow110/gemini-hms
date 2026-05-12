import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class CreateReportExportDto {
  @IsString()
  @IsNotEmpty()
  reportType: 'CASHIER_REVERSAL_RECONCILIATION' | 'AUDIT_EVENTS_SUMMARY';

  @IsObject()
  filters: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
