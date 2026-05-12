import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  EmailProvider,
  SmsProvider,
  NotificationProviderFactory,
} from './notification-providers';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);
  private emailProvider: EmailProvider;
  private smsProvider: SmsProvider;
  private readonly MAX_ATTEMPTS = 3;

  constructor(private prisma: PrismaService) {
    try {
      this.emailProvider = NotificationProviderFactory.createEmailProvider();
      this.smsProvider = NotificationProviderFactory.createSmsProvider();
    } catch (e) {
      this.logger.error(`Provider initialization failed: ${e.message}`);
      throw e;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Running scheduled notification dispatch...');
    try {
      const allTenants = await this.prisma.tenant.findMany({
        select: { id: true },
      });
      for (const t of allTenants) {
        await this.dispatchPending(t.id);
      }
    } catch (e) {
      this.logger.error(`Error during scheduled dispatch: ${e.message}`);
    }
  }

  /**
   * Process all PENDING notifications and route to the correct channel.
   */
  async dispatchPending(
    tenantId: string,
  ): Promise<{ dispatched: number; failed: number }> {
    const pending = await this.prisma.notification.findMany({
      where: { tenantId, status: 'PENDING' },
      select: {
        id: true,
        type: true,
        recipient: true,
        subject: true,
        content: true,
        attempts: true,
        tenantId: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // batch limit
    });

    let dispatched = 0;
    let failed = 0;

    for (const notification of pending) {
      const result = await this.dispatchOne(notification);
      if (result) dispatched++;
      else failed++;
    }

    return { dispatched, failed };
  }

  /**
   * Retry a specific failed notification.
   */
  async retryFailed(id: string, tenantId: string): Promise<boolean> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId, status: 'FAILED' },
    });

    if (!notification) return false;

    if (notification.attempts >= this.MAX_ATTEMPTS) {
      this.logger.warn(
        `Notification ${id} has reached max attempts (${this.MAX_ATTEMPTS})`,
      );
      return false;
    }

    // Reset to PENDING and dispatch
    const updated = await this.prisma.notification.update({
      where: { id, tenantId },
      data: { status: 'PENDING' },
    });

    return this.dispatchOne(updated);
  }

  private async dispatchOne(notification: {
    id: string;
    type: string;
    recipient: string;
    subject: string | null;
    content: string;
    attempts: number;
    tenantId: string;
  }): Promise<boolean> {
    try {
      let result: { success: boolean; error?: string };

      switch (notification.type) {
        case 'EMAIL':
          result = await this.emailProvider.sendEmail({
            to: notification.recipient,
            subject: notification.subject || '(No subject)',
            body: notification.content,
          });
          break;
        case 'SMS':
          result = await this.smsProvider.sendSms({
            to: notification.recipient,
            body: notification.content,
          });
          break;
        case 'IN_APP':
          // In-app notifications are considered "sent" once created
          result = { success: true };
          break;
        default:
          result = {
            success: false,
            error: `Unknown channel: ${notification.type}`,
          };
      }

      if (result.success) {
        await this.prisma.notification.updateMany({
          where: { id: notification.id, tenantId: notification.tenantId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            attempts: notification.attempts + 1,
            lastError: null,
          },
        });
        return true;
      } else {
        await this.prisma.notification.updateMany({
          where: { id: notification.id, tenantId: notification.tenantId },
          data: {
            status: 'FAILED',
            attempts: notification.attempts + 1,
            lastError: result.error || 'Unknown error',
          },
        });
        return false;
      }
    } catch (error) {
      await this.prisma.notification.updateMany({
        where: { id: notification.id, tenantId: notification.tenantId },
        data: {
          status: 'FAILED',
          attempts: notification.attempts + 1,
          lastError: error instanceof Error ? error.message : 'Dispatch error',
        },
      });
      return false;
    }
  }
}
