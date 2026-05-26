import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrismaService, AuditService],
})
export class PrescriptionsModule {}
