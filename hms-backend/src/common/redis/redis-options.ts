import type { RedisOptions } from 'ioredis';

export function getRedisUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.REDIS_URL?.trim();
  if (configured) {
    return configured;
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('REDIS_URL must be defined in production.');
  }
  return 'redis://127.0.0.1:6379';
}

export function buildRedisOptions(
  env: NodeJS.ProcessEnv = process.env,
): RedisOptions {
  const url = new URL(getRedisUrl(env));
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://.');
  }

  const databasePath = url.pathname.replace(/^\//, '');
  const database = databasePath ? Number.parseInt(databasePath, 10) : 0;
  if (!Number.isInteger(database) || database < 0) {
    throw new Error('REDIS_URL database index must be a non-negative integer.');
  }

  const options: RedisOptions = {
    host: url.hostname,
    port: Number.parseInt(url.port || '6379', 10),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: database,
    enableReadyCheck: true,
    connectTimeout: 10_000,
  };

  if (url.protocol === 'rediss:') {
    const ca = env.REDIS_TLS_CA_BASE64
      ? Buffer.from(env.REDIS_TLS_CA_BASE64, 'base64').toString('utf8')
      : undefined;
    options.tls = {
      rejectUnauthorized: true,
      servername: url.hostname,
      ...(ca ? { ca } : {}),
    };
  }

  return options;
}
