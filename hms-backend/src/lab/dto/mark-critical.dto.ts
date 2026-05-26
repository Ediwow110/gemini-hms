import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class MarkCriticalDto {
  @IsBoolean()
  isCritical!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
