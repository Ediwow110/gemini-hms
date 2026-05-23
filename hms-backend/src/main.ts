import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';
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
    const devOrigin =
      process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173';
    app.enableCors({
      origin: devOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Hospital Management System Backend running on port ${port}`);
}
void bootstrap();
