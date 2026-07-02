import { Provider } from "@nestjs/common";
import Redis from "ioredis";

/**
 * Simple Redis provider using ioredis. The connection string is read from the
 * environment variable `REDIS_URL`. If not set, it falls back to localhost:6379.
 *
 * The exported token can be injected elsewhere with `@Inject(REDIS_CLIENT)`.
 */
export const REDIS_CLIENT = "REDIS_CLIENT";

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    return new Redis(url);
  },
};

