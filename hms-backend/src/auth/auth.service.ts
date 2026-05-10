import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // In a multi-tenant system, we might need tenantId for login, or we look up by email and infer tenant.
    // For now, we assume email is unique globally or they provide a tenant alias in production.
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: {
        tenant: true,
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Extract roles for the payload
    const roles = user.userRoles.map((ur: any) => ur.role.name);
    
    // Inject tenant_id into the JWT payload (CRITICAL for Section 7 Tenant Isolation)
    const payload = { 
      sub: user.id, 
      email: user.email, 
      tenant_id: user.tenantId,
      roles: roles
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        roles: roles
      }
    };
  }
}
