import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { MfaService } from './mfa.service';
import { AuditService } from '../audit/audit.service';
import { JwtStrategy } from './jwt.strategy';
import * as bcrypt from 'bcrypt';

// Mock JWT_SECRET for test environment
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    tenant: { findFirst: jest.Mock };
    user: { findFirst: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    userBranch: { findMany: jest.Mock; findFirst: jest.Mock };
    userRole: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              findFirst: jest.fn(),
            },
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            userBranch: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            userRole: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn(async (cb) => cb({})),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-token'),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn().mockResolvedValue({ id: 'session-id' }),
            markMfaVerified: jest.fn().mockResolvedValue(undefined),
            setInitialRefreshToken: jest.fn().mockResolvedValue(undefined),
            rotateRefreshToken: jest.fn(),
            revokeSession: jest.fn(),
          },
        },
        {
          provide: MfaService,
          useValue: {
            verifyCode: jest.fn(),
            verifyRecoveryCode: jest.fn(),
            generateSecret: jest.fn(),
            enableMfa: jest.fn(),
            generateRecoveryCodes: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
      passwordHash: 'redacted',
      isMfaEnabled: false,
      mfaEnabled: false,
      mfaSecret: null,
      status: 'ACTIVE',
      deactivatedAt: null,
      deactivatedReason: null,
      tokenVersion: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      tenant: {
        id: 'tenant-456',
        name: 'Tenant',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      userRoles: [
        {
          status: 'ACTIVE',
          role: { name: 'Admin', status: 'ACTIVE', archivedAt: null },
        },
      ],
    };

    it('should create session and return tokens for non-sensitive role', async () => {
      const result = await service.login(mockUser);

      expect(result.accessToken).toBe('mocked-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should return MFA challenge for sensitive role', async () => {
      const sensitiveUser = {
        ...mockUser,
        userRoles: [
          {
            status: 'ACTIVE',
            role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
          },
        ],
      };

      const result = await service.login(sensitiveUser);

      expect(result.statusCode).toBe(202);
      expect(result.message).toBe('MFA_REQUIRED');
      expect(result.mfaToken).toBeDefined();
    });

    it('should include tokenVersion in the JWT payload', async () => {
      await service.login({ ...mockUser, tokenVersion: 7 });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tokenVersion: 7 }),
        expect.anything(),
      );
    });

    it('should omit revoked roles from the JWT role list', async () => {
      await service.login({
        ...mockUser,
        userRoles: [
          {
            status: 'ACTIVE',
            role: {
              id: 'role-1',
              tenantId: 'tenant-456',
              name: 'Doctor',
              status: 'ACTIVE',
              isSystem: true,
              archivedAt: null,
              archivedReason: null,
            },
          },
          {
            status: 'REVOKED',
            role: {
              id: 'role-2',
              tenantId: 'tenant-456',
              name: 'Cashier',
              status: 'ACTIVE',
              isSystem: true,
              archivedAt: null,
              archivedReason: null,
            },
          },
        ],
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['Doctor'] }),
        expect.anything(),
      );
    });
  });

  describe('selectBranch', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';
    const branchId = 'branch-789';

    it('should return refreshed token when active assignment exists', async () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        tenantId,
        status: 'ACTIVE',
        deactivatedAt: null,
        tokenVersion: 1,
      };

      prisma.userBranch.findFirst.mockResolvedValue({
        userId,
        tenantId,
        branchId,
        isActive: true,
      });
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: userId,
        tenantId,
        status: 'ACTIVE',
        deactivatedAt: null,
        tenant: { id: tenantId },
        userRoles: [],
      });

      const result = await service.selectBranch(userId, tenantId, branchId);

      expect(prisma.userBranch.findFirst).toHaveBeenCalledWith({
        where: { userId, tenantId, branchId, isActive: true },
      });
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('sessionId');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ branchId }),
        expect.anything(),
      );
    });

    it('should return null if assignment does not exist', async () => {
      prisma.userBranch.findFirst.mockResolvedValue(null);

      const result = await service.selectBranch(userId, tenantId, branchId);

      expect(result).toBeNull();

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should return null if assignment is inactive', async () => {
      // findFirst should already filter by isActive: true in the service
      prisma.userBranch.findFirst.mockResolvedValue(null);

      const result = await service.selectBranch(userId, tenantId, branchId);

      expect(result).toBeNull();
    });

    it('should scope lookup by tenantId', async () => {
      prisma.userBranch.findFirst.mockResolvedValue(null);

      await service.selectBranch(userId, 'other-tenant', branchId);

      expect(prisma.userBranch.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'other-tenant',
          }),
        }),
      );
    });
  });

  describe('validateUser', () => {
    it('should strip passwordHash from result (Security Hardening)', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-456' });
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        passwordHash,
        isMfaEnabled: false,
        status: 'ACTIVE',
        deactivatedAt: null,
        deactivatedReason: null,
        tokenVersion: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        tenant: {
          id: 'tenant-456',
          name: 'Tenant',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        userRoles: [],
      });

      const result = await service.validateUser(
        'tenant-code',
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect((result as any).passwordHash).toBeUndefined();
      expect(result!.email).toBe('test@example.com');
    });

    it('should reject users whose status is not ACTIVE', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-456' });
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        passwordHash,
        status: 'SUSPENDED',
        deactivatedAt: null,
        userRoles: [],
      });

      const result = await service.validateUser(
        'tenant-code',
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should reject users with deactivatedAt set', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-456' });
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        passwordHash,
        status: 'ACTIVE',
        deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
        userRoles: [],
      });

      const result = await service.validateUser(
        'tenant-code',
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });
  });

  describe('getUserBranches', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';

    it('should return only active branch assignments for the user and tenant', async () => {
      const mockBranch1 = { id: 'b1', name: 'Branch 1', code: 'B1' };
      const mockBranch2 = { id: 'b2', name: 'Branch 2', code: 'B2' };

      prisma.userBranch.findMany.mockResolvedValue([
        { branch: mockBranch1 },
        { branch: mockBranch2 },
      ]);

      const result = await service.getUserBranches(userId, tenantId);

      expect(prisma.userBranch.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          tenantId,
          isActive: true,
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual([mockBranch1, mockBranch2]);
    });

    it('should return empty array when no active assignments exist', async () => {
      prisma.userBranch.findMany.mockResolvedValue([]);

      const result = await service.getUserBranches(userId, tenantId);

      expect(result).toEqual([]);
    });

    it('should not expose sensitive fields in the response', async () => {
      // The select in findMany already handles this, but we test the service output
      const mockBranch = { id: 'b1', name: 'Branch 1', code: 'B1' };
      prisma.userBranch.findMany.mockResolvedValue([{ branch: mockBranch }]);

      const result = await service.getUserBranches(userId, tenantId);

      expect(result[0]).toEqual({
        id: 'b1',
        name: 'Branch 1',
        code: 'B1',
      });
      expect(result[0]).not.toHaveProperty('tenantId');
      expect(result[0]).not.toHaveProperty('createdAt');
    });
  });

  describe('getMe', () => {
    it('should return user profile with roles', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        userRoles: [
          {
            status: 'ACTIVE',
            role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
          },
          {
            status: 'REVOKED',
            role: { name: 'Cashier', status: 'ACTIVE', archivedAt: null },
          },
        ],
      });

      const result = await service.getMe('user-123', 'tenant-456');

      expect(result).toEqual({
        id: 'user-123',
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        roles: ['Doctor'],
        permissions: [],
      });
    });

    it('should return null when tenant mismatch', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        userRoles: [],
      });

      const result = await service.getMe('user-123', 'different-tenant');

      expect(result).toBeNull();
    });

    it('should exclude revoked roles from the role list', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        userRoles: [
          {
            status: 'ACTIVE',
            role: { name: 'Doctor', status: 'ACTIVE', archivedAt: null },
          },
          {
            status: 'REVOKED',
            role: { name: 'Cashier', status: 'ACTIVE', archivedAt: null },
          },
        ],
      });

      const result = await service.getMe('user-123', 'tenant-456');

      expect(result?.roles).toEqual(['Doctor']);
    });

    it('should exclude archived/inactive roles from the role list', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        userRoles: [
          {
            status: 'ACTIVE',
            role: {
              name: 'Archived Role',
              status: 'INACTIVE',
              archivedAt: new Date(),
            },
          },
        ],
      });

      const result = await service.getMe('user-123', 'tenant-456');

      expect(result?.roles).toEqual([]);
    });

    it('should exclude roles with archivedAt set even if status is ACTIVE', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        userRoles: [
          {
            status: 'ACTIVE',
            role: {
              name: 'Edge Role',
              status: 'ACTIVE',
              archivedAt: new Date(),
            },
          },
        ],
      });
      const result = await service.getMe('user-123', 'tenant-456');

      expect(result?.roles).toEqual([]);
    });
  });
});

describe('JWT Claim Consistency', () => {
  let strategy: JwtStrategy;
  let prisma: {
    session: { findUnique: jest.Mock };
    user: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue({
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
          },
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-uuid-123',
          email: 'test@hospital.com',
          tenantId: 'tenant-uuid-456',
          status: 'ACTIVE',
          deactivatedAt: null,
          tokenVersion: 0,
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: prisma,
        },
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

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('JwtStrategy.validate() should return tenantId from payload.tenantId (camelCase)', async () => {
    const payload = {
      sub: 'user-uuid-123',
      sid: 'session-uuid-789',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: ['Doctor'],
      tokenVersion: 0,
      jti: 'jti-789',
    };

    const result = await strategy.validate(payload);

    expect(result.userId).toBe('user-uuid-123');
    expect(result.email).toBe('test@hospital.com');
    expect(result.tenantId).toBe('tenant-uuid-456');
    expect(result.roles).toEqual(['Doctor']);
    expect(result.tokenVersion).toBe(0);
  });

  it('tenantId must NOT be undefined when payload uses camelCase', async () => {
    const payload = {
      sub: 'user-uuid-123',
      sid: 'session-uuid-789',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: [],
      tokenVersion: 0,
    };

    const result = await strategy.validate(payload);

    // This was the bug: payload.tenant_id would produce undefined
    expect(result.tenantId).toBeDefined();
    expect(result.tenantId).not.toBeNull();
    expect(result.tenantId).toBe('tenant-uuid-456');
  });

  it('PermissionsGuard would reject if tenantId is undefined', async () => {
    // Simulate what happens if the old snake_case field is used in payload
    // but validate() reads camelCase — tenantId should still be correct
    const payload = {
      sub: 'user-uuid-123',
      sid: 'session-uuid-789',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456', // This is what AuthService signs
      roles: ['Admin'],
      tokenVersion: 0,
    };

    const user = await strategy.validate(payload);

    // PermissionsGuard checks: !user.tenantId
    const wouldReject = !user || !user.userId || !user.tenantId;
    expect(wouldReject).toBe(false);
  });

  it('JwtStrategy.validate() should propagate branchId when present in payload', async () => {
    const payload = {
      sub: 'user-uuid-123',
      sid: 'session-uuid-789',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      branchId: 'branch-uuid-789',
      roles: ['Doctor'],
      tokenVersion: 0,
    };

    const result = await strategy.validate(payload);

    expect(result.branchId).toBeDefined();
    expect(result.branchId).toBe('branch-uuid-789');
  });

  it('JwtStrategy.validate() should safely omit branchId when missing in payload', async () => {
    const payload = {
      sub: 'user-uuid-123',
      sid: 'session-uuid-789',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: ['Doctor'],
      tokenVersion: 0,
    };

    const result = await strategy.validate(payload);

    expect(result.branchId).toBeUndefined();
  });

  it('JwtStrategy.validate() should reject a missing user', async () => {
    prisma.session.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        sid: 'session-uuid-789',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should reject inactive users', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-uuid-789',
      userId: 'user-uuid-123',
      tenantId: 'tenant-uuid-456',
      expiresAt: new Date(Date.now() + 86400000),
      user: {
        id: 'user-uuid-123',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        status: 'SUSPENDED',
        deactivatedAt: null,
        tokenVersion: 0,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        sid: 'session-uuid-789',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should reject deactivated users', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-uuid-789',
      userId: 'user-uuid-123',
      tenantId: 'tenant-uuid-456',
      expiresAt: new Date(Date.now() + 86400000),
      user: {
        id: 'user-uuid-123',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        status: 'ACTIVE',
        deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
        tokenVersion: 0,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        sid: 'session-uuid-789',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should reject tokenVersion mismatches', async () => {
    prisma.session.findUnique.mockResolvedValue({
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
        tokenVersion: 2,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        sid: 'session-uuid-789',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 1,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should accept matching tokenVersion', async () => {
    prisma.session.findUnique.mockResolvedValue({
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
        tokenVersion: 3,
      },
    });

    const result = await strategy.validate({
      sub: 'user-uuid-123',
      sid: 'session-uuid-789',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: ['Doctor'],
      tokenVersion: 3,
    });

    expect(result.tokenVersion).toBe(3);
  });

  it('JwtStrategy.validate() should reject missing tokenVersion', async () => {
    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        sid: 'session-uuid-789',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
