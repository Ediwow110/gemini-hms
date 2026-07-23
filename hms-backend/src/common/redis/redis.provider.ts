import type { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { buildRedisOptions } from './redis-options';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    if (process.env.NODE_ENV === 'test') {
      return {
        get: () => Promise.resolve(null),
        set: () => Promise.resolve('OK'),
        del: () => Promise.resolve(0),
        keys: () => Promise.resolve([]),
        mget: () => Promise.resolve([]),
        ping: () => Promise.resolve('PONG'),
        on: () => undefined,
        quit: () => Promise.resolve('OK'),
        disconnect: () => undefined,
      };
    }

    return new Redis(buildRedisOptions());
  },
};
