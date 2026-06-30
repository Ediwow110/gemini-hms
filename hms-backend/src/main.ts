import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { WinstonLoggerService } from "./common/logger/winston-logger.service";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const isProd = process.env.NODE_ENV === "production";

  const mfaDisabled = process.env.DISABLE_AUTH_VERIFICATION === "true";
  if (mfaDisabled && isProd) {
    logger.error("CRITICAL SECURITY HAZARD: DISABLE_AUTH_VERIFICATION bypass is not allowed in production. Failing closed.");
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const winstonLogger = app.get(WinstonLoggerService);
  app.useLogger(winstonLogger);

  app.use((req: any, res: any, next: () => void) => {
    const { method, url } = req;
    const start = Date.now();
    res.on("finish", () => {
      const delay = Date.now() - start;
      winstonLogger.log(`${method} ${url} ${res.statusCode} - ${delay}ms`, "HTTP");
    });
    next();
  });

  app.use((req: any, res: any, next: () => void) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    const isDev = process.env.NODE_ENV !== "production";
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline' http://localhost:5173; connect-src 'self' http://localhost:5173 ws://localhost:5173; img-src 'self' data: http://localhost:5173; font-src 'self' data: http://localhost:5173;"
      : "default-src 'self'";
    res.setHeader("Content-Security-Policy", csp);
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
      logger.error("CORS_ALLOWED_ORIGINS is not set in production. Failing closed.");
      process.exit(1);
    }
    app.enableCors({ origin: allowedOrigins.split(",").map((o) => o.trim()), credentials: true });
  } else {
    const configuredDevOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
      .split(",").map((o) => o.trim()).filter(Boolean);
    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        const isConfiguredOrigin = configuredDevOrigins.includes(origin);
        const isLocalDevOrigin = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
        return callback(null, isConfiguredOrigin || isLocalDevOrigin);
      },
      credentials: true,
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, "0.0.0.0");
  winstonLogger.log(`Hospital Management System Backend running on port ${port}`, "Bootstrap");
}

void bootstrap();
