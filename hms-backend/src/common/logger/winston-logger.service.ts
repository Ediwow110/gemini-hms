import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { RequestContextService } from './request-context.service';

const { combine, timestamp, printf, json, colorize } = winston.format;

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly context: RequestContextService) {
    const isProd = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
      format: isProd
        ? combine(timestamp(), json())
        : combine(
            colorize(),
            timestamp({ format: 'HH:mm:ss.SSS' }),
            printf(
              ({
                level,
                message,
                timestamp,
                context: ctx,
                requestId,
                ...meta
              }) => {
                const rid = String(
                  (requestId || this.context.getRequestId() || '-') as any,
                );
                const ctxStr = ctx ? `[${String(ctx as any)}]` : '';
                const metaStr = Object.keys(meta).length
                  ? ` ${JSON.stringify(meta)}`
                  : '';
                return `${String(timestamp)} ${rid} ${String(level)} ${ctxStr} ${String(message)}${metaStr}`;
              },
            ),
          ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: any, context?: string): void {
    this.logger.info(message, this.buildMeta(context));
  }

  error(message: any, trace?: string, context?: string): void {
    const meta = this.buildMeta(context);
    if (trace) meta.trace = trace;
    this.logger.error(message, meta);
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, this.buildMeta(context));
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, this.buildMeta(context));
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, this.buildMeta(context));
  }

  private buildMeta(context?: string): Record<string, unknown> {
    const ctx = this.context.getStore();
    return {
      context,
      requestId: ctx?.requestId,
      userId: ctx?.userId,
      tenantId: ctx?.tenantId,
      path: ctx?.path,
      method: ctx?.method,
    };
  }
}
