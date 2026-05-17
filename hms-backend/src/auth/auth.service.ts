import { Injectable, UnauthorizedException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SessionService } from './session.service';
import { MfaService } from './mfa.service';

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    tenant: true;
    userRoles: { include: { role: true } };
  };
}>;

type AuthenticatedUser = Omit<UserWithRoles, 'passwordHash'>;

type UserRoleWithName = {
  status: string;
  role: { name: string; status: string; archivedAt: Date | null };
};

@Injectable()
export class AuthService {
  private readonly SENSITIVE_ROLES = ['Super Admin', 'Branch Admin', 'Doctor', 'Cashier'];

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService,
    private mfaService: MfaService,
  ) {}

  private getActiveRoleNames(userRoles: UserRoleWithName[]): string[] {
    return userRoles
      .filter(
        (userRole) =>
          userRole.status === 'ACTIVE' &&
          userRole.role.status === 'ACTIVE' &&
          userRole.role.archivedAt === null,
      )
      .map((userRole) => userRole.role.name);
  }

  async validateUser(
    tenantCode: string,
    email: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { name: tenantCode },
    });
    if (!tenant) return null;

    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email },
      include: {
        tenant: true,
        userRoles: { include: { role: true } },
      },
    });

    if (
      user &&
      user.status === 'ACTIVE' &&
      user.deactivatedAt === null &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      const { passwordHash, ...result } = user;
      return result as any;
    }
    return null;
  }

  async login(user: AuthenticatedUser, ua?: string, ip?: string) {
    const roles = this.getActiveRoleNames(user.userRoles as any);
    const isSensitive = roles.some(role => this.SENSITIVE_ROLES.includes(role));

    // 1. Create session regardless (stateful tracking)
    const initialRtPlain = crypto.randomUUID();
    const initialRtHash = await bcrypt.hash(initialRtPlain, 10);
    const rtExpiryDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rtExpiryDays);

    const session = await this.sessionService.createSession(
        user.id,
        user.tenantId,
        initialRtHash,
        expiresAt,
        ua,
        ip
    );

    // 2. Handle MFA Step-Up
    if (isSensitive) {
      const challenge = user.mfaEnabled ? 'MFA_VERIFY' : 'MFA_SETUP';
      
      // Issue a restricted mfaToken (short-lived, limited scope)
      const mfaToken = this.jwtService.sign({
          sub: user.id,
          sid: session.id,
          tenantId: user.tenantId,
          tokenVersion: user.tokenVersion,
          roles,
          scope: 'mfa_challenge',
          challenge
      }, { expiresIn: '5m' });

      return {
          statusCode: HttpStatus.ACCEPTED,
          message: 'MFA_REQUIRED',
          challenge,
          mfaToken
      };
    }

    // 3. Non-sensitive: auto-verify MFA status in session
    await this.sessionService.markMfaVerified(session.id);
    return this.generateTokenPair(user, roles, session.id, initialRtPlain);
  }

  async verifyMfa(userId: string, sessionId: string, code: string) {
    const isValid = await this.mfaService.verifyCode(userId, code);
    if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
    }

    // Mark session as verified
    await this.sessionService.markMfaVerified(sessionId);

    // Re-fetch user with roles
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } }
    });
    if (!user) throw new UnauthorizedException();
    
    const roles = this.getActiveRoleNames(user.userRoles as any);
    
    // Finalize session with real RT
    const newRtPlain = crypto.randomUUID();
    const newRtHash = await bcrypt.hash(newRtPlain, 10);
    
    await this.sessionService.setInitialRefreshToken(sessionId, newRtHash);

    return this.generateTokenPair(user as any, roles, sessionId, newRtPlain);
  }

  async verifyMfaWithRecoveryCode(userId: string, sessionId: string, code: string, tenantId: string) {
    const isValid = await this.mfaService.verifyRecoveryCode(userId, code, tenantId);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired MFA recovery code');
    }

    // Mark session as verified
    await this.sessionService.markMfaVerified(sessionId);

    // Re-fetch user with roles
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } }
    });
    if (!user) throw new UnauthorizedException();
    
    const roles = this.getActiveRoleNames(user.userRoles as any);
    
    // Finalize session with real RT
    const newRtPlain = crypto.randomUUID();
    const newRtHash = await bcrypt.hash(newRtPlain, 10);
    
    await this.sessionService.setInitialRefreshToken(sessionId, newRtHash);

    return this.generateTokenPair(user as any, roles, sessionId, newRtPlain);
  }

  async selectBranch(userId: string, tenantId: string, branchId: string) {
    const assignment = await this.prisma.userBranch.findFirst({
      where: { userId, tenantId, branchId, isActive: true },
    });
    if (!assignment) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true, userRoles: { include: { role: true } } },
    });

    if (!user || user.status !== 'ACTIVE' || user.deactivatedAt !== null) return null;

    // This usually requires a fresh token pair.
    return null; 
  }

  async refreshTokens(userId: string, sessionId: string, refreshToken: string) {
      const newRtPlain = crypto.randomUUID();
      const newRtHash = await bcrypt.hash(newRtPlain, 10);

      const session = await this.sessionService.rotateRefreshToken(
          sessionId,
          refreshToken,
          newRtHash
      );

      const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { userRoles: { include: { role: true } } }
      });

      if (!user) throw new UnauthorizedException();
      const roles = this.getActiveRoleNames(user.userRoles as any);

      return this.generateTokenPair(user as any, roles, session.id, newRtPlain);
  }

  async getUserBranches(userId: string, tenantId: string) {
    const assignments = await this.prisma.userBranch.findMany({
      where: { userId, tenantId, isActive: true },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
    return assignments.map((a) => a.branch);
  }

  async getMe(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user || user.tenantId !== tenantId) return null;

    const roles = this.getActiveRoleNames(user.userRoles as any);
    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.sessionService.revokeSession(sessionId);
  }

  private generateTokenPair(
    user: AuthenticatedUser,
    roles: string[],
    sessionId: string,
    refreshTokenPlain: string,
    branchId?: string,
  ) {
    const payload = {
      sub: user.id,
      sid: sessionId,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion,
      roles: roles,
      mfaVerified: true, // Only generated for fully verified sessions
      ...(branchId && { branchId }),
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: refreshTokenPlain,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        roles,
        ...(branchId && { branchId }),
      },
    };
  }
}
