import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MetricsService } from '../../admin/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    this.metricsService.incrementRequestCount(method, url);

    if (url.includes('/auth/login') && method === 'POST') {
      // Track login attempts specifically
      this.metricsService.incrementLoginCount();
    }

    return next.handle().pipe(
      catchError((error) => {
        this.metricsService.incrementErrorCount();
        if (url.includes('/auth/mfa/verify')) {
          this.metricsService.incrementMfaFailure();
        }
        return throwError(() => error);
      }),
    );
  }
}
