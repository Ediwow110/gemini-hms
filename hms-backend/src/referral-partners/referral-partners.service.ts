import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';
import {
  CreateReferrerDto,
  CreateReferralRecordDto,
} from './dto/referral-partner.dto';

@Injectable()
export class ReferralPartnersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createReferrer(tenantId: string, userId: string, dto: CreateReferrerDto) {
    const referrer = await this.prisma.referrer.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type || 'DOCTOR',
        contactInfo: dto.contactInfo || null,
        rebateRate: new Prisma.Decimal(dto.rebateRate),
        status: 'ACTIVE',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'REFERRER_CREATED',
      recordType: 'Referrer',
      recordId: referrer.id,
      newValues: referrer,
    });

    return referrer;
  }

  async getReferrerById(tenantId: string, id: string) {
    const referrer = await this.prisma.referrer.findFirst({
      where: { id, tenantId },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found');
    }

    return referrer;
  }

  async createReferralRecord(
    tenantId: string,
    userId: string,
    dto: CreateReferralRecordDto,
  ) {
    const referrer = await this.prisma.referrer.findFirst({
      where: { id: dto.referrerId, tenantId },
    });

    if (!referrer) {
      throw new NotFoundException('Referrer not found');
    }

    const record = await this.prisma.referralRecord.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        orderId: dto.orderId,
        referrerId: dto.referrerId,
        rebateAmount: new Prisma.Decimal(dto.rebateAmount),
        status: 'PENDING',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'REFERRAL_RECORD_CREATED',
      recordType: 'ReferralRecord',
      recordId: record.id,
      newValues: record,
    });

    return record;
  }

  async getReferralRecords(
    tenantId: string,
    referrerId?: string,
    status?: string,
  ) {
    const where: any = { tenantId };

    if (referrerId) {
      where.referrerId = referrerId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.referralRecord.findMany({
      where,
      include: { referrer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReferralRecordStatus(
    tenantId: string,
    userId: string,
    id: string,
    status: string,
  ) {
    const record = await this.prisma.referralRecord.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Referral record not found');
    }

    const updated = await this.prisma.referralRecord.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'REFERRAL_RECORD_STATUS_UPDATED',
      recordType: 'ReferralRecord',
      recordId: id,
      oldValues: { status: record.status },
      newValues: { status },
    });

    return updated;
  }
}
