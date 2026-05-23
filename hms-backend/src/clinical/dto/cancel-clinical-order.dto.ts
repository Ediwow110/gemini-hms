import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelClinicalOrderDto {
  @IsString({ message: 'reason must be a string' })
  @MinLength(1, { message: 'reason must not be empty' })
  @MaxLength(300, { message: 'reason must be at most 300 characters' })
  reason: string;
}
