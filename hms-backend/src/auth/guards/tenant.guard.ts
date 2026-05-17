import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<any>();
    const tenantIdHeader = request.headers['x-tenant-id'];

    if (!tenantIdHeader) {
      if (request.user && request.user.tenantId) {
        request.tenantId = request.user.tenantId;
        return true;
      }
      throw new BadRequestException('X-Tenant-ID header is missing');
    }

    const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (request.user && request.user.tenantId && request.user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access forbidden');
    }

    request.tenantId = tenantId;
    if (request.user) {
      request.user.tenantId = tenantId;
    }

    return true;
  }
}
