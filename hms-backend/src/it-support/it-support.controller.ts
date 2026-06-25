import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ItSupportService } from './it-support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('api/v1/it-support')
@UseGuards(PermissionsGuard)
export class ItSupportController {
  constructor(private readonly itSupportService: ItSupportService) {}

  @Get('sessions')
  @RequirePermissions('it.system.view')
  @RequireBranchContext()
  async getSessions(
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.itSupportService.getActiveSessions(tenantId);
  }

  @Get('integrations')
  @RequirePermissions('it.system.view')
  @RequireBranchContext()
  async getIntegrations(
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.itSupportService.getIntegrations(tenantId);
  }

  @Get('backups')
  @RequirePermissions('it.system.view')
  @RequireBranchContext()
  async getBackups(
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.itSupportService.getBackups(tenantId);
  }

  @Get('logs')
  @RequirePermissions('it.system.view')
  @RequireBranchContext()
  async getLogs(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    const bId = queryBranchId || branchId;
    return this.itSupportService.getSystemLogs(tenantId, bId);
  }

  @Get('health')
  @RequirePermissions('it.system.view')
  @RequireBranchContext()
  async getHealth() {
    return this.itSupportService.getSystemHealth();
  }

  @Post('tickets')
  @RequirePermissions('it.ticket.manage')
  async create(
    @Body() dto: CreateTicketDto,
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.itSupportService.create(dto, tenantId, userId);
  }

  @Get('tickets')
  @RequirePermissions('it.ticket.view')
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('roles') roles: string[],
    @Query() query: QueryTicketDto,
  ) {
    return this.itSupportService.findAll(tenantId, userId, roles, query);
  }

  @Get('tickets/stats')
  @RequirePermissions('it.ticket.view')
  async getStats(@GetUser('tenantId') tenantId: string) {
    return this.itSupportService.getStats(tenantId);
  }

  @Get('tickets/:id')
  @RequirePermissions('it.ticket.view')
  async findOne(
    @Param('id') id: string,
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('roles') roles: string[],
  ) {
    return this.itSupportService.findOne(id, tenantId, userId, roles);
  }

  @Patch('tickets/:id')
  @RequirePermissions('it.ticket.manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.itSupportService.update(id, dto, tenantId, userId);
  }
}
