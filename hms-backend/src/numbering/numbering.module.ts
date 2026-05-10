import { Module, Global } from '@nestjs/common';
import { NumberingService } from './numbering.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [NumberingService],
  exports: [NumberingService],
})
export class NumberingModule {}
