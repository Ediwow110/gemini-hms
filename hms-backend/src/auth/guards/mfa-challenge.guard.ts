import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MfaChallengeGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException();

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();

    try {
      const payload = this.jwtService.verify(token);
      if (payload.scope !== 'mfa_challenge') {
        throw new UnauthorizedException(
          'Invalid token scope for MFA challenge',
        );
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }
  }
}
