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

    // Fails closed if req.user is missing (should be handled by JwtAuthGuard normally)
    if (!user) {
      throw new ForbiddenException('Authenticated user context required');
    }

    // Fails closed if req.user.branchId is missing (branch selection required)
    if (!user.branchId) {
      throw new ForbiddenException(
        'Branch context required. Please select a branch.',
      );
    }

    // Validate request.body.branchId if it exists
    if (
      request.body &&
      request.body.branchId &&
      request.body.branchId !== user.branchId
    ) {
      throw new ForbiddenException('Branch context mismatch');
    }

    // Validate request.query.branchId if it exists
    if (
      request.query &&
      request.query.branchId &&
      request.query.branchId !== user.branchId
    ) {
      throw new ForbiddenException('Branch context mismatch');
    }

    return true;
  }
}
