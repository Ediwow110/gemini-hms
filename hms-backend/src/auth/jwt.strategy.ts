import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../common/types/authenticated-request.type';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'CRITICAL: Valid JWT_SECRET (min 32 chars) is required in environment variables.',
    );
  }
  return secret;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any): Promise<RequestUser & { email?: string }> {
    // This return value is injected into Request as 'user'
    // All fields use camelCase consistently
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      roles: payload.roles,
      ...(payload.branchId ? { branchId: payload.branchId } : {}),
    };
  }
}
