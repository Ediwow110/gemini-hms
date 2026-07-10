import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NumberingModule } from '../numbering/numbering.module';

@Module({
  imports: [PrismaModule, NumberingModule],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
