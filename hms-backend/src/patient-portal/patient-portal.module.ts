import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PatientPortalService } from './patient-portal.service';
import { PatientPortalController } from './patient-portal.controller';
import { PatientJwtGuard } from './guards/patient-jwt.guard';
import { PatientCsrfGuard } from './guards/patient-csrf.guard';
import { AuditModule } from '../audit/audit.module';
import { DocumentGeneratorService } from './services/document-generator.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AuditModule,
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
  providers: [PatientPortalService, PatientJwtGuard, PatientCsrfGuard, DocumentGeneratorService],
  exports: [PatientPortalService],
})
export class PatientPortalModule {}
