import { IsNotEmpty, Matches } from 'class-validator';

export class SelectBranchDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'branchId must be a UUID',
  })
  @IsNotEmpty()
  branchId: string;
}
