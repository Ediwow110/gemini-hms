import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT_KEYS } from '../audit/audit-event-keys';

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

          if (result.isValid) {
            this.logger.log(
              `Chain verification passed for tenant ${tenant.id}`,
            );
            try {
              await this.auditService.log({
                tenantId: tenant.id,
                userId: null,
                eventKey: AUDIT_EVENT_KEYS.CHAIN_VERIFICATION_RUN,
                recordType: 'AuditChain',
                recordId: tenant.id,
                newValues: {
                  isValid: true,
                  verificationCount: result.verificationCount,
                  truncated: result.truncated,
                },
              });
            } catch (err) {
              this.logger.error(`Failed to log CHAIN_VERIFICATION_RUN: ${err}`);
            }
          } else {
            this.logger.warn(
              `Chain corruption detected for tenant ${tenant.id}: ${result.corruptedLogIds?.length || 0} corrupted logs`,
            );
            try {
              await this.auditService.log({
                tenantId: tenant.id,
                userId: null,
                eventKey: AUDIT_EVENT_KEYS.CHAIN_CORRUPTION_DETECTED,
                recordType: 'AuditChain',
                recordId: tenant.id,
                newValues: {
                  isValid: false,
                  corruptedLogIds: result.corruptedLogIds,
                  signatureErrors: result.signatureErrors,
                  verificationCount: result.verificationCount,
                },
              });
            } catch (err) {
              this.logger.error(
                `Failed to log CHAIN_CORRUPTION_DETECTED: ${err}`,
              );
            }
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
