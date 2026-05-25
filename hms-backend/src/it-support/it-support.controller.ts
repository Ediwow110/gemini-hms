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
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('api/v1/it-support')
@UseGuards(PermissionsGuard)
export class ItSupportController {
  constructor(private readonly itSupportService: ItSupportService) {}

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
