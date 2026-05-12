import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditService, type AuditQueryDto } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  @RequirePermissions('audit.view')
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') userRoles: string[],
    @Query() query: AuditQueryDto,
  ) {
    return this.auditService.findAll(tenantId, branchId, userRoles, query);
  }

  @Get('events/:id')
  @RequirePermissions('audit.view')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') userRoles: string[],
    @Param('id') id: string,
  ) {
    return this.auditService.findOne(tenantId, branchId, userRoles, id);
  }
}
