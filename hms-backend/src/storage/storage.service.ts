import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Generate a time-limited signed URL for file access.
   * Stub implementation: returns a mock URL with expiry token.
   */
  async generateSignedUrl(
    fileKey: string,
    userId: string,
    tenantId: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHash('sha256')
      .update(`${fileKey}:${userId}:${expiry}:${jwtSecret}`)
      .digest('hex')
      .substring(0, 16);

    return `https://storage.hms.local/files/${fileKey}?sig=${signature}&exp=${expiry}`;
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
