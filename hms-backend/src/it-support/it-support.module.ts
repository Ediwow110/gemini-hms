import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ItSupportController } from './it-support.controller';
import { ItSupportService } from './it-support.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ItSupportController],
  providers: [ItSupportService],
  exports: [ItSupportService],
})
export class ItSupportModule {}
