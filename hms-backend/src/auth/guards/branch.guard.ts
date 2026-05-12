import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_BRANCH_CONTEXT_KEY } from '../decorators/branch-context.decorator';

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

    const request = context.switchToHttp().getRequest<any>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.branchId) {
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

    if (distinct.length === 1 && distinct[0] !== user.branchId) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
