import { IsInt, Min } from 'class-validator';

export class ReleaseLabResultDto {
  @IsInt()
  @Min(0)
  version: number;
}
