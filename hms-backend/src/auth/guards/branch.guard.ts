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

    // Fails closed if req.user.branchId is missing (branch selection required)
    if (!user.branchId) {
      throw new ForbiddenException('Access denied');
    }

    // Fails closed if req.user.branchId is missing (branch selection required)
    if (!user.branchId) {
      throw new ForbiddenException(
        'Branch context required. Please select a branch.',
      );
    }

    // Validate route param branchId if present
    if (
      request.params &&
      request.params.branchId &&
      request.params.branchId !== user.branchId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Validate request.body.branchId if it exists
    if (
      request.body &&
      request.body.branchId &&
      request.body.branchId !== user.branchId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Validate request.query.branchId if it exists
    if (
      request.query &&
      request.query.branchId &&
      request.query.branchId !== user.branchId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
