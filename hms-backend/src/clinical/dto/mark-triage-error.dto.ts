import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class MarkTriageErrorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reason: string;
}
