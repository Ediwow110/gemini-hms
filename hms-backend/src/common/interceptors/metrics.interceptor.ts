import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from '../../admin/metrics.service';

const SLOW_THRESHOLD_MS = 500; // Log warnings for requests taking >500ms

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    this.metricsService.incrementRequestCount(method, url);

    if (url.includes('/auth/login') && method === 'POST') {
      this.metricsService.incrementLoginCount();
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.metricsService.recordEndpointDuration(method, url, duration);

        if (duration > SLOW_THRESHOLD_MS) {
          this.logger.warn(
            `SLOW_ENDPOINT [${method} ${url}] took ${duration}ms — candidate for optimization audit`,
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.metricsService.recordEndpointDuration(method, url, duration);
        this.metricsService.incrementErrorCount();

        if (url.includes('/auth/mfa/verify')) {
          this.metricsService.incrementMfaFailure();
        }
        return throwError(() => error);
      }),
    );
  }
}
