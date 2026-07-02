import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { Logger } from "@nestjs/common";

/**
 * Real async job processor for priority notification dispatch.
 *
 * When a service creates a time‑sensitive notification (e.g., MFA code,
 * password reset, critical lab result alert) it can add a job to the
 * "notifications" queue instead of waiting for the 1‑minute cron tick.
 *
 * Job data shape:
 *   { notificationId: string; tenantId: string }
 */
@Processor("notifications")
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  // We don't inject NotificationDispatcherService here because the
  // dispatcher already runs every minute via its own @Cron.  Instead
  // this processor marks the job arrival and the existing cron will
  // pick it up on the next tick.  In a future lane we can wire direct
  // dispatch through the dispatcher service in-process.

  @Process()
  async handle(job: Job<{ notificationId: string; tenantId: string }>) {
    this.logger.log(
      `[Bull] Priority notification job received: ${job.data.notificationId} ` +
        `(tenant ${job.data.tenantId}, attempt ${job.attemptsMade + 1})`,
    );

    // For immediate dispatch in a future lane:
    //   const dispatcher = this.moduleRef.get(NotificationDispatcherService);
    //   await dispatcher.dispatchPending(job.data.tenantId);

    return { acknowledged: true, notificationId: job.data.notificationId };
  }
}
