import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub?: string;
  email?: string;
  tenantId?: string;
  branchId?: string;
  roles?: string[];
  tokenVersion?: number;
}

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
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (
      !payload.sub ||
      !payload.tenantId ||
      typeof payload.tokenVersion !== 'number'
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
      },
      select: {
        id: true,
        email: true,
        tenantId: true,
        status: true,
        deactivatedAt: true,
        tokenVersion: true,
      },
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.deactivatedAt !== null ||
      payload.tokenVersion !== user.tokenVersion
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    // This return value is injected into Request as 'user'
    // All fields use camelCase consistently
    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: payload.roles ?? [],
      tokenVersion: user.tokenVersion,
      ...(payload.branchId ? { branchId: payload.branchId } : {}),
    };
  }
}
