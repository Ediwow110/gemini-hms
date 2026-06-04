import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../session.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: {
    session: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  describe('createSession', () => {
    it('should create a session with isMfaVerified: false', async () => {
      const rtHash = await bcrypt.hash('test-rt', 10);
      const expiresAt = new Date(Date.now() + 86400000);

      prisma.session.create.mockResolvedValue({
        id: 'session-uuid',
        userId: 'user-uuid',
        tenantId: 'tenant-uuid',
        refreshTokenHash: rtHash,
        isMfaVerified: false,
        expiresAt,
      });

      const result = await service.createSession(
        'user-uuid',
        'tenant-uuid',
        rtHash,
        expiresAt,
      );

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-uuid',
          tenantId: 'tenant-uuid',
          refreshTokenHash: rtHash,
          isMfaVerified: false,
          expiresAt,
        }),
      });
      expect(result.isMfaVerified).toBe(false);
    });
  });

  describe('markMfaVerified', () => {
    it('should update session isMfaVerified to true', async () => {
      await service.markMfaVerified('session-uuid');

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        data: { isMfaVerified: true },
      });
    });
  });

  describe('rotateRefreshToken', () => {
    const validRtPlain = 'valid-refresh-token';
    const newRtPlain = 'new-refresh-token';
    let validRtHash: string;
    let newRtHash: string;

    beforeEach(async () => {
      validRtHash = await bcrypt.hash(validRtPlain, 10);
      newRtHash = await bcrypt.hash(newRtPlain, 10);
    });

    it('should return expired_or_not_found when session is null', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      const result = await service.rotateRefreshToken(
        'nonexistent-session',
        validRtPlain,
        newRtHash,
      );

      expect(result.rotated).toBe(false);
      expect(result.reason).toBe('expired_or_not_found');
      expect(result.session).toBeNull();
    });

    it('should return expired_or_not_found when session has expired', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-uuid',
        expiresAt: new Date(Date.now() - 86400000),
      });

      const result = await service.rotateRefreshToken(
        'session-uuid',
        validRtPlain,
        newRtHash,
      );

      expect(result.rotated).toBe(false);
      expect(result.reason).toBe('expired_or_not_found');
      expect(result.session).toBeNull();
    });

    it('should return replay_within_leeway when RT does not match and lastRotatedAt is within 30s', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-uuid',
        expiresAt: new Date(Date.now() + 86400000),
        refreshTokenHash: await bcrypt.hash('different-token', 10),
        lastRotatedAt: new Date(Date.now() - 5000),
      });

      const result = await service.rotateRefreshToken(
        'session-uuid',
        validRtPlain,
        newRtHash,
      );

      expect(result.rotated).toBe(false);
      expect(result.reason).toBe('replay_within_leeway');
      expect(result.session).not.toBeNull();
    });

    it('should revoke all sessions and log SECURITY_BREACH when RT reuse is detected outside leeway', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-uuid',
        userId: 'user-uuid',
        tenantId: 'tenant-uuid',
        expiresAt: new Date(Date.now() + 86400000),
        refreshTokenHash: await bcrypt.hash('different-token', 10),
        lastRotatedAt: new Date(Date.now() - 60000),
      });
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.rotateRefreshToken(
        'session-uuid',
        validRtPlain,
        newRtHash,
      );

      expect(result.rotated).toBe(false);
      expect(result.reason).toBe('revoked');
      expect(result.session).toBeNull();
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
      });
    });

    it('should rotate successfully when RT matches', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-uuid',
        expiresAt: new Date(Date.now() + 86400000),
        refreshTokenHash: validRtHash,
        lastRotatedAt: new Date(Date.now() - 60000),
      });
      prisma.session.update.mockResolvedValue({
        id: 'session-uuid',
        refreshTokenHash: newRtHash,
        lastRotatedAt: expect.any(Date),
      });

      const result = await service.rotateRefreshToken(
        'session-uuid',
        validRtPlain,
        newRtHash,
      );

      expect(result.rotated).toBe(true);
      expect(result.reason).toBe('rotated');
      expect(result.session).not.toBeNull();
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        data: {
          refreshTokenHash: newRtHash,
          lastRotatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('revokeSession', () => {
    it('should delete session by id', async () => {
      await service.revokeSession('session-uuid');

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
      });
    });
  });

  describe('revokeAllForUser', () => {
    it('should delete all sessions for a user', async () => {
      await service.revokeAllForUser('user-uuid');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
      });
    });
  });
});

describe('Additional JWT Strategy Edge Cases', () => {
  let strategy: any;
  let prisma: {
    session: { findUnique: jest.Mock };
  };

  const validPayload = {
    sub: 'user-uuid-123',
    sid: 'session-uuid-789',
    email: 'test@hospital.com',
    tenantId: 'tenant-uuid-456',
    roles: ['Doctor'],
    tokenVersion: 0,
  };

  const validSession = {
    id: 'session-uuid-789',
    userId: 'user-uuid-123',
    tenantId: 'tenant-uuid-456',
    expiresAt: new Date(Date.now() + 86400000),
    user: {
      id: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      status: 'ACTIVE',
      deactivatedAt: null,
      tokenVersion: 0,
      userRoles: [] as Array<{
        status: string;
        role: { name: string; status: string; archivedAt: Date | null };
      }>,
    },
  };

  beforeEach(async () => {
    prisma = {
      session: { findUnique: jest.fn().mockResolvedValue(validSession) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue(
                'test-secret-that-is-at-least-32-characters-long',
              ),
          },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  it('should reject payload missing sub', async () => {
    const { sub, ...payload } = validPayload;
    void sub;
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject payload missing sid', async () => {
    const { sid, ...payload } = validPayload;
    void sid;
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject payload missing tenantId', async () => {
    const { tenantId, ...payload } = validPayload;
    void tenantId;
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject payload missing tokenVersion (not a number)', async () => {
    const { tokenVersion, ...payload } = validPayload;
    void tokenVersion;
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject expired session (expiresAt < Date.now())', async () => {
    prisma.session.findUnique.mockResolvedValue({
      ...validSession,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject token sub/session owner mismatch', async () => {
    prisma.session.findUnique.mockResolvedValue({
      ...validSession,
      userId: 'different-user',
    });

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject token tenant/session tenant mismatch', async () => {
    prisma.session.findUnique.mockResolvedValue({
      ...validSession,
      tenantId: 'different-tenant',
    });

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('JwtStrategy role-sourcing (defense in depth vs stale JWT roles)', () => {
  let strategy: any;
  let prisma: {
    session: { findUnique: jest.Mock };
  };

  const validPayload = {
    sub: 'user-uuid-123',
    sid: 'session-uuid-789',
    email: 'test@hospital.com',
    tenantId: 'tenant-uuid-456',
    // JWT claims this role. The strategy must NOT trust it: the
    // authoritative role set is the one currently in the DB.
    roles: ['Doctor'],
    tokenVersion: 0,
  };

  const buildSession = (userRoles: unknown[]) => ({
    id: 'session-uuid-789',
    userId: 'user-uuid-123',
    tenantId: 'tenant-uuid-456',
    expiresAt: new Date(Date.now() + 86400000),
    user: {
      id: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      status: 'ACTIVE',
      deactivatedAt: null,
      tokenVersion: 0,
      userRoles,
    },
  });

  beforeEach(async () => {
    prisma = {
      session: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue(
                'test-secret-that-is-at-least-32-characters-long',
              ),
          },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  // ── include shape ──────────────────────────────────────────────────

  it('queries session with the active userRoles+role include', async () => {
    prisma.session.findUnique.mockResolvedValue(
      buildSession([
        {
          status: 'ACTIVE',
          role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
        },
      ]),
    );

    await strategy.validate(validPayload);

    expect(prisma.session.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-uuid-789' },
        include: expect.objectContaining({
          user: expect.objectContaining({
            include: expect.objectContaining({
              userRoles: expect.objectContaining({
                where: {
                  status: 'ACTIVE',
                  role: { status: 'ACTIVE', archivedAt: null },
                },
                include: {
                  role: {
                    select: { name: true, status: true, archivedAt: true },
                  },
                },
              }),
            }),
          }),
        }),
      }),
    );
  });

  // ── 1. valid role → allow path (analog) ────────────────────────────

  it('returns DB-derived roles for an active role assignment', async () => {
    prisma.session.findUnique.mockResolvedValue(
      buildSession([
        {
          status: 'ACTIVE',
          role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
        },
      ]),
    );

    const result = await strategy.validate(validPayload);

    expect(result.roles).toEqual(['Doctor']);
  });

  it('returns multiple DB-derived roles for multiple active assignments', async () => {
    prisma.session.findUnique.mockResolvedValue(
      buildSession([
        {
          status: 'ACTIVE',
          role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
        },
        {
          status: 'ACTIVE',
          role: { name: 'Nurse', status: 'ACTIVE', archivedAt: null },
        },
      ]),
    );

    const result = await strategy.validate(validPayload);

    expect(result.roles.sort()).toEqual(['Doctor', 'Nurse']);
  });

  // ── 2. revoked role → deny path (the audit-claim fix) ──────────────

  it('does not return a role whose UserRole is REVOKED in DB even if JWT claims it', async () => {
    // DB filter pushes the REVOKED row out of the include.
    // The include would never return it, but we also defend in depth by
    // not falling back to payload.roles — so this test asserts both
    // layers: the include-shape assertion above AND the empty result.
    prisma.session.findUnique.mockResolvedValue(buildSession([]));

    const result = await strategy.validate({
      ...validPayload,
      roles: ['SuperAdmin', 'Doctor'],
    });

    expect(result.roles).toEqual([]);
  });

  // ── 3. archived role excluded ─────────────────────────────────────

  it('does not return a role whose role.archivedAt is set', async () => {
    prisma.session.findUnique.mockResolvedValue(
      buildSession([
        {
          status: 'ACTIVE',
          role: {
            name: 'LegacyRole',
            status: 'ACTIVE',
            archivedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        },
      ]),
    );

    const result = await strategy.validate(validPayload);

    expect(result.roles).toEqual([]);
  });

  it('does not return a role whose role.status is not ACTIVE', async () => {
    prisma.session.findUnique.mockResolvedValue(
      buildSession([
        {
          status: 'ACTIVE',
          role: { name: 'InactiveRole', status: 'INACTIVE', archivedAt: null },
        },
      ]),
    );

    const result = await strategy.validate(validPayload);

    expect(result.roles).toEqual([]);
  });

  it('does not return a role whose UserRole.status is not ACTIVE', async () => {
    prisma.session.findUnique.mockResolvedValue(
      buildSession([
        {
          status: 'REVOKED',
          role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
        },
      ]),
    );

    const result = await strategy.validate(validPayload);

    expect(result.roles).toEqual([]);
  });

  // ── 4. fail-closed ────────────────────────────────────────────────

  it('still throws when tokenVersion does not match DB', async () => {
    prisma.session.findUnique.mockResolvedValue(
      buildSession([
        {
          status: 'ACTIVE',
          role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
        },
      ]),
    );

    await expect(
      strategy.validate({ ...validPayload, tokenVersion: 99 }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws when session.user is missing on the loaded session (defensive)', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-uuid-789',
      userId: 'user-uuid-123',
      tenantId: 'tenant-uuid-456',
      expiresAt: new Date(Date.now() + 86400000),
      user: null,
    });

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns empty roles when userRoles is empty (no fallback to payload)', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession([]));

    const result = await strategy.validate(validPayload);

    // Critical: the payload said ['Doctor'], but the strategy MUST NOT
    // surface a role the user no longer has in the DB.
    expect(result.roles).toEqual([]);
  });
});
