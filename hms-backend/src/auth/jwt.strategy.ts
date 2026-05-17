import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub?: string;
  sid?: string; // Session ID
  email?: string;
  tenantId?: string;
  branchId?: string;
  roles?: string[];
  tokenVersion?: number;
  mfaVerified?: boolean;
  scope?: string;
  challenge?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error(
        'CRITICAL: Valid JWT_SECRET (min 32 chars) is required in environment variables.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (
      !payload.sub ||
      !payload.sid ||
      !payload.tenantId ||
      typeof payload.tokenVersion !== 'number'
    ) {
      throw new UnauthorizedException('Invalid token structure');
    }

    // Stateful check: verify session exists and is active
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.expiresAt < new Date() ||
      session.user.status !== 'ACTIVE' ||
      session.user.deactivatedAt !== null ||
      payload.tokenVersion !== session.user.tokenVersion
    ) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    // Consistency check: ensure token sub matches session owner
    if (
      session.userId !== payload.sub ||
      session.tenantId !== payload.tenantId
    ) {
      throw new UnauthorizedException('Token/Session mismatch');
    }

    return {
      userId: session.user.id,
      sessionId: session.id,
      email: session.user.email,
      tenantId: session.tenantId,
      roles: payload.roles ?? [],
      tokenVersion: session.user.tokenVersion,
      mfaVerified: !!payload.mfaVerified,
      scope: payload.scope,
      challenge: payload.challenge,
      ...(payload.branchId ? { branchId: payload.branchId } : {}),
    };
  }
}
