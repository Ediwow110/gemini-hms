import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MfaService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private audit: AuditService,
  ) {
    let key = this.configService.get<string>('MASTER_MFA_KEY');
    if (!key || key.length < 32) {
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.JEST_WORKER_ID !== undefined
      ) {
        key = 'fallback-master-mfa-key-for-tests-32-chars-long';
      } else {
        throw new Error(
          'CRITICAL: MASTER_MFA_KEY must be at least 32 characters.',
        );
      }
    }
    this.masterKey = crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Generates a new TOTP secret for a user.
   */
  async generateSecret(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `Gemini-HMS (${email})`,
      issuer: 'Gemini-HMS',
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  /**
   * Encrypts a plaintext secret for storage.
   */
  encryptSecret(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  }

  /**
   * Decrypts a secret from storage.
   */
  decryptSecret(encryptedData: string): string {
    const [ivHex, encryptedHex, tagHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.masterKey,
      iv,
    );
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  /**
   * Verifies a TOTP code against a user's stored secret.
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user || !user.mfaSecret) {
      return false;
    }

    try {
      const secret = this.decryptSecret(user.mfaSecret);
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 1, // Allow 1-step window
      });
    } catch {
      return false;
    }
  }

  /**
   * Finalizes MFA setup for a user.
   */
  async enableMfa(userId: string, secret: string, code: string) {
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code during setup');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: this.encryptSecret(secret),
        mfaEnabled: true,
      },
    });
  }

  /**
   * Generates a set of 8 new recovery codes for a user.
   * invalidates old unused codes.
   * returns plaintext codes only once.
   */
  async generateRecoveryCodes(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    // 1. Invalidate old codes
    await this.prisma.userMfaRecoveryCode.deleteMany({
      where: { userId },
    });

    // 2. Generate 8 plaintext recovery codes (format: 8 characters)
    const plainCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      plainCodes.push(crypto.randomBytes(4).toString('hex'));
    }

    // 3. Hash them and save to DB
    const hashedData = await Promise.all(
      plainCodes.map(async (code) => {
        const codeHash = await bcrypt.hash(code, 10);
        return {
          userId,
          codeHash,
        };
      }),
    );

    await this.prisma.userMfaRecoveryCode.createMany({
      data: hashedData,
    });

    // 4. Audit event
    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'MFA_RECOVERY_CODES_GENERATED',
      recordType: 'User',
      recordId: userId,
      newValues: { message: 'Generated 8 one-time MFA recovery codes.' },
    });

    return plainCodes;
  }

  /**
   * Verifies a recovery code. Returns true if match found, not expired, and marked used.
   */
  async verifyRecoveryCode(
    userId: string,
    code: string,
    tenantId: string,
  ): Promise<boolean> {
    const records = await this.prisma.userMfaRecoveryCode.findMany({
      where: { userId, usedAt: null },
    });

    let matchedRecord = null;
    for (const record of records) {
      if (await bcrypt.compare(code, record.codeHash)) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'MFA_RECOVERY_CODE_REJECTED',
        recordType: 'User',
        recordId: userId,
        newValues: { reason: 'INVALID_CODE' },
      });
      return false;
    }

    const isExpired =
      Date.now() - matchedRecord.createdAt.getTime() > 30 * 24 * 60 * 60 * 1000;
    if (isExpired) {
      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'MFA_RECOVERY_CODE_REJECTED',
        recordType: 'User',
        recordId: userId,
        newValues: { reason: 'EXPIRED' },
      });
      return false;
    }

    await this.prisma.userMfaRecoveryCode.update({
      where: { id: matchedRecord.id },
      data: { usedAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'MFA_RECOVERY_CODE_USED',
      recordType: 'User',
      recordId: userId,
      newValues: { codeId: matchedRecord.id },
    });

    return true;
  }
}
