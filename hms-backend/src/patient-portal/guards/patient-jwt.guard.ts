import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PatientJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload.isPatientPortal !== true) {
        throw new UnauthorizedException(
          'Token is not authorized for patient portal',
        );
      }

      // Verify the patient user still exists and is ACTIVE
      const patientUser = await this.prisma.patientUser.findFirst({
        where: { id: payload.sub, status: 'ACTIVE' },
        include: { patient: true },
      });

      if (!patientUser) {
        throw new UnauthorizedException(
          'Patient account is inactive or not found',
        );
      }

      // Attach patientContext to request
      request.patientUser = {
        patientUserId: patientUser.id,
        patientId: patientUser.patientId,
        tenantId: patientUser.tenantId,
        email: patientUser.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired patient portal token',
      );
    }
  }
}
