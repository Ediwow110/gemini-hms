import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { WinstonLoggerService } from './common/logger/winston-logger.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// Sentry error monitoring (backend)
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  const mfaDisabled = process.env.DISABLE_AUTH_VERIFICATION === 'true';
  if (mfaDisabled && isProd) {
    logger.error(
      'CRITICAL SECURITY HAZARD: DISABLE_AUTH_VERIFICATION bypass is not allowed in production. Failing closed.',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const winstonLogger = app.get(WinstonLoggerService);
  app.useLogger(winstonLogger);

  // ---- Sentry initialization ----
  // The DSN is expected in the environment (e.g., .env or start-backend.ps1).
  // If missing, Sentry will be a no‑op, which is safe for local development.
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Basic HTTP request tracing can be added via the @sentry/tracing package later.
    // For now we enable only error capturing; performance tracing is optional.
    environment: process.env.NODE_ENV ?? 'development',
  });
  // End Sentry init

  // ---------- Datadog APM initialization (optional) ----------
  // The dd-trace library automatically patches many Node modules. If the
  // environment variables DD_AGENT_HOST and DD_TRACE_AGENT_PORT are set, spans
  // will be sent to the Datadog agent. In local development those vars are
  // typically absent, making the tracer a harmless no‑op.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracer = require('dd-trace').init({
      // Enable debug output only when explicitly requested
      debug: process.env.DD_DEBUG === 'true',
    });
    console.log('Datadog tracer initialized');
    // Reference to avoid lint unused warning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = tracer;
  } catch (err) {
    console.warn('Datadog tracer failed to initialise:', err);
  }
  // --------------------------------------------------------

  // ---------- Swagger / OpenAPI ----------
  const config = new DocumentBuilder()
    .setTitle('Hospital Management System API')
    .setDescription(
      'Enterprise-grade HMS backend — modular, multi-tenant, HIPAA-aware',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'HMS API Docs',
  });
  winstonLogger.log('Swagger docs available at /api/docs', 'Bootstrap');

  // ---------- Middleware ----------
  app.use((req: any, res: any, next: () => void) => {
    const { method, url } = req;
    const start = Date.now();
    res.on('finish', () => {
      const delay = Date.now() - start;
      winstonLogger.log(
        `${method} ${url} ${res.statusCode} - ${delay}ms`,
        'HTTP',
      );
    });
    next();
  });

  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=15552000; includeSubDomains',
    );
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline' http://localhost:5173; connect-src 'self' http://localhost:5173 ws://localhost:5173; img-src 'self' data: http://localhost:5173; font-src 'self' data: http://localhost:5173;"
      : "default-src 'self'";
    res.setHeader('Content-Security-Policy', csp);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

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
        if (!origin) return callback(null, true);
        const isConfiguredOrigin = configuredDevOrigins.includes(origin);
        const isLocalDevOrigin =
          /^http:\/\/localhost:\d+$/.test(origin) ||
          /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
        return callback(null, isConfiguredOrigin || isLocalDevOrigin);
      },
      credentials: true,
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  winstonLogger.log(
    `Hospital Management System Backend running on port ${port}`,
    'Bootstrap',
  );
}

void bootstrap();
