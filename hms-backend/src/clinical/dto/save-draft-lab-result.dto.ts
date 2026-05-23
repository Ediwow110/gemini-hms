import { IsString, IsObject, IsOptional, MaxLength } from 'class-validator';

export class SaveDraftLabResultDto {
  @IsObject()
  results: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  remarks?: string;
}
