import { Module } from '@nestjs/common';
import { RadiologyController } from './radiology.controller';

@Module({
  controllers: [RadiologyController],
})
export class RadiologyModule {}