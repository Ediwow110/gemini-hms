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
    const roles = user.userRoles.map((ur: any) => ur.role.name);

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
      },
    };
  }
}
