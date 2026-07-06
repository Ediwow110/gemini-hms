import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Simple Redis provider using ioredis. The connection string is read from the
 * environment variable `REDIS_URL`. If not set, it falls back to localhost:6379.
 *
 * The exported token can be injected elsewhere with `@Inject(REDIS_CLIENT)`.
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

const isTest = process.env.NODE_ENV === 'test';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    if (isTest) {
      return {
        get: () => Promise.resolve(null),
        set: () => Promise.resolve('OK'),
        del: () => Promise.resolve(0),
        keys: () => Promise.resolve([]),
        mget: () => Promise.resolve([]),
        on: () => {},
        quit: () => Promise.resolve('OK'),
        disconnect: () => {},
      };
    }
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    if (url.startsWith('rediss://')) {
      try {
        const parsed = new URL(url);
        return new Redis({
          host: parsed.hostname,
          port: parseInt(parsed.port || '6379', 10),
          password: parsed.password
            ? decodeURIComponent(parsed.password)
            : undefined,
          tls: {
            rejectUnauthorized: false,
          },
        });
      } catch (e) {
        return new Redis(url);
      }
    }
    return new Redis(url);
  },
};
