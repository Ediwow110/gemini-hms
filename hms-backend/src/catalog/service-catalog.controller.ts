import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceStatus,
} from './dto/service-catalog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/service-catalog')
export class ServiceCatalogController {
  constructor(private readonly catalogService: ServiceCatalogService) {}

  @Post()
  @RequirePermissions('catalog.service.create')
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.catalogService.create(tenantId, userId, dto);
  }

  @Get()
  @RequirePermissions('catalog.service.view')
  findAll(
    @GetUser('tenantId') tenantId: string,
    @Query('status') status?: ServiceStatus,
  ) {
    return this.catalogService.findAll(tenantId, status);
  }

  @Get(':id')
  @RequirePermissions('catalog.service.view')
  findOne(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.catalogService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('catalog.service.update')
  update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.catalogService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('catalog.service.deactivate')
  deactivate(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.catalogService.deactivate(tenantId, userId, id);
  }
}
