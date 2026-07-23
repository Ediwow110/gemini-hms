import { buildRedisOptions, getRedisUrl } from './redis-options';

describe('Redis connection options', () => {
  it('fails closed without REDIS_URL in production', () => {
    expect(() => getRedisUrl({ NODE_ENV: 'production' })).toThrow(
      /REDIS_URL must be defined/,
    );
  });

  it('keeps the localhost fallback limited to non-production environments', () => {
    expect(getRedisUrl({ NODE_ENV: 'development' })).toBe(
      'redis://127.0.0.1:6379',
    );
  });

  it('verifies TLS certificates for rediss connections', () => {
    const options = buildRedisOptions({
      NODE_ENV: 'production',
      REDIS_URL: 'rediss://user:password@cache.example.com:6380/2',
    });

    expect(options).toEqual(
      expect.objectContaining({
        host: 'cache.example.com',
        port: 6380,
        username: 'user',
        password: 'password',
        db: 2,
        tls: expect.objectContaining({
          rejectUnauthorized: true,
          servername: 'cache.example.com',
        }),
      }),
    );
  });

  it('supports an explicitly supplied private CA without disabling verification', () => {
    const ca = '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----';
    const options = buildRedisOptions({
      NODE_ENV: 'production',
      REDIS_URL: 'rediss://cache.example.com:6380',
      REDIS_TLS_CA_BASE64: Buffer.from(ca).toString('base64'),
    });

    expect(options.tls).toEqual(
      expect.objectContaining({ rejectUnauthorized: true, ca }),
    );
  });
});
