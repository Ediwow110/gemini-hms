import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { NotificationProcessor } from "./example.processor";

/**
 * Bull queue module backed by Redis (same REDIS_URL as RedisModule).
 *
 * Registered queues:
 *   "notifications" — priority async dispatch for time‑sensitive notifications
 *     (MFA codes, password resets, critical alerts). The NotificationProcessor
 *     acknowledges each job; the existing NotificationDispatcherService cron
 *     picks up PENDING notifications every minute.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => {
        const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
        return { redis: url };
      },
    }),
    BullModule.registerQueue({ name: "notifications" }),
  ],
  providers: [NotificationProcessor],
  exports: [],
})
export class BullQueueModule {}
