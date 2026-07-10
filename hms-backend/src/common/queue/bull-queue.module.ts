import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { buildRedisOptions } from '../redis/redis-options';

const isTest = process.env.NODE_ENV === 'test';

const mockQueueProvider = {
  provide: getQueueToken('notifications'),
  useValue: {
    add: () => Promise.resolve({}),
    process: () => undefined,
    on: () => undefined,
  },
};

@Module({
  imports: isTest
    ? []
    : [
        BullModule.forRootAsync({
          useFactory: () => ({ redis: buildRedisOptions() }),
        }),
        BullModule.registerQueue({ name: 'notifications' }),
      ],
  providers: isTest ? [mockQueueProvider] : [],
  exports: isTest ? [getQueueToken('notifications')] : [BullModule],
})
export class BullQueueModule {}
