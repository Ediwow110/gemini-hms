import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'super-secret-default-change-me-in-prod-32-chars',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
