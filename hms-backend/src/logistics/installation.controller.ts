import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InstallationService } from './installation.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(RolesGuard)
@Controller('api/v1/logistics/installations')
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Get()
  @Roles('Nurse', 'Super Admin')
  async findAll(@GetUser('tenantId') tenantId: string) {
    return this.installationService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('Nurse', 'Super Admin')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const job = await this.installationService.findOne(tenantId, id);
    if (!job) {
      throw new NotFoundException('Installation job not found');
    }
    return job;
  }

  @Patch(':id/status')
  @Roles('Nurse', 'Super Admin')
  async updateStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: { status: any; note?: string },
  ) {
    return this.installationService.updateStatus(
      tenantId,
      userId,
      id,
      dto.status,
      dto.note,
    );
  }
}
