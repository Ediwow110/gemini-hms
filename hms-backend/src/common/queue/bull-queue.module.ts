import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ExampleProcessor } from "./example.processor";

/**
 * Bull queue module. Uses the same Redis instance defined in RedisModule via
 * the REDIS_URL env var. The queue name "example" is illustrative; replace with
 * real queue names as needed.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => {
        const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
        // The BullModule expects the redis option to be either a connection string
        // or an object compatible with ioredis. Here we provide the connection string.
        return { redis: url };
      },
    }),
    BullModule.registerQueue({ name: "example" }),
  ],
  providers: [ExampleProcessor],
  exports: [],
})
export class BullQueueModule {}
