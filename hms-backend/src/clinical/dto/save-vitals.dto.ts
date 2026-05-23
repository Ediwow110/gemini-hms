import { IsOptional, IsInt, IsNumber, Min, Max } from 'class-validator';

/**
 * SaveVitalsDto
 *
 * NOTE: spo2 is intentionally omitted. The Prisma Vitals table has no spo2 column.
 * If clinical requirements demand SpO2 capture, add `spo2?: number` here, add the
 * column to Prisma schema via migration, and update the frontend payload/UI.
 *
 * @see hms-backend/prisma/schema.prisma – Vitals model
 */

export class SaveVitalsDto {
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(300)
  systolicBp?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  diastolicBp?: number;

  @IsOptional()
  @IsNumber()
  @Min(33)
  @Max(43)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300)
  heartRate?: number;

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(100)
  respiratoryRate?: number;
}
