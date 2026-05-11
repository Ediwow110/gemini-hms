import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';
import * as bcrypt from 'bcrypt';

// Mock JWT_SECRET for test environment
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: JwtService;

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
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
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

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-789',
        }),
      );
      expect(result.access_token).toBe('mocked-token');
    });

    it('should omit branchId when no active branch assignment exists', async () => {
      prisma.userBranch.findMany.mockResolvedValue([]);

      await service.login(mockUser);

      // eslint-disable-next-line @typescript-eslint/unbound-method
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

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.not.objectContaining({
          branchId: expect.anything(),
        }),
      );
    });

    it('should no longer use the mocked branchId 00000000-0000-0000-0000-000000000000', async () => {
      prisma.userBranch.findMany.mockResolvedValue([]);

      await service.login(mockUser);

      const signCall = (jwtService.sign as jest.Mock).mock.calls[0][0];
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
        userRoles: [{ role: { name: 'Doctor' } }],
      });

      const result = await service.selectBranch(userId, tenantId, branchId);

      expect(prisma.userBranch.findFirst).toHaveBeenCalledWith({
        where: { userId, tenantId, branchId, isActive: true },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          tenantId,
          branchId,
        }),
      );
      expect(result.access_token).toBe('mocked-token');
      expect(result.user.branchId).toBe(branchId);
    });

    it('should return null if assignment does not exist', async () => {
      prisma.userBranch.findFirst.mockResolvedValue(null);

      const result = await service.selectBranch(userId, tenantId, branchId);

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
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
});

describe('JWT Claim Consistency', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('JwtStrategy.validate() should return tenantId from payload.tenantId (camelCase)', async () => {
    const payload = {
      sub: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: ['Doctor'],
      jti: 'jti-789',
    };

    const result = await strategy.validate(payload);

    expect(result.userId).toBe('user-uuid-123');
    expect(result.email).toBe('test@hospital.com');
    expect(result.tenantId).toBe('tenant-uuid-456');
    expect(result.roles).toEqual(['Doctor']);
  });

  it('tenantId must NOT be undefined when payload uses camelCase', async () => {
    const payload = {
      sub: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: [],
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
    };

    const result = await strategy.validate(payload);

    expect(result.branchId).toBeUndefined();
  });
});
