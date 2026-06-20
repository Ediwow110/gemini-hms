import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StorageService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Generate a time-limited signed URL for file access.
   *
   * This is an honest, gated stub. The full provider-backed object-storage
   * integration (S3 / GCS / Azure Blob) is not yet implemented in this release.
   * Callers receive a 501-equivalent error so the production API never returns
   * a fake signed URL that points to a non-existent host.
   */
  async generateSignedUrl(
    fileKey: string,
    userId: string,
    tenantId: string,
    _expiresInSeconds: number = 3600,
  ): Promise<string> {
    void fileKey;
    void userId;
    void tenantId;
    throw new NotImplementedException(
      'Object storage signed URLs are not yet implemented in this release. ' +
        'Wire a real S3/GCS/Azure provider before relying on this endpoint.',
    );
  }

  /**
   * Log a file download event for audit purposes.
   */
  async logDownload(
    fileKey: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'FILE_DOWNLOADED',
          recordType: 'File',
          recordId: fileKey,
          newValues: { fileKey },
        },
        tx,
      );
    });
  }
}
