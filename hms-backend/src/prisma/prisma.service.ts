import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl && process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL: DATABASE_URL environment variable is not defined in production.',
      );
    }
    const pool = new Pool({
      connectionString:
        databaseUrl || 'postgresql://postgres:postgres@localhost:5432/hms_db',
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
