import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PermissionMetadata,
  PermissionMode,
} from '../../src/auth/decorators/permissions.decorator';

@Injectable()
export class MockPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      !metadata ||
      !metadata.permissions ||
      metadata.permissions.length === 0
    ) {
      return true;
    }

    const { permissions, mode } = metadata;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const userPermissions = user.permissions || [];

    if (userPermissions.includes('*')) return true;

    let hasPermission = false;
    if (mode === PermissionMode.ALL) {
      hasPermission = permissions.every((perm) =>
        userPermissions.includes(perm),
      );
    } else {
      hasPermission = permissions.some((perm) =>
        userPermissions.includes(perm),
      );
    }

    if (!hasPermission) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'permission_denied',
      });
    }

    return true;
  }
}
