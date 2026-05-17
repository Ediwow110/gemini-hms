import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PatientPortalService } from './patient-portal.service';
import { PatientPortalController } from './patient-portal.controller';
import { PatientJwtGuard } from './guards/patient-jwt.guard';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error(
            'CRITICAL: Valid JWT_SECRET (min 32 chars) is required in environment variables.',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '12h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [PatientPortalController],
  providers: [PatientPortalService, PatientJwtGuard],
  exports: [PatientPortalService],
})
export class PatientPortalModule {}
