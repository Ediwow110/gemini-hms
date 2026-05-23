import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Safe methods: exempt from CSRF check
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Unsafe methods: require valid CSRF token
    const csrfCookie = request.cookies?.csrf_token;
    const csrfHeader = request.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader) {
      throw new ForbiddenException('Missing CSRF token');
    }

    if (csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
