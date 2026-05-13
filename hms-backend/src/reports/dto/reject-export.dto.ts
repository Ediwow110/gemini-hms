import { IsString, MinLength } from 'class-validator';

export class RejectExportDto {
  @IsString()
  @MinLength(1)
  reason: string;
}
