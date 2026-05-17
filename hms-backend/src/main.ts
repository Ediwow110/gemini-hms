import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
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

  // Enable global validation (Section 12.1 Requirement)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for the frontend
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Hospital Management System Backend running on port ${port}`);
}
void bootstrap();
