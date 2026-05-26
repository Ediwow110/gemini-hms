import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ReceiveSpecimenDto {
  @IsOptional()
  @IsString()
  accessionNumber?: string;

  @IsOptional()
  @IsString()
  specimenType?: string;

  @IsOptional()
  @IsUUID()
  receivedByIdOverride?: string;
}
