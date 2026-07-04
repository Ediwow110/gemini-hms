import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { Logger } from "@nestjs/common";
import { NotificationDispatcherService } from "../../notifications/notification-dispatcher.service";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Real async job processor for priority notification dispatch.
 * Bypasses the 1-minute cron tick for immediate delivery of critical alerts.
 */
@Processor("notifications")
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly dispatcher: NotificationDispatcherService,
    private readonly prisma: PrismaService,
  ) {}

  @Process()
  async handle(job: Job<{ notificationId: string; tenantId: string }>) {
    const { notificationId, tenantId } = job.data;
    this.logger.log(`[Bull] Immediate dispatch for notification ${notificationId}`);

    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        this.logger.warn(`Notification ${notificationId} not found in DB`);
        return { success: false, error: "not_found" };
      }

      const result = await this.dispatcher.dispatchOne({
        id: notification.id,
        type: notification.type,
        recipient: notification.recipient,
        subject: notification.subject,
        content: notification.content,
        attempts: notification.attempts,
        tenantId: notification.tenantId,
      });

      return { success: result };
    } catch (err: unknown) {
      this.logger.error(`Bull priority dispatch failed: ${err}`);
      throw err;
    }
  }
}
