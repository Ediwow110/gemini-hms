import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    tenantCode: string,
    email: string,
    pass: string,
  ): Promise<any> {
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

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Extract roles for the payload
    const roles: string[] = user.userRoles.map(
      (ur: any) => ur.role.name as string,
    );

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
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) return null;

    const roles: string[] = user.userRoles.map(
      (ur: any) => ur.role.name as string,
    );
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
        userId: userId,
        role: { tenantId: tenantId },
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
          if (rp.permission && rp.permission.name) {
            userPermissions.add(rp.permission.name);
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

    if (!user) return null;

    const roles: string[] = user.userRoles.map(
      (ur: any) => ur.role.name as string,
    );

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

  private generateTokenResponse(user: any, roles: string[], branchId?: string) {
    // Inject required fields into the JWT payload (CRITICAL for Section 7 Tenant Isolation)
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
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
