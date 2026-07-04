import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';

/**
 * Minimal Redis module exposing a singleton ioredis client.
 * Consumers can inject the client via `@Inject(REDIS_CLIENT) private readonly redis: Redis`.
 */
@Module({
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class RedisModule {}
