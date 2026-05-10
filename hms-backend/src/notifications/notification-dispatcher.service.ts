import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MockEmailProvider,
  MockSmsProvider,
  EmailProvider,
  SmsProvider,
} from './notification-providers';

@Injectable()
export class NotificationDispatcherService {
  private emailProvider: EmailProvider;
  private smsProvider: SmsProvider;

  constructor(private prisma: PrismaService) {
    // Default to mock providers. Swap with real adapters via DI or config.
    this.emailProvider = new MockEmailProvider();
    this.smsProvider = new MockSmsProvider();
  }

  /**
   * Process all PENDING notifications and route to the correct channel.
   */
  async dispatchPending(
    tenantId: string,
  ): Promise<{ dispatched: number; failed: number }> {
    const pending = await this.prisma.notification.findMany({
      where: { tenantId, status: 'PENDING' },
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

    // Reset to PENDING and dispatch
    const updated = await this.prisma.notification.update({
      where: { id },
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
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            attempts: notification.attempts + 1,
            lastError: null,
          },
        });
        return true;
      } else {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            attempts: notification.attempts + 1,
            lastError: result.error || 'Unknown error',
          },
        });
        return false;
      }
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
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
