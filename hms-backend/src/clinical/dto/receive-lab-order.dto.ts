import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class ReceiveLabOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  specimenType: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\-_/]+$/, {
    message:
      'accessionNumber must contain only alphanumeric characters, hyphens, underscores, or slashes',
  })
  accessionNumber?: string;

  @IsString()
  @IsOptional()
  collectionMode?: string;
}
