import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { SlaAlertsService } from './sla-alerts.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(RolesGuard)
@Controller('api/v1/sla-alerts')
export class SlaAlertsController {
  constructor(private readonly slaAlertsService: SlaAlertsService) {}

  @Get()
  @Roles('Super Admin', 'Branch Admin', 'Compliance Officer')
  async getActiveAlerts(@GetUser('tenantId') tenantId: string) {
    return this.slaAlertsService.getActiveAlerts(tenantId);
  }

  @Patch(':id/acknowledge')
  @Roles('Super Admin', 'Branch Admin', 'Compliance Officer')
  async acknowledgeAlert(
    @Param('id') id: string,
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.slaAlertsService.acknowledgeAlert(id, tenantId);
  }
}
