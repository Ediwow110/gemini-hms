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

    // Try cookie first (browser auth), fallback to Bearer header (programmatic clients)
    let token: string | undefined = request.cookies?.patient_token;

    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('Missing or invalid authentication');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

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

      // Validate token version (revocation check)
      if (payload.tokenVersion !== patientUser.tokenVersion) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Attach patientContext to request. Use patientUser.id as the auditable identity
      // for audit logging, removing the false requirement to map to a staff User.
      request.patientUser = {
        patientUserId: patientUser.id,
        patientId: patientUser.patientId,
        tenantId: patientUser.tenantId,
        email: patientUser.email,
        userId: patientUser.id,
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired patient portal token',
      );
    }
  }
}
