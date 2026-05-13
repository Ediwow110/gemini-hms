import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ArrayUnique,
} from 'class-validator';

export class UserLifecycleReasonDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  reason: string;
}

export class AssignUserRoleDto extends UserLifecycleReasonDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  roleId: string;
}

export class GrantRolePermissionDto extends UserLifecycleReasonDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  permissionId: string;
}

export class PrivilegedRoleRequestDto extends UserLifecycleReasonDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  roleId: string;
}

export class CreateCustomRoleDto extends UserLifecycleReasonDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'string' ? v.trim() : v));
    }
    return value;
  })
  @IsNotEmpty({ each: true })
  permissionIds?: string[];
}
