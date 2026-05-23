import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InstallStatus, AssetInstallStatus } from '@prisma/client';

@Injectable()
export class InstallationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.installationJob.findMany({
      where: { asset: { tenantId } },
      include: { asset: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.installationJob.findFirst({
      where: { id, asset: { tenantId } },
      include: { asset: true },
    });
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    id: string,
    status: InstallStatus,
    note?: string,
  ) {
    const job = await this.findOne(tenantId, id);
    if (!job) {
      throw new NotFoundException('Installation job not found');
    }

    let assetStatus: AssetInstallStatus = job.asset.installationStatus;
    let handoverSignedAt: Date | undefined;
    let warrantyStart: Date | undefined;
    let warrantyEnd: Date | undefined;

    if (status === InstallStatus.IN_PROGRESS) {
      assetStatus = AssetInstallStatus.ASSEMBLING;
    } else if (status === InstallStatus.COMPLETED) {
      assetStatus = AssetInstallStatus.HANDED_OVER;
      handoverSignedAt = new Date();
      warrantyStart = handoverSignedAt;
      warrantyEnd = new Date(
        handoverSignedAt.getTime() + 365 * 24 * 60 * 60 * 1000,
      );
    }

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.installationJob.update({
        where: { id },
        data: {
          status,
          handoverSignedAt,
        },
      });

      await tx.asset.update({
        where: { id: job.assetId },
        data: {
          installationStatus: assetStatus,
          warrantyStart,
          warrantyEnd,
        },
      });

      return updated;
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'INSTALLATION_STATUS_UPDATED',
      recordType: 'InstallationJob',
      recordId: id,
      newValues: { status, note, assetStatus },
    });

    // Match the response expected by the test
    return {
      ...updatedJob,
      assetInstallStatus: assetStatus,
      handoverSignedAt,
      warrantyStart,
      warrantyEnd,
    };
  }
}
