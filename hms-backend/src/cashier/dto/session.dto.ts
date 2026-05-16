import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenSessionDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  openingBalance: number;
}

export class CloseSessionDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actualClosingBalance: number;

  remarks?: string;
}
