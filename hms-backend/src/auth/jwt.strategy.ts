import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

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
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
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

    // Stateful check: verify session exists and is active.
    // Roles are re-fetched from the DB on every request (defense in depth):
    // we never trust the roles embedded in the JWT, so a role revocation
    // takes effect on the next request even if the issuing code path forgot
    // to bump the user's tokenVersion. Mirrors the active predicate used by
    // AuthService.getActiveRoleNames and PermissionsGuard.
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          include: {
            userRoles: {
              where: {
                status: 'ACTIVE',
                role: { status: 'ACTIVE', archivedAt: null },
              },
              include: {
                role: {
                  select: { name: true, status: true, archivedAt: true },
                },
              },
            },
          },
        },
      },
    });

    if (
      !session ||
      !session.user ||
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

    const activeRoleNames = (session.user.userRoles ?? [])
      .filter(
        (userRole) =>
          userRole.status === 'ACTIVE' &&
          userRole.role?.status === 'ACTIVE' &&
          userRole.role.archivedAt === null,
      )
      .map((userRole) => userRole.role.name);

    return {
      userId: session.user.id,
      sessionId: session.id,
      email: session.user.email,
      tenantId: session.tenantId,
      supplierId: session.user.supplierId,
      roles: activeRoleNames,
      tokenVersion: session.user.tokenVersion,
      mfaVerified: !!payload.mfaVerified,
      scope: payload.scope,
      challenge: payload.challenge,
      ...(payload.branchId ? { branchId: payload.branchId } : {}),
    };
  }
}
