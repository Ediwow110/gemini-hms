import { validateRuntimeEnvironment } from './validate-runtime-environment';

const validProductionEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@db:5432/hms',
  JWT_SECRET: 'j'.repeat(64),
  MASTER_MFA_KEY: 'm'.repeat(64),
  AUDIT_CHAIN_SECRET: 'a'.repeat(64),
  CORS_ALLOWED_ORIGINS: 'https://hms.example.com',
  REDIS_URL: 'redis://redis:6379',
  EMAIL_PROVIDER: 'ses',
  AWS_REGION: 'ap-southeast-1',
  SES_SENDER_EMAIL: 'noreply@hms.example.com',
  AWS_ACCESS_KEY_ID: 'AKIATEST',
  AWS_SECRET_ACCESS_KEY: 'test-secret-access-key',
  SMS_PROVIDER: 'semaphore',
  SEMAPHORE_API_KEY: 'test-semaphore-key',
});

describe('validateRuntimeEnvironment', () => {
  it('accepts a complete production configuration', () => {
    expect(() =>
      validateRuntimeEnvironment(validProductionEnv()),
    ).not.toThrow();
  });

  it('fails closed when audit signing or Redis configuration is missing', () => {
    const env = validProductionEnv();
    delete env.AUDIT_CHAIN_SECRET;
    delete env.REDIS_URL;

    expect(() => validateRuntimeEnvironment(env)).toThrow(
      /AUDIT_CHAIN_SECRET is required; REDIS_URL is required/,
    );
  });

  it('requires secret isolation for audit signing and MFA encryption', () => {
    const env = validProductionEnv();
    env.AUDIT_CHAIN_SECRET = env.JWT_SECRET;
    env.MASTER_MFA_KEY = env.JWT_SECRET;

    expect(() => validateRuntimeEnvironment(env)).toThrow(
      /AUDIT_CHAIN_SECRET must be different.*MASTER_MFA_KEY must be different/,
    );
  });

  it('rejects auth bypasses, mock providers, and wildcard CORS in production', () => {
    const env = validProductionEnv();
    env.DISABLE_AUTH_VERIFICATION = 'true';
    env.EMAIL_PROVIDER = 'mock';
    env.SMS_PROVIDER = 'mock';
    env.CORS_ALLOWED_ORIGINS = '*';

    expect(() => validateRuntimeEnvironment(env)).toThrow(
      /DISABLE_AUTH_VERIFICATION.*EMAIL_PROVIDER=mock.*SMS_PROVIDER=mock.*wildcard/,
    );
  });

  it('requires credentials for the selected live notification providers', () => {
    const env = validProductionEnv();
    delete env.AWS_ACCESS_KEY_ID;
    delete env.SEMAPHORE_API_KEY;

    expect(() => validateRuntimeEnvironment(env)).toThrow(
      /AWS_ACCESS_KEY_ID is required.*SEMAPHORE_API_KEY is required/,
    );
  });

  it('validates a configured Redis URL outside production without requiring prod secrets', () => {
    expect(() =>
      validateRuntimeEnvironment({
        NODE_ENV: 'development',
        REDIS_URL: 'https://not-redis.example.com',
      }),
    ).toThrow(/REDIS_URL must use redis:\/\/ or rediss:\/\//);
  });
});
