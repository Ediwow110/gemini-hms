import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  // In production, dangerous auth bypasses must be disabled
  const mfaDisabled = process.env.DISABLE_AUTH_VERIFICATION === 'true';
  if (mfaDisabled && isProd) {
    logger.error(
      'CRITICAL SECURITY HAZARD: DISABLE_AUTH_VERIFICATION bypass is not allowed in production. Failing closed.',
    );
    process.exit(1);
  }
  const app = await NestFactory.create(AppModule, {
    logger: isProd
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global Request Logger Middleware
  app.use((req: any, res: any, next: () => void) => {
    const { method, url } = req;
    const start = Date.now();
    res.on('finish', () => {
      const delay = Date.now() - start;
      Logger.log(`${method} ${url} ${res.statusCode} - ${delay}ms`, 'HTTP');
    });
    next();
  });

  // Global Security Headers Middleware
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=15552000; includeSubDomains',
    );
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cookie parser for httpOnly cookie auth
  app.use(cookieParser());

  // Enable CORS for the frontend
  if (isProd) {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
    if (!allowedOrigins) {
      logger.error(
        'CORS_ALLOWED_ORIGINS is not set in production. Failing closed.',
      );
      process.exit(1);
    }
    app.enableCors({
      origin: allowedOrigins.split(',').map((o) => o.trim()),
      credentials: true,
    });
  } else {
    const configuredDevOrigins = (
      process.env.CORS_ALLOWED_ORIGINS ||
      'http://localhost:5173,http://127.0.0.1:5173'
    )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) {
          // Allow non-browser tools (curl/postman) in local development
          return callback(null, true);
        }

        const isConfiguredOrigin = configuredDevOrigins.includes(origin);
        const isLocalDevOrigin =
          /^http:\/\/localhost:\d+$/.test(origin) ||
          /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

        if (isConfiguredOrigin || isLocalDevOrigin) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Hospital Management System Backend running on port ${port}`);
}
void bootstrap();
