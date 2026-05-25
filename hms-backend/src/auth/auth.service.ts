import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SessionService } from './session.service';
import { MfaService } from './mfa.service';
import { AuditService } from '../audit/audit.service';

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
  private readonly SENSITIVE_ROLES = [
    'Super Admin',
    'Branch Admin',
    'Doctor',
    'Cashier',
    'HR',
    'Finance',
  ];

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService,
    private mfaService: MfaService,
    private audit: AuditService,
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
      where: {
        name: {
          equals: tenantCode,
          mode: 'insensitive',
        },
      },
    });
    if (!tenant) return null;

    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email },
      include: {
        tenant: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user) return null;

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Account locked due to too many failed attempts',
        error: 'account_locked',
        lockedUntil: user.lockedUntil,
      });
    }

    const passwordValid = await bcrypt.compare(pass, user.passwordHash);

    if (
      user.status !== 'ACTIVE' ||
      user.deactivatedAt !== null ||
      !passwordValid
    ) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: newAttempts };

      if (newAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 15);
        updates.lockedUntil = lockUntil;

        // Log lockout audit event
        await this.prisma.$transaction(async (tx) => {
          await tx.user.update({ where: { id: user.id }, data: updates });
          await this.audit.log(
            {
              tenantId: user.tenantId,
              userId: user.id,
              eventKey: 'LOGIN_LOCKOUT',
              recordType: 'User',
              recordId: user.id,
              newValues: {
                email,
                attempts: newAttempts,
                lockedUntil: lockUntil,
              },
            },
            tx,
          );
        });

        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Account locked due to too many failed attempts',
          error: 'account_locked',
          lockedUntil: lockUntil,
        });
      }

      await this.prisma.user.update({ where: { id: user.id }, data: updates });
      return null;
    }

    // Successful login: reset attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil !== null) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: AuthenticatedUser, ua?: string, ip?: string) {
    const roles = this.getActiveRoleNames(user.userRoles);
    const isSensitive = roles.some((role) =>
      this.SENSITIVE_ROLES.includes(role),
    );

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
      ip,
    );

    // 2. Handle MFA Step-Up
    if (isSensitive && process.env.DISABLE_AUTH_VERIFICATION !== 'true') {
      const challenge = user.mfaEnabled ? 'MFA_VERIFY' : 'MFA_SETUP';

      // Issue a restricted mfaToken (short-lived, limited scope)
      const mfaToken = this.jwtService.sign(
        {
          sub: user.id,
          sid: session.id,
          tenantId: user.tenantId,
          tokenVersion: user.tokenVersion,
          roles,
          scope: 'mfa_challenge',
          challenge,
        },
        { expiresIn: '5m' },
      );

      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'MFA_REQUIRED',
        challenge,
        mfaToken,
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
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException();

    const roles = this.getActiveRoleNames(user.userRoles);

    // Finalize session with real RT
    const newRtPlain = crypto.randomUUID();
    const newRtHash = await bcrypt.hash(newRtPlain, 10);

    await this.sessionService.setInitialRefreshToken(sessionId, newRtHash);

    return this.generateTokenPair(user as any, roles, sessionId, newRtPlain);
  }

  async verifyMfaWithRecoveryCode(
    userId: string,
    sessionId: string,
    code: string,
    tenantId: string,
  ) {
    const isValid = await this.mfaService.verifyRecoveryCode(
      userId,
      code,
      tenantId,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired MFA recovery code');
    }

    // Mark session as verified
    await this.sessionService.markMfaVerified(sessionId);

    // Re-fetch user with roles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException();

    const roles = this.getActiveRoleNames(user.userRoles);

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

    if (!user || user.status !== 'ACTIVE' || user.deactivatedAt !== null)
      return null;

    const roles = this.getActiveRoleNames(user.userRoles);

    // Create a new session to reflect branch context
    const newRtPlain = crypto.randomUUID();
    const newRtHash = await bcrypt.hash(newRtPlain, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await this.sessionService.createSession(
      user.id,
      user.tenantId,
      newRtHash,
      expiresAt,
    );

    await this.sessionService.markMfaVerified(session.id);

    return this.generateTokenPair(
      user,
      roles,
      session.id,
      newRtPlain,
      branchId,
    );
  }

  async refreshTokens(userId: string, sessionId: string, refreshToken: string) {
    const newRtPlain = crypto.randomUUID();
    const newRtHash = await bcrypt.hash(newRtPlain, 10);

    const session = await this.sessionService.rotateRefreshToken(
      sessionId,
      refreshToken,
      newRtHash,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) throw new UnauthorizedException();
    const roles = this.getActiveRoleNames(user.userRoles);

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
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user || user.tenantId !== tenantId) return null;

    const roles = this.getActiveRoleNames(user.userRoles);

    // Retrieve active role permissions
    const permissions = new Set<string>();
    for (const ur of user.userRoles) {
      if (
        ur.status === 'ACTIVE' &&
        ur.role &&
        ur.role.status === 'ACTIVE' &&
        ur.role.archivedAt === null &&
        ur.role.rolePermissions
      ) {
        for (const rp of ur.role.rolePermissions) {
          if (rp.permission && rp.permission.name) {
            permissions.add(rp.permission.name);
          }
        }
      }
    }

    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
      permissions: Array.from(permissions),
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
      sessionId,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        roles,
        ...(branchId && { branchId }),
      },
    };
  }
}
