import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Session } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createSession(
    userId: string,
    tenantId: string,
    initialRtHash: string,
    expiresAt: Date,
    userAgent?: string,
    ip?: string,
  ): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId,
        tenantId,
        refreshTokenHash: initialRtHash,
        isMfaVerified: false, // Default to false until step-up verification
        expiresAt,
        userAgent,
        ipAddress: ip,
      },
    });
  }

  async markMfaVerified(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isMfaVerified: true },
    });
  }

  async rotateRefreshToken(
    sessionId: string,
    oldRtPlain: string,
    newRtHash: string,
  ): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired or not found');
    }

    const isValid = await bcrypt.compare(oldRtPlain, session.refreshTokenHash);
    
    if (!isValid) {
      // 1. Check 30s leeway to handle race conditions (multi-tab refresh)
      const isLeewayValid = Date.now() - session.lastRotatedAt.getTime() < 30000;
      if (isLeewayValid) {
        return session; // Replay within leeway: return existing state
      }

      // 2. REAL BREACH: RT reused after 30s
      await this.revokeAllForUser(session.userId);
      await this.audit.log({
        tenantId: session.tenantId,
        userId: session.userId,
        eventKey: 'SECURITY_BREACH',
        recordType: 'Session',
        recordId: sessionId,
        newValues: { reason: 'REFRESH_TOKEN_REUSE_DETECTED' },
      });
      throw new UnauthorizedException('Session compromised and revoked');
    }

    // 3. SUCCESSFUL ROTATION
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newRtHash,
        lastRotatedAt: new Date(),
      },
    });
  }

  async findById(sessionId: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async setInitialRefreshToken(sessionId: string, rtHash: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: rtHash,
        lastRotatedAt: new Date(),
      },
    });
  }
}

