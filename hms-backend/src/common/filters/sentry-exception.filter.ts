import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Inject,
  Injectable,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { GlobalExceptionFilter } from './global-exception.filter';

/**
 * Global exception filter that forwards any unhandled exception to Sentry.
 * After capturing, it delegates to the GlobalExceptionFilter to format the HTTP response.
 */
@Catch()
@Injectable()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(GlobalExceptionFilter)
    private readonly globalFilter: GlobalExceptionFilter,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // Capture the error – Sentry will automatically attach request breadcrumbs
    // if the SDK is initialised with the Http integration (done in main.ts).
    Sentry.captureException(exception);
    // Delegate formatting to GlobalExceptionFilter
    this.globalFilter.catch(exception, host);
  }
}
