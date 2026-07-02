import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { DataRetentionService } from "../../compliance/data-retention.service";

/**
 * Scheduled maintenance job that delegates to the compliance module's
 * fully‑wired DataRetentionService. Every day at 02:00 UTC it iterates
 * over all active tenants and enforces the HIPAA‑grade retention policies
 * (6‑year archival for patients, encounters, lab results, invoices, payments).
 *
 * The compliance DataRetentionService also supports per‑class audit‑log
 * retention (FINANCIAL 10y, CLINICAL 10y, ADMINISTRATIVE 3y, SECURITY 5y,
 * EXPORT 1y, TRANSIENT 90d) — those are queryable via GET /retention/status
 * but archival of audit logs themselves is deferred to a future lane.
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataRetention: DataRetentionService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeOldData() {
    this.logger.log("Starting scheduled retention enforcement across all tenants…");

    const tenants = await this.prisma.tenant.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });

    const results: { tenant: string; archived: object }[] = [];
    for (const tenant of tenants) {
      try {
        const archived = await this.dataRetention.enforceRetention(tenant.id);
        results.push({ tenant: tenant.name, archived });
        this.logger.log(
          `Retention complete for "${tenant.name}": ` +
            `${JSON.stringify(archived)}`,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Retention failed for "${tenant.name}": ${message}`,
        );
        results.push({ tenant: tenant.name, archived: { error: message } });
      }
    }

    this.logger.log(
      `Retention sweep finished. ${results.length} tenant(s) processed.`,
    );
    return results;
  }
}
