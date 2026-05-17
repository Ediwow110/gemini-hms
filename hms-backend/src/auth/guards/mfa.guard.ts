import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

import { SKIP_MFA_KEY } from '../decorators/skip-mfa.decorator';

@Injectable()
export class MfaGuard implements CanActivate {
  private readonly SENSITIVE_ROLES = [
    'Super Admin',
    'Branch Admin',
    'Doctor',
    'Cashier',
  ];

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipMfa = this.reflector.getAllAndOverride<boolean>(SKIP_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipMfa) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const isSensitive = user.roles?.some((role: string) =>
      this.SENSITIVE_ROLES.includes(role),
    );

    // If user has a sensitive role but hasn't verified MFA in this session, block.
    if (isSensitive && !user.mfaVerified) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'MFA_REQUIRED',
        error: 'Forbidden',
      });
    }

    return true;
  }
}
