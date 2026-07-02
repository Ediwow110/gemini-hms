import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { Public } from "../decorators/public.decorator";
import * as fs from "fs";
import * as path from "path";

class HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  database: { status: string; latencyMs: number };
}

@ApiTags("System")
@Controller()
export class HealthController {
  private readonly startTime = Date.now();
  private readonly version: string;

  constructor(private readonly prisma: PrismaService) {
    try {
      const pkgPath = path.resolve(process.cwd(), "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      this.version = pkg.version || "0.0.0";
    } catch {
      this.version = "0.0.0";
    }
  }

  @Public()
  @Get("health")
  @ApiOperation({ summary: "System health check with dependency verification" })
  @ApiOkResponse({ description: "Health status with DB connectivity", type: HealthResponse })
  async getHealth(): Promise<HealthResponse> {
    const dbStart = Date.now();
    let dbStatus = "UP";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "DOWN";
    }
    const dbLatency = Date.now() - dbStart;

    return {
      status: dbStatus === "UP" ? "UP" : "DEGRADED",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      environment: process.env.NODE_ENV || "development",
      database: { status: dbStatus, latencyMs: dbLatency },
    };
  }
}
