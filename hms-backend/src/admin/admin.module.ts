import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MetricsController } from './metrics.controller';
import { AdminService } from './admin.service';
import { MetricsService } from './metrics.service';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [AdminController, MetricsController],
  providers: [AdminService, MetricsService],
  exports: [AdminService, MetricsService],
})
export class AdminModule {}
