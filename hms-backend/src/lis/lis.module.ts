import { Module } from '@nestjs/common';
import { LisService } from './lis.service';
import { LisController } from './lis.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [LisController],
  providers: [LisService, AuditService],
  exports: [LisService],
})
export class LisModule {}
