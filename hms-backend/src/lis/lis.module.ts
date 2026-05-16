import { Module } from '@nestjs/common';
import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ResultController],
  providers: [ResultService, AuditService],
  exports: [ResultService],
})
export class LisModule {}
