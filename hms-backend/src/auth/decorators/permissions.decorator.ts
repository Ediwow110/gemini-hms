import { SetMetadata } from '@nestjs/common';

export enum PermissionMode {
  ANY = 'any',
  ALL = 'all',
}

export interface PermissionMetadata {
  permissions: string[];
  mode: PermissionMode;
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Default: Require ANY of the listed permissions.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, mode: PermissionMode.ANY });

export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, mode: PermissionMode.ANY });

export const RequireAllPermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, mode: PermissionMode.ALL });
