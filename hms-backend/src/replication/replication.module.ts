import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ConflictResolverService } from './conflict-resolver.service';
import { RegionHealthService } from './region-health.service';
import { RegionConfig } from '../config/region.config';
import { ReplicationController } from './replication.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReplicationController],
  providers: [ConflictResolverService, RegionHealthService, RegionConfig],
  exports: [ConflictResolverService, RegionHealthService, RegionConfig],
})
export class ReplicationModule {}
