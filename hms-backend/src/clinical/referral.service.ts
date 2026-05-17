import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReferralDto, UpdateReferralStatusDto } from './dto/clinical.dto';
import { EncounterStatus, ReferralStatus } from '@prisma/client';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createReferral(
    tenantId: string,
    userId: string,
    branchId: string,
    encounterId: string,
    dto: CreateReferralDto,
  ) {
    try {
      const encounter = await this.prisma.encounter.findFirst({
        where: { id: encounterId, tenantId },
      });

      if (!encounter) {
        throw new NotFoundException('Encounter not found');
      }

      if (encounter.status !== EncounterStatus.OPEN) {
        throw new ConflictException(
          'clinical_encounter_not_open: Cannot create referrals on a closed or cancelled encounter',
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        const referral = await tx.referral.create({
          data: {
            tenantId,
            branchId,
            encounterId,
            referredById: userId,
            patientId: encounter.patientId,
            referredToName: dto.referredToName,
            specialty: dto.specialty,
            reason: dto.reason,
            urgency: dto.urgency || 'ROUTINE',
            status: ReferralStatus.PENDING,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_REFERRAL_CREATED',
            recordType: 'Referral',
            recordId: referral.id,
            newValues: {
              encounterId,
              patientId: encounter.patientId,
              referredToName: dto.referredToName,
            },
          },
          tx,
          branchId,
        );

        return referral;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error in createReferral: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReferral(tenantId: string, id: string) {
    const referral = await this.prisma.referral.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
          },
        },
        referredBy: {
          select: {
            id: true,
            email: true,
          },
        },
        encounter: true,
      },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    return referral;
  }

  async updateReferralStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateReferralStatusDto,
  ) {
    try {
      const referral = await this.prisma.referral.findFirst({
        where: { id, tenantId },
      });

      if (!referral) {
        throw new NotFoundException('Referral not found');
      }

      if (referral.status === dto.status) {
        return referral; // Idempotent success
      }

      // Enforce valid transitions:
      // PENDING -> ACCEPTED, CANCELLED
      // ACCEPTED -> COMPLETED, CANCELLED
      // COMPLETED / CANCELLED are terminal states
      if (
        referral.status === ReferralStatus.COMPLETED ||
        referral.status === ReferralStatus.CANCELLED
      ) {
        throw new ConflictException(
          `clinical_referral_terminal_status: Cannot update a referral in terminal state: ${referral.status}`,
        );
      }

      if (referral.status === ReferralStatus.ACCEPTED && dto.status === ReferralStatus.PENDING) {
        throw new ConflictException(
          'clinical_referral_invalid_transition: Cannot transition from ACCEPTED back to PENDING',
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.referral.update({
          where: { id },
          data: {
            status: dto.status,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_REFERRAL_STATUS_UPDATED',
            recordType: 'Referral',
            recordId: id,
            oldValues: { status: referral.status },
            newValues: { status: updated.status },
          },
          tx,
          referral.branchId,
        );

        return updated;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error in updateReferralStatus: ${error.message}`, error.stack);
      throw error;
    }
  }
}
