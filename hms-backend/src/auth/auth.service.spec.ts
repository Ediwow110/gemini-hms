import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';
import * as bcrypt from 'bcrypt';

// Mock JWT_SECRET for test environment
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    tenant: { findFirst: jest.Mock };
    user: { findFirst: jest.Mock; findUnique: jest.Mock };
    userBranch: { findMany: jest.Mock; findFirst: jest.Mock };
    userRole: { findMany: jest.Mock };
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
            },
            userBranch: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            userRole: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-token'),
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
      userRoles: [{ role: { name: 'Admin' } }],
    };

    it('should include branchId when exactly one active branch assignment exists', async () => {
      prisma.userBranch.findMany.mockResolvedValue([
        { branchId: 'branch-789' },
      ]);

      const result = await service.login(mockUser);

      expect(prisma.userBranch.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          tenantId: mockUser.tenantId,
          isActive: true,
        },
        select: { branchId: true },
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-789',
          tokenVersion: 0,
        }),
      );
      expect(result.access_token).toBe('mocked-token');
    });

    it('should include tokenVersion in the JWT payload', async () => {
      prisma.userBranch.findMany.mockResolvedValue([]);

      await service.login({ ...mockUser, tokenVersion: 7 });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tokenVersion: 7 }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.not.objectContaining({ permissions: expect.anything() }),
      );
    });

    it('should omit branchId when no active branch assignment exists', async () => {
      prisma.userBranch.findMany.mockResolvedValue([]);

      await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.not.objectContaining({
          branchId: expect.anything(),
        }),
      );
    });

    it('should omit branchId when multiple active branch assignments exist', async () => {
      prisma.userBranch.findMany.mockResolvedValue([
        { branchId: 'branch-1' },
        { branchId: 'branch-2' },
      ]);

      await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.not.objectContaining({
          branchId: expect.anything(),
        }),
      );
    });

    it('should no longer use the mocked branchId 00000000-0000-0000-0000-000000000000', async () => {
      prisma.userBranch.findMany.mockResolvedValue([]);

      await service.login(mockUser);

      const signCall = jwtService.sign.mock.calls[0][0];
      expect(signCall.branchId).toBeUndefined();
      expect(signCall.branchId).not.toBe(
        '00000000-0000-0000-0000-000000000000',
      );
    });
  });

  describe('selectBranch', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';
    const branchId = 'branch-789';

    it('should return refreshed token when active assignment exists', async () => {
      prisma.userBranch.findFirst.mockResolvedValue({
        userId,
        tenantId,
        branchId,
        isActive: true,
      });

      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        tenantId,
        passwordHash: 'redacted',
        isMfaEnabled: false,
        status: 'ACTIVE',
        deactivatedAt: null,
        deactivatedReason: null,
        tokenVersion: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        tenant: {
          id: tenantId,
          name: 'Tenant',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        userRoles: [{ role: { name: 'Doctor' } }],
      });

      const result = await service.selectBranch(userId, tenantId, branchId);

      expect(prisma.userBranch.findFirst).toHaveBeenCalledWith({
        where: { userId, tenantId, branchId, isActive: true },
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          tenantId,
          branchId,
          tokenVersion: 0,
        }),
      );
      expect(result.access_token).toBe('mocked-token');
      expect(result.user.branchId).toBe(branchId);
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
      expect(result.passwordHash).toBeUndefined();
      expect(result.email).toBe('test@example.com');
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
    it('should return DB-derived permissions without signing a JWT', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        userRoles: [{ role: { name: 'Doctor' } }],
      });
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            rolePermissions: [
              { permission: { name: 'patient.view' } },
              { permission: { name: 'lab.result.view' } },
            ],
          },
        },
      ]);
      prisma.userBranch.findMany.mockResolvedValue([
        { branchId: 'branch-789' },
      ]);

      const result = await service.getMe('user-123', 'tenant-456');

      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: { tenantId: 'tenant-456' },
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });
      expect(result?.permissions).toEqual(['patient.view', 'lab.result.view']);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});

describe('JWT Claim Consistency', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findFirst: jest.Mock } };

  beforeEach(async () => {
    prisma = {
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
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('JwtStrategy.validate() should return tenantId from payload.tenantId (camelCase)', async () => {
    const payload = {
      sub: 'user-uuid-123',
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
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: ['Doctor'],
      tokenVersion: 0,
    };

    const result = await strategy.validate(payload);

    expect(result.branchId).toBeUndefined();
  });

  it('JwtStrategy.validate() should reject a missing user', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should reject inactive users', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      status: 'SUSPENDED',
      deactivatedAt: null,
      tokenVersion: 0,
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should reject deactivated users', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      status: 'ACTIVE',
      deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
      tokenVersion: 0,
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should reject tokenVersion mismatches', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      status: 'ACTIVE',
      deactivatedAt: null,
      tokenVersion: 2,
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-123',
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
        tokenVersion: 1,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('JwtStrategy.validate() should accept matching tokenVersion', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      status: 'ACTIVE',
      deactivatedAt: null,
      tokenVersion: 3,
    });

    const result = await strategy.validate({
      sub: 'user-uuid-123',
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
        email: 'test@hospital.com',
        tenantId: 'tenant-uuid-456',
        roles: ['Doctor'],
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
