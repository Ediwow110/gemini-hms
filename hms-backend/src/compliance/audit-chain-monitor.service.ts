import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuditChainMonitorService {
  private readonly logger = new Logger(AuditChainMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledChainVerification() {
    this.logger.log('Starting scheduled audit chain verification...');

    try {
      const tenants = await this.prisma.tenant.findMany({
        select: { id: true },
      });

      for (const tenant of tenants) {
        try {
          const result = await this.auditService.verifyChainWithSignatures(
            tenant.id,
          );

          if (!result.isValid) {
            this.logger.warn(
              `Chain corruption detected for tenant ${tenant.id}: ${result.corruptedLogIds?.length || 0} corrupted logs`,
            );
          } else {
            this.logger.log(
              `Chain verification passed for tenant ${tenant.id}`,
            );
          }
        } catch (err) {
          this.logger.error(
            `Chain verification failed for tenant ${tenant.id}: ${err}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Scheduled chain verification failed: ${err}`);
    }
  }
}
