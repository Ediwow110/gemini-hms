import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.userId || !user.tenantId) {
      throw new ForbiddenException(
        'unauthenticated: User not authenticated or missing tenant context',
      );
    }

    // Grants are evaluated at tenant scope only; they do not prove branch isolation.
    // Branch-bound data must additionally use BranchGuard and tenant+branch checks in services.

    // Get user's permissions from the database explicitly scoped to their tenant
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.userId,
        status: 'ACTIVE',
        role: { tenantId: user.tenantId, status: 'ACTIVE', archivedAt: null },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const userPermissions = new Set<string>();

    for (const ur of userRoles) {
      if (ur.role && ur.role.rolePermissions) {
        for (const rp of ur.role.rolePermissions) {
          const permissionName = rp.permission?.name;
          if (typeof permissionName === 'string' && permissionName.length > 0) {
            userPermissions.add(permissionName);
          }
        }
      }
    }

    // CURRENT BEHAVIOR: RequireAnyPermission
    // This allows access if the user has AT LEAST ONE of the required permissions.
    // To implement RequireAllPermissions, use `.every` instead of `.some`.
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.has(perm),
    );

    if (!hasPermission) {
      // Blueprint Error Code Catalog (Section 15) uses 'permission_denied'
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'permission_denied',
        details: 'You lack the required permissions to perform this action',
      });
    }

    return true;
  }
}
