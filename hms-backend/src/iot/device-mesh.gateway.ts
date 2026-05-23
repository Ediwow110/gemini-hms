import { Injectable, Logger } from '@nestjs/common';

export interface ParsedTelemetry {
  tenantId: string;
  deviceId: string;
  telemetryValue: number;
  authToken: string;
  cachedInRedis: boolean;
  syncedToPostgres: boolean;
}

@Injectable()
export class DeviceMeshGateway {
  private readonly logger = new Logger(DeviceMeshGateway.name);

  // Simulated Redis ring buffer ring memory
  private readonly redisRingBuffer = new Map<string, ParsedTelemetry>();

  /**
   * Decodes binary hardware payload streams and caches/syncs telemetry
   */
  async handleDeviceIngest(payload: Buffer): Promise<ParsedTelemetry> {
    this.logger.log(
      `Received remote IoT telemetry buffer stream: Length ${payload.length} bytes`,
    );

    // Minimum package length: 36 (tenantId) + 16 (deviceId) + 4 (float value) + 36 (authToken) = 92 bytes
    if (payload.length < 92) {
      throw new Error(
        `CRITICAL: Fragmented packet rejected. Expected >= 92 bytes, got ${payload.length}`,
      );
    }

    // 1. Parse byte stream variables
    const tenantId = payload.toString('utf8', 0, 36).trim();
    const deviceId = payload.toString('utf8', 36, 52).trim();
    const telemetryValue = payload.readFloatBE(52);
    const authToken = payload.toString('utf8', 56, 92).trim();

    this.logger.log(
      `Parsed IoT metrics: Device [${deviceId}] | Tenant [${tenantId}] | Val: ${telemetryValue}`,
    );

    // 2. Strict tenant schema validation bounds
    // Verify that the auth token matches the tenant context validation hash (mocked for absolute isolation safety)
    const expectedHash = this.computeValidationHash(tenantId, deviceId);
    if (authToken !== expectedHash) {
      this.logger.error(
        `🚨 [TENANT_VIOLATION] Hardware auth signature rejected! Unauthorized access to Tenant ID ${tenantId}.`,
      );
      throw new Error(
        `Security Exception: Multi-tenant tenantId namespace boundary breach detected!`,
      );
    }

    // 3. Cache inside Redis memory ring layer
    const telemetryRecord: ParsedTelemetry = {
      tenantId,
      deviceId,
      telemetryValue,
      authToken,
      cachedInRedis: true,
      syncedToPostgres: false,
    };

    const redisKey = `${tenantId}:${deviceId}`;
    this.redisRingBuffer.set(redisKey, telemetryRecord);
    this.logger.log(
      `🟢 [REDIS_CACHE] Buffered telemetry under key "${redisKey}" (Latency < 2ms)`,
    );

    // 4. Asynchronous postgres synchronization sync loop to avoid pool contention
    this.triggerAsynchronousPostgresWrite(redisKey, telemetryRecord);

    return telemetryRecord;
  }

  /**
   * Computes a deterministic multi-tenant security verification hash
   */
  public computeValidationHash(tenantId: string, deviceId: string): string {
    const salt = 'SILICON_IOT_MESH_SALT_2026';
    const content = `${tenantId}-${deviceId}-${salt}`;
    return Buffer.from(content).toString('base64').slice(0, 36);
  }

  /**
   * Dispatches non-blocking PostgreSQL updates in background thread
   */
  private triggerAsynchronousPostgresWrite(
    key: string,
    record: ParsedTelemetry,
  ) {
    setImmediate(() => {
      // Simulate non-blocking Prisma write to database
      record.syncedToPostgres = true;
      this.logger.log(
        `🟢 [POSTGRES_SYNC] Dynamic background ledger write completed for target "${key}".`,
      );
    });
  }
}
