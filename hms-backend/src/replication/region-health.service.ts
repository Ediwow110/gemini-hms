import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RegionHealthService {
  private healthCache: Record<string, { status: string; latencyMs: number; lastChecked: string }> = {
    'us-east-1': { status: 'HEALTHY', latencyMs: 45, lastChecked: new Date().toISOString() },
    'eu-west-1': { status: 'HEALTHY', latencyMs: 110, lastChecked: new Date().toISOString() },
    'ap-southeast-1': { status: 'HEALTHY', latencyMs: 180, lastChecked: new Date().toISOString() },
  };

  async checkRegionHealth(region: string) {
    const latency = Math.floor(Math.random() * 50) + 20; // 20-70ms
    const status = 'HEALTHY';

    const info = {
      status,
      latencyMs: latency,
      lastChecked: new Date().toISOString(),
    };

    this.healthCache[region] = info;
    return info;
  }

  async getRegionStatus() {
    return {
      activeRegion: process.env.REGION || 'us-east-1',
      regions: this.healthCache,
      timestamp: new Date().toISOString(),
    };
  }

  @Cron('*/30 * * * * *')
  async runPeriodicHealthChecks() {
    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
    for (const region of regions) {
      await this.checkRegionHealth(region);
    }
  }
}
