import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bull';

const isTest = process.env.NODE_ENV === 'test';

const mockQueueProvider = {
  provide: getQueueToken('notifications'),
  useValue: {
    add: () => Promise.resolve({}),
    process: () => {},
    on: () => {},
  },
};

/**
 * Bull queue module backed by Redis (same REDIS_URL as RedisModule).
 * Provides a configured Bull queue factory.
 * In test environment, it falls back to a mock queue provider to prevent
 * background connection issues and test teardown race conditions.
 */
@Module({
  imports: isTest
    ? []
    : [
        BullModule.forRootAsync({
          useFactory: () => {
            const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
            return { redis: url };
          },
        }),
        BullModule.registerQueue({ name: 'notifications' }),
      ],
  providers: isTest ? [mockQueueProvider] : [],
  exports: isTest ? [getQueueToken('notifications')] : [BullModule],
})
export class BullQueueModule {}
