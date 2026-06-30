import { Global, Module } from "@nestjs/common";
import { RequestContextService } from "./request-context.service";
import { RequestIdMiddleware } from "./request-id.middleware";
import { WinstonLoggerService } from "./winston-logger.service";

@Global()
@Module({
  providers: [RequestContextService, RequestIdMiddleware, WinstonLoggerService],
  exports: [RequestContextService, RequestIdMiddleware, WinstonLoggerService],
})
export class LoggerModule {}
