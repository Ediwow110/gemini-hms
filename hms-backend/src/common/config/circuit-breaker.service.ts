import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type CircuitBreakerKey = 'MAINTENANCE_MODE' | 'BILLING_READ_ONLY' | 'LAB_QUEUE_PAUSE';

@Injectable()
export class CircuitBreakerService {
  // Config resides in the writable prisma folder inside the running NestJS container context
  private readonly configPath = path.resolve(__dirname, '../../../../prisma/circuit-breaker.json');

  private readConfig(): Record<string, Record<string, boolean>> {
    try {
      if (!fs.existsSync(this.configPath)) {
        return {};
      }
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private writeConfig(config: Record<string, Record<string, boolean>>) {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write circuit-breaker config file:', err);
    }
  }

  /**
   * Retrieves the current feature toggle / circuit breaker state for a specific tenant.
   * If the config database file or key is null or missing, it safely defaults to false.
   */
  public getToggleState(tenantId: string, key: CircuitBreakerKey): boolean {
    const config = this.readConfig();
    const tenantConfig = config[tenantId];
    if (!tenantConfig || tenantConfig[key] === undefined) {
      return false; // safe operational default
    }
    return tenantConfig[key];
  }

  /**
   * Sets the toggle state for a given key under the specific tenant.
   */
  public setToggleState(tenantId: string, key: CircuitBreakerKey, value: boolean): void {
    const config = this.readConfig();
    if (!config[tenantId]) {
      config[tenantId] = {};
    }
    config[tenantId][key] = value;
    this.writeConfig(config);
  }
}
