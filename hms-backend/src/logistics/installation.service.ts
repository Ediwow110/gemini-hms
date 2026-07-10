import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InstallStatus, AssetInstallStatus } from '@prisma/client';
import { UpdateInstallationJobStatusDto } from './dto/logistics.dto';

@Injectable()
export class InstallationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private installationScope(tenantId: string, branchId: string) {
    return {
      tenantId,
      asset: {
        salesOrder: {
          quote: {
            rfq: { branchId },
          },
        },
      },
    };
  }

  private installationInclude = {
    asset: {
      include: {
        salesOrder: {
          include: {
            quote: {
              include: {
                rfq: { include: { branch: true } },
              },
            },
          },
        },
      },
    },
    assignedUser: { select: { id: true, email: true } },
  } as const;

  async findAll(tenantId: string, branchId: string) {
    return this.prisma.installationJob.findMany({
      where: this.installationScope(tenantId, branchId),
      include: this.installationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, branchId: string, id: string) {
    return this.prisma.installationJob.findFirst({
      where: { id, ...this.installationScope(tenantId, branchId) },
      include: this.installationInclude,
    });
  }

  async updateStatus(
    tenantId: string,
    branchId: string,
    userId: string,
    id: string,
    dto: UpdateInstallationJobStatusDto,
  ) {
    const job = await this.findOne(tenantId, branchId, id);
    if (!job) throw new NotFoundException('Installation job not found');

    let assetStatus: AssetInstallStatus = job.asset.installationStatus;
    let commissionedAt = job.commissionedAt ?? undefined;
    let handoverSignedAt = job.handoverSignedAt ?? undefined;
    let warrantyStart = job.asset.warrantyStart ?? undefined;
    let warrantyEnd = job.asset.warrantyEnd ?? undefined;

    if (dto.status === InstallStatus.IN_PROGRESS) {
      assetStatus = AssetInstallStatus.ASSEMBLING;
    } else if (dto.status === InstallStatus.COMMISSIONED) {
      assetStatus = AssetInstallStatus.COMMISSIONED;
      commissionedAt = new Date();
    } else if (dto.status === InstallStatus.COMPLETED) {
      assetStatus = AssetInstallStatus.HANDED_OVER;
      handoverSignedAt = new Date();
      commissionedAt ??= handoverSignedAt;
      warrantyStart = handoverSignedAt;
      warrantyEnd = new Date(
        handoverSignedAt.getTime() + 365 * 24 * 60 * 60 * 1000,
      );
    }

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.installationJob.update({
        where: { id, tenantId },
        data: {
          status: dto.status,
          commissionedAt,
          handoverSignedAt,
          notes: dto.note ?? job.notes,
        },
      });

      await tx.asset.update({
        where: { id: job.assetId, tenantId },
        data: {
          installationStatus: assetStatus,
          warrantyStart,
          warrantyEnd,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'INSTALLATION_STATUS_UPDATED',
          recordType: 'InstallationJob',
          recordId: id,
          newValues: { status: dto.status, note: dto.note, assetStatus },
        },
        tx,
        branchId,
      );

      return updated;
    });

    return {
      ...updatedJob,
      assetInstallStatus: assetStatus,
      commissionedAt,
      handoverSignedAt,
      warrantyStart,
      warrantyEnd,
    };
  }
}
