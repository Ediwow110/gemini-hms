import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditExportDto } from './dto/audit-export.dto';
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

  @Get('events/self')
  @RequirePermissions('audit.self')
  async findMyEvents(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Query(new ValidationPipe({ transform: true })) query: AuditQueryDto,
  ) {
    return this.auditService.findMyEvents(tenantId, userId, query);
  }

  @Get('events/entity/:recordType/:recordId')
  @RequirePermissions('audit.view')
  async findEntityTimeline(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') userRoles: string[],
    @Param('recordType') recordType: string,
    @Param('recordId') recordId: string,
    @Query(new ValidationPipe({ transform: true })) query: AuditQueryDto,
  ) {
    return this.auditService.findEntityTimeline(
      tenantId,
      branchId,
      userRoles,
      recordType,
      recordId,
      query,
    );
  }

  @Get('verify')
  @RequirePermissions('audit.view')
  async verifyChain(@GetUser('tenantId') tenantId: string) {
    return this.auditService.verifyChain(tenantId);
  }

  @Post('verify/signatures')
  @RequirePermissions('audit.view')
  async verifyChainWithSignatures(@GetUser('tenantId') tenantId: string) {
    return this.auditService.verifyChainWithSignatures(tenantId);
  }

  @Get('export')
  @RequirePermissions('audit.export')
  async exportEvents(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') userRoles: string[],
    @Query(new ValidationPipe({ transform: true })) query: AuditExportDto,
  ) {
    return this.auditService.exportEvents(
      tenantId,
      branchId,
      userRoles,
      query,
      query.format || 'csv',
    );
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
