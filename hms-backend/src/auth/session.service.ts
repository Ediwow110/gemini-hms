import { Injectable } from '@nestjs/common';
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
  ): Promise<{ rotated: boolean; reason: string; session: Session | null }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      return { rotated: false, reason: 'expired_or_not_found', session: null };
    }

    const isValid = await bcrypt.compare(oldRtPlain, session.refreshTokenHash);

    if (!isValid) {
      // 1. Check 30s leeway to handle race conditions (multi-tab refresh)
      const isLeewayValid =
        Date.now() - session.lastRotatedAt.getTime() < 30000;
      if (isLeewayValid) {
        return { rotated: false, reason: 'replay_within_leeway', session };
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
      return { rotated: false, reason: 'revoked', session: null };
    }

    // 3. Rotate only if the row still contains the hash and timestamp we read.
    // This compare-and-swap prevents two concurrent refresh requests from both
    // accepting the same refresh token.
    const rotationTime = new Date();
    const rotation = await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        refreshTokenHash: session.refreshTokenHash,
        lastRotatedAt: session.lastRotatedAt,
      },
      data: {
        refreshTokenHash: newRtHash,
        lastRotatedAt: rotationTime,
      },
    });

    if (rotation.count !== 1) {
      const currentSession = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!currentSession) {
        return {
          rotated: false,
          reason: 'expired_or_not_found',
          session: null,
        };
      }

      if (Date.now() - currentSession.lastRotatedAt.getTime() < 30000) {
        return {
          rotated: false,
          reason: 'replay_within_leeway',
          session: currentSession,
        };
      }

      await this.revokeAllForUser(currentSession.userId);
      await this.audit.log({
        tenantId: currentSession.tenantId,
        userId: currentSession.userId,
        eventKey: 'SECURITY_BREACH',
        recordType: 'Session',
        recordId: sessionId,
        newValues: { reason: 'REFRESH_TOKEN_REUSE_DETECTED' },
      });
      return { rotated: false, reason: 'revoked', session: null };
    }

    const updatedSession = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    return updatedSession
      ? { rotated: true, reason: 'rotated', session: updatedSession }
      : { rotated: false, reason: 'expired_or_not_found', session: null };
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

  async setInitialRefreshToken(
    sessionId: string,
    rtHash: string,
  ): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: rtHash,
        lastRotatedAt: new Date(),
      },
    });
  }
}
