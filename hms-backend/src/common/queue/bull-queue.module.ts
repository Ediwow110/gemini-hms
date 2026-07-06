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
            if (url.startsWith('rediss://')) {
              try {
                const parsed = new URL(url);
                return {
                  redis: {
                    host: parsed.hostname,
                    port: parseInt(parsed.port || '6379', 10),
                    password: parsed.password
                      ? decodeURIComponent(parsed.password)
                      : undefined,
                    tls: {
                      rejectUnauthorized: false,
                    },
                  },
                };
              } catch (e) {
                // Fallback to direct string connection if parsing fails
                return { redis: url };
              }
            }
            return { redis: url };
          },
        }),
        BullModule.registerQueue({ name: 'notifications' }),
      ],
  providers: isTest ? [mockQueueProvider] : [],
  exports: isTest ? [getQueueToken('notifications')] : [BullModule],
})
export class BullQueueModule {}
