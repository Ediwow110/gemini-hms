import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
