import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.userId) {
      throw new ForbiddenException('unauthenticated: User not authenticated');
    }

    // Get user's permissions from the database
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    const userPermissions = new Set<string>();
    
    for (const ur of userRoles) {
      if (ur.role && ur.role.rolePermissions) {
        for (const rp of ur.role.rolePermissions) {
          if (rp.permission && rp.permission.name) {
            userPermissions.add(rp.permission.name);
          }
        }
      }
    }

    const hasPermission = requiredPermissions.some((perm) => userPermissions.has(perm));
    
    if (!hasPermission) {
      // Blueprint Error Code Catalog (Section 15) uses 'permission_denied'
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'permission_denied',
        details: 'You lack the required permissions to perform this action'
      });
    }
    
    return true;
  }
}
