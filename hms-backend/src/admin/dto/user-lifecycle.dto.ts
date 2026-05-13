import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ArrayUnique,
  IsEmail,
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

export class UpdateCustomRoleDto extends UserLifecycleReasonDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  name?: string;
}

export class CreateUserDto extends UserLifecycleReasonDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  isMfaEnabled?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  branchIds: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  roleIds?: string[];
}

export class UpdateUserDto extends UserLifecycleReasonDto {
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  isMfaEnabled?: boolean;
}

export class PrivilegedUserProfileUpdateDto extends UserLifecycleReasonDto {
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  isMfaEnabled?: boolean;
}
