import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SUPER_SECRET_TEMP_KEY_DO_NOT_USE_IN_PROD',
    });
  }

  async validate(payload: any) {
    // This return value is injected into Request as 'user'
    // We include sub (userId), email, tenant_id, and roles
    return { 
      userId: payload.sub, 
      email: payload.email, 
      tenantId: payload.tenant_id,
      roles: payload.roles 
    };
  }
}
