import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class MarkVitalsErrorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}
