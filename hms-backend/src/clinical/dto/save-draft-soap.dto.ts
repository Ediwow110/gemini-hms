import { IsString, IsOptional, MaxLength } from 'class-validator';

export class SaveDraftSoapDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'subjective must be at most 2000 characters' })
  subjective?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'objective must be at most 2000 characters' })
  objective?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'assessment must be at most 2000 characters' })
  assessment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'plan must be at most 2000 characters' })
  plan?: string;
}
