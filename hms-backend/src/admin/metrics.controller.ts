import { Controller, Get, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(RolesGuard)
@Controller('api/v1/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Roles('Super Admin', 'Branch Admin')
  async getMetrics() {
    return this.metricsService.getPrometheusFormat();
  }
}
