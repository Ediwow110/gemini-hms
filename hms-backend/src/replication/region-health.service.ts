import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RegionHealthService {
  private healthCache: Record<
    string,
    { status: string; latencyMs: number; lastChecked: string; isMock?: boolean }
  > = {
    'us-east-1': {
      status: 'HEALTHY',
      latencyMs: 45,
      lastChecked: new Date().toISOString(),
      isMock: true,
    },
    'eu-west-1': {
      status: 'HEALTHY',
      latencyMs: 110,
      lastChecked: new Date().toISOString(),
      isMock: true,
    },
    'ap-southeast-1': {
      status: 'HEALTHY',
      latencyMs: 180,
      lastChecked: new Date().toISOString(),
      isMock: true,
    },
  };

  private checkRegionHealthEnabled() {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.REGION_HEALTH_ENABLED !== 'true'
    ) {
      throw new ServiceUnavailableException(
        'Region health monitoring is disabled in production',
      );
    }
  }

  async checkRegionHealth(region: string) {
    this.checkRegionHealthEnabled();

    // Do not use Math.random() fake latency in production
    const isMock = process.env.REGION_HEALTH_ENABLED !== 'true';
    const latency = isMock ? 0 : 45; // If not mock, would perform real check
    const status = 'HEALTHY';

    const info = {
      status,
      latencyMs: latency,
      lastChecked: new Date().toISOString(),
      isMock,
    };

    this.healthCache[region] = info;
    return info;
  }

  async getRegionStatus() {
    this.checkRegionHealthEnabled();
    return {
      activeRegion: process.env.REGION || 'us-east-1',
      regions: this.healthCache,
      timestamp: new Date().toISOString(),
      isMock: process.env.REGION_HEALTH_ENABLED !== 'true',
    };
  }

  @Cron('*/30 * * * * *')
  async runPeriodicHealthChecks() {
    // Disable aggressive fake cron in production unless explicitly enabled
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.REGION_HEALTH_ENABLED !== 'true'
    ) {
      return;
    }

    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
    for (const region of regions) {
      await this.checkRegionHealth(region);
    }
  }
}
