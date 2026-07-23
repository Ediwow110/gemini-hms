import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../decorators/public.decorator';
import { REDIS_CLIENT } from '../redis/redis.provider';

class HealthResponse {
  status: 'UP' | 'DEGRADED';
}

interface RedisHealthClient {
  ping(): Promise<string>;
}

@ApiTags('System')
@Controller('api/v1')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisHealthClient,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Public readiness check' })
  @ApiOkResponse({
    description: 'Minimal readiness response',
    type: HealthResponse,
  })
  async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthResponse> {
    try {
      const [, redisResponse] = await Promise.all([
        this.prisma.$queryRaw`SELECT 1`,
        this.redis.ping(),
      ]);
      if (redisResponse !== 'PONG') {
        throw new Error(
          'Redis readiness check returned an unexpected response.',
        );
      }
      return { status: 'UP' };
    } catch {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'DEGRADED' };
    }
  }
}
