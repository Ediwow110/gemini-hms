import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RadiologyController } from './radiology.controller';
import { RadiologyService } from './radiology.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RadiologyController],
  providers: [RadiologyService],
  exports: [RadiologyService],
})
export class RadiologyModule {}
