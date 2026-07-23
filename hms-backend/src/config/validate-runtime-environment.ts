const PRODUCTION_REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'MASTER_MFA_KEY',
  'AUDIT_CHAIN_SECRET',
  'CORS_ALLOWED_ORIGINS',
  'REDIS_URL',
  'EMAIL_PROVIDER',
  'SMS_PROVIDER',
] as const;

const SECRET_KEYS = [
  'JWT_SECRET',
  'MASTER_MFA_KEY',
  'AUDIT_CHAIN_SECRET',
] as const;

export function validateRuntimeEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') {
    validateRedisUrlIfPresent(env);
    return;
  }

  const errors: string[] = [];
  for (const key of PRODUCTION_REQUIRED) {
    if (!env[key]?.trim()) {
      errors.push(`${key} is required`);
    }
  }

  for (const key of SECRET_KEYS) {
    const value = env[key]?.trim();
    if (value && value.length < 32) {
      errors.push(`${key} must contain at least 32 characters`);
    }
  }

  if (
    env.JWT_SECRET &&
    env.AUDIT_CHAIN_SECRET &&
    env.JWT_SECRET === env.AUDIT_CHAIN_SECRET
  ) {
    errors.push('AUDIT_CHAIN_SECRET must be different from JWT_SECRET');
  }

  if (
    env.JWT_SECRET &&
    env.MASTER_MFA_KEY &&
    env.JWT_SECRET === env.MASTER_MFA_KEY
  ) {
    errors.push('MASTER_MFA_KEY must be different from JWT_SECRET');
  }

  if (env.DISABLE_AUTH_VERIFICATION === 'true') {
    errors.push('DISABLE_AUTH_VERIFICATION cannot be enabled in production');
  }

  if (env.DISABLE_MFA === 'true') {
    errors.push('DISABLE_MFA cannot be enabled in production');
  }

  validateNotificationProviders(env, errors);

  const origins = (env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.includes('*')) {
    errors.push('CORS_ALLOWED_ORIGINS cannot contain a wildcard');
  }
  for (const origin of origins) {
    try {
      const parsed = new URL(origin);
      if (parsed.origin !== origin.replace(/\/$/, '')) {
        errors.push(`CORS origin must not include a path: ${origin}`);
      }
    } catch {
      errors.push(`Invalid CORS origin: ${origin}`);
    }
  }

  try {
    validateRedisUrlIfPresent(env);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid REDIS_URL');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production configuration: ${errors.join('; ')}`);
  }
}

function validateNotificationProviders(
  env: NodeJS.ProcessEnv,
  errors: string[],
): void {
  const emailProvider = env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (emailProvider === 'mock') {
    errors.push('EMAIL_PROVIDER=mock is forbidden in production');
  } else if (emailProvider === 'ses') {
    requireProviderKeys(
      env,
      [
        'AWS_REGION',
        'SES_SENDER_EMAIL',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ],
      errors,
    );
  } else if (emailProvider === 'mailrelay') {
    requireProviderKeys(
      env,
      [
        'MAILRELAY_SMTP_HOST',
        'MAILRELAY_SMTP_USER',
        'MAILRELAY_SMTP_PASS',
        'MAILRELAY_SENDER_EMAIL',
        'MAILRELAY_SENDER_NAME',
      ],
      errors,
    );
  } else if (emailProvider) {
    errors.push('EMAIL_PROVIDER must be ses or mailrelay in production');
  }

  const smsProvider = env.SMS_PROVIDER?.trim().toLowerCase();
  if (smsProvider === 'mock') {
    errors.push('SMS_PROVIDER=mock is forbidden in production');
  } else if (smsProvider === 'semaphore') {
    requireProviderKeys(env, ['SEMAPHORE_API_KEY'], errors);
    const endpoint = env.SEMAPHORE_API_URL?.trim();
    if (endpoint) {
      try {
        if (new URL(endpoint).protocol !== 'https:') {
          errors.push('SEMAPHORE_API_URL must use HTTPS');
        }
      } catch {
        errors.push('SEMAPHORE_API_URL is invalid');
      }
    }
  } else if (smsProvider) {
    errors.push('SMS_PROVIDER must be semaphore in production');
  }
}

function requireProviderKeys(
  env: NodeJS.ProcessEnv,
  keys: readonly string[],
  errors: string[],
): void {
  for (const key of keys) {
    if (!env[key]?.trim()) {
      errors.push(`${key} is required for the selected notification provider`);
    }
  }
}

function validateRedisUrlIfPresent(env: NodeJS.ProcessEnv): void {
  if (!env.REDIS_URL?.trim()) {
    return;
  }
  const redisUrl = new URL(env.REDIS_URL);
  if (redisUrl.protocol !== 'redis:' && redisUrl.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://');
  }
}
