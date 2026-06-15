import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_BRANCH_CONTEXT_KEY,
  BRANCH_BYPASS_ROLES_KEY,
} from '../decorators/branch-context.decorator';

@Injectable()
export class BranchGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_BRANCH_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isRequired) {
      return true;
    }

    const bypassRoles =
      this.reflector.getAllAndOverride<string[]>(BRANCH_BYPASS_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    const request = context.switchToHttp().getRequest<any>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const userRoles: string[] = user.roles || [];
    const isSuperAdmin = userRoles.includes('Super Admin');
    const hasBypassRole = bypassRoles.some((r) => userRoles.includes(r));

    if (!user.branchId && !isSuperAdmin && !hasBypassRole) {
      throw new ForbiddenException('Access denied');
    }

    const fromParams =
      request.params && request.params.branchId
        ? String(request.params.branchId)
        : undefined;
    const fromBody =
      request.body && request.body.branchId
        ? String(request.body.branchId)
        : undefined;
    const fromQuery =
      request.query && request.query.branchId
        ? String(request.query.branchId)
        : undefined;

    const branchIdsProvided = [fromParams, fromBody, fromQuery].filter(
      Boolean,
    ) as string[];

    const distinct = [...new Set(branchIdsProvided)];
    if (distinct.length > 1) {
      throw new ForbiddenException('Access denied');
    }

    if (distinct.length === 1) {
      if (!isSuperAdmin && distinct[0] !== user.branchId) {
        throw new ForbiddenException('Access denied');
      }
      // If Super Admin, they can target any branch as long as they are consistent
      // across params/body/query. Tenant scoping is handled at service layer.
    } else if (
      isRequired &&
      !user.branchId &&
      !isSuperAdmin &&
      !hasBypassRole
    ) {
      // No branchId provided in request and none in token
      throw new ForbiddenException('Branch context is required');
    }

    return true;
  }
}
