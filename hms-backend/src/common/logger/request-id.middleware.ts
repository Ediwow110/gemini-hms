import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { RequestContextService } from "./request-context.service";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
    res.setHeader("x-request-id", requestId);

    this.context.run(
      {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        ip: req.ip || req.socket?.remoteAddress || "unknown",
      },
      () => {
        next();
      },
    );
  }
}
