import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
    // Resolve tenantCode to tenantId first
    const tenant = await this.prisma.tenant.findFirst({
      where: { name: tenantCode },
    });

    if (!tenant) return null;

    // Tenant-scoped lookup
    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email },
      include: {
        tenant: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (
      user &&
      user.status === 'ACTIVE' &&
      user.deactivatedAt === null &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: AuthenticatedUser) {
    // Extract roles for the payload
    const roles = this.getActiveRoleNames(user.userRoles);

    // Resolve branch context from user assignments (Foundation for Section 7 Branch Scoping)
    const activeBranches = await this.prisma.userBranch.findMany({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
        isActive: true,
      },
      select: {
        branchId: true,
      },
    });

    // Include branchId in JWT only if exactly one active assignment exists
    const branchId =
      activeBranches.length === 1 ? activeBranches[0].branchId : undefined;

    return this.generateTokenResponse(user, roles, branchId);
  }

  async selectBranch(userId: string, tenantId: string, branchId: string) {
    // Validate active assignment exists for this specific branch
    const assignment = await this.prisma.userBranch.findFirst({
      where: {
        userId,
        tenantId,
        branchId,
        isActive: true,
      },
    });

    if (!assignment) {
      return null;
    }

    // Re-fetch user with roles for token generation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (
      !user ||
      user.tenantId !== tenantId ||
      user.status !== 'ACTIVE' ||
      user.deactivatedAt !== null
    ) {
      return null;
    }

    const roles = this.getActiveRoleNames(user.userRoles);
    return this.generateTokenResponse(user, roles, branchId);
  }

  async getUserBranches(userId: string, tenantId: string) {
    const assignments = await this.prisma.userBranch.findMany({
      where: {
        userId,
        tenantId,
        isActive: true,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return assignments.map((a) => a.branch);
  }

  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        role: { tenantId, status: 'ACTIVE', archivedAt: null },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const userPermissions = new Set<string>();

    for (const ur of userRoles) {
      if (ur.role && ur.role.rolePermissions) {
        for (const rp of ur.role.rolePermissions) {
          const permissionName = rp.permission?.name;
          if (typeof permissionName === 'string' && permissionName.length > 0) {
            userPermissions.add(permissionName);
          }
        }
      }
    }
    return Array.from(userPermissions);
  }

  async getMe(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user || user.tenantId !== tenantId) return null;

    const roles = this.getActiveRoleNames(user.userRoles);

    const permissions = await this.getUserPermissions(userId, tenantId);

    // Resolve active branch
    const activeBranches = await this.prisma.userBranch.findMany({
      where: {
        userId,
        tenantId,
        isActive: true,
      },
      select: {
        branchId: true,
      },
    });
    const branchId =
      activeBranches.length === 1 ? activeBranches[0].branchId : undefined;

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      branchId,
      roles,
      permissions,
    };
  }

  private generateTokenResponse(
    user: AuthenticatedUser,
    roles: string[],
    branchId?: string,
  ) {
    // Inject required fields into the JWT payload (CRITICAL for Section 7 Tenant Isolation)
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion,
      ...(branchId && { branchId }),
      roles: roles,
      jti: crypto.randomUUID(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roles: roles,
        ...(branchId && { branchId }),
      },
    };
  }
}
