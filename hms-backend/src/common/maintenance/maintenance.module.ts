import { Module } from "@nestjs/common";
import { RetentionService } from "./retention.service";

/**
 * Module bundling scheduled maintenance tasks (e.g., data retention).
 * Import this module into AppModule to enable the cron jobs.
 */
@Module({
  providers: [RetentionService],
  exports: [],
})
export class MaintenanceModule {}

