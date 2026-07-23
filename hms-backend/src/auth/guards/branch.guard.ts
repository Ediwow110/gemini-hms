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

    if (!isRequired) return true;

    const bypassRoles =
      this.reflector.getAllAndOverride<string[]>(BRANCH_BYPASS_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    const request = context.switchToHttp().getRequest<any>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Access denied');

    const userRoles: string[] = user.roles || [];
    const isSuperAdmin = userRoles.includes('Super Admin');
    const hasBypassRole = bypassRoles.some((role) => userRoles.includes(role));

    const requestedBranchIds = [
      request.params?.branchId,
      request.body?.branchId,
      request.query?.branchId,
    ]
      .filter(Boolean)
      .map(String);
    const distinctRequestedBranches = [...new Set(requestedBranchIds)];

    if (distinctRequestedBranches.length > 1) {
      throw new ForbiddenException('Access denied');
    }

    const requestedBranchId = distinctRequestedBranches[0];

    // Explicit decorator bypass roles are the only users allowed to operate without
    // a branch selected into the authenticated session. Super Admin does not bypass
    // this requirement for branch-bound data.
    if (!user.branchId && !hasBypassRole) {
      throw new ForbiddenException('Branch context is required');
    }

    if (requestedBranchId && !isSuperAdmin && !hasBypassRole) {
      if (!user.branchId || requestedBranchId !== user.branchId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return true;
  }
}
