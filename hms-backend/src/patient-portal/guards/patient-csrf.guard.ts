import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class PatientCsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    // Safe methods: exempt from CSRF check
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Unsafe methods: require valid CSRF token via double-submit cookie pattern
    const csrfCookie = request.cookies?.patient_csrf;
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
