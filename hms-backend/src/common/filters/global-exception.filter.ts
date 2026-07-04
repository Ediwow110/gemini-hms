import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { RequestContextService } from "../logger/request-context.service";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly context: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = this.context.getRequestId();
    const isProd = process.env.NODE_ENV === "production";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "Internal Server Error";
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      error = exception.name.replace("Exception", "").replace("Http", "");

      if (typeof exResponse === "string") {
        message = exResponse;
      } else if (typeof exResponse === "object") {
        const obj = exResponse as Record<string, unknown>;
        message = (obj.message as string) || message;
        if (Array.isArray(obj.message)) {
          details = obj.message;
          message = "Validation failed";
        }
      }
    } else if ((exception as any)?.code === "P2002") {
      // Prisma unique constraint
      status = HttpStatus.CONFLICT;
      message = "Resource already exists";
      error = "Conflict";
    } else if ((exception as any)?.code === "P2025") {
      // Prisma not found
      status = HttpStatus.NOT_FOUND;
      message = "Resource not found";
      error = "Not Found";
    } else if ((exception as any)?.code && (exception as any)?.code?.startsWith("P")) {
      // Other Prisma errors
      status = HttpStatus.BAD_REQUEST;
      message = "Database operation failed";
      error = "Bad Request";
    }

    // Log the error
    const logFn = status >= 500 ? "error" : status >= 400 ? "warn" : "log";
    const logger = new Logger("ExceptionFilter");
    logger[logFn](`${request.method} ${request.url} → ${status}: ${message}`);

    response.status(status).json({
      statusCode: status,
      message,
      error,
      ...(details ? { details } : {}),
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(!isProd && exception instanceof Error ? { stack: exception.stack?.split("\n").slice(0, 3).join("\n") } : {}),
    });
  }
}
