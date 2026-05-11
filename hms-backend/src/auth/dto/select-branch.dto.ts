import { IsNotEmpty, IsUUID } from 'class-validator';

export class SelectBranchDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}
