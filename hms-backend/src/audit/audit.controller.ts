import { Controller, Get, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(PermissionsGuard)
@Controller('api/v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  @RequirePermissions('audit.view')
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') userRoles: string[],
    @Query(new ValidationPipe({ transform: true })) query: AuditQueryDto,
  ) {
    return this.auditService.findAll(tenantId, branchId, userRoles, query);
  }

  @Get('verify')
  @RequirePermissions('audit.view')
  async verifyChain(@GetUser('tenantId') tenantId: string) {
    return this.auditService.verifyChain(tenantId);
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
