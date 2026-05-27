import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionService } from '../session.service';
import { MfaService } from '../mfa.service';
import { AuditService } from '../../audit/audit.service';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

type MockPrisma = {
  tenant: { findFirst: jest.Mock };
  user: { findUnique: jest.Mock; update: jest.Mock };
  userBranch: { findMany: jest.Mock; findFirst: jest.Mock };
  userRole: { findMany: jest.Mock };
  rolePermission: { findFirst: jest.Mock };
  session: { update: jest.Mock };
  $transaction: jest.Mock;
};

type MockJwtService = {
  sign: jest.Mock;
};

type MockSessionService = {
  createSession: jest.Mock;
  markMfaVerified: jest.Mock;
  setInitialRefreshToken: jest.Mock;
  rotateRefreshToken: jest.Mock;
  revokeSession: jest.Mock;
};

describe('Auth Routing Stability', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let jwtService: MockJwtService;
  let sessionService: MockSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            tenant: { findFirst: jest.fn() },
            user: { findUnique: jest.fn(), update: jest.fn() },
            userBranch: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn().mockResolvedValue({ branchId: 'branch-0' }),
            },
            userRole: { findMany: jest.fn() },
            rolePermission: { findFirst: jest.fn().mockResolvedValue(null) },
            session: { update: jest.fn().mockResolvedValue(undefined) },
            $transaction: jest.fn(async (cb) => cb({})),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mocked-token') },
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
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    sessionService = module.get(SessionService);
  });

  const makeUserWithRoles = (roles: string[]) => ({
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
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: {
      id: 'tenant-456',
      name: 'Tenant',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: roles.map((r) => ({
      status: 'ACTIVE',
      role: {
        name: r,
        status: 'ACTIVE',
        archivedAt: null,
        rolePermissions: [],
      },
    })),
  });

  const mockBranches = (count: number) => {
    const branches = Array.from({ length: count }).map((_, i) => ({
      userId: 'user-123',
      tenantId: 'tenant-456',
      isActive: true,
      branch: { id: `branch-${i}`, name: `Branch ${i}`, code: `B${i}` },
    }));
    prisma.userBranch.findMany.mockResolvedValue(branches);
  };

  describe('A. Default portal path tests', () => {
    const roleMappings = [
      { role: 'Super Admin', path: '/admin' },
      { role: 'Branch Admin', path: '/branch-admin' },
      { role: 'Marketplace Admin', path: '/marketplace-admin' },
      { role: 'Compliance Officer', path: '/compliance' },
      { role: 'IT Support', path: '/it' },
      { role: 'HR Manager', path: '/hr' },
      { role: 'HR Staff', path: '/hr' },
      { role: 'Procurement Officer', path: '/procurement' },
      { role: 'Procurement Manager', path: '/procurement' },
      { role: 'Procurement Agent', path: '/procurement' },
      { role: 'Doctor', path: '/doctor' },
      { role: 'Nurse', path: '/nurse' },
      { role: 'Med-Tech', path: '/lab' },
      { role: 'Lab Technician', path: '/lab' },
      { role: 'Cashier', path: '/cashier' },
      { role: 'Finance', path: '/cashier' },
      { role: 'Pharmacist', path: '/pharmacy' },
      { role: 'Supplier', path: '/supplier' },
      { role: 'Supplier Admin', path: '/supplier' },
      { role: 'Marketplace Supplier', path: '/supplier' },
      { role: 'Marketplace Buyer', path: '/marketplace' },
      { role: 'Customer', path: '/marketplace' },
      { role: 'Patient', path: '/patient' },
      { role: 'Field Technician', path: '/field-service' },
      { role: 'Receptionist', path: '/queue' },
      { role: 'Unknown Role', path: '/unauthorized' },
    ];

    roleMappings.forEach(({ role, path }) => {
      it(`should map ${role} to ${path}`, async () => {
        const user = makeUserWithRoles([role]);
        prisma.user.findUnique.mockResolvedValue(user);
        const result = await service.getMe('user-123', 'tenant-456');
        expect(result).toBeDefined();
        expect(result!.defaultPortalPath).toBe(path);
      });
    });

    it('should map Empty role list to /unauthorized', async () => {
      const user = makeUserWithRoles([]);
      prisma.user.findUnique.mockResolvedValue(user);
      const result = await service.getMe('user-123', 'tenant-456');
      expect(result).toBeDefined();
      expect(result!.defaultPortalPath).toBe('/unauthorized');
    });

    it('should never return "/" as default portal path', async () => {
      const user = makeUserWithRoles(['Random Nonexistent Role']);
      prisma.user.findUnique.mockResolvedValue(user);
      const result = await service.getMe('user-123', 'tenant-456');
      expect(result).toBeDefined();
      expect(result!.defaultPortalPath).not.toBe('/');
    });
  });

  describe('B. Global role branch-selection tests', () => {
    const globalRoles = [
      { role: 'Super Admin', path: '/admin' },
      { role: 'Marketplace Admin', path: '/marketplace-admin' },
      { role: 'Compliance Officer', path: '/compliance' },
      { role: 'IT Support', path: '/it' },
    ];

    globalRoles.forEach(({ role, path }) => {
      it(`should not require branch selection for ${role} despite having multiple active branches`, async () => {
        const user = makeUserWithRoles([role]);
        mockBranches(3);
        prisma.user.update.mockResolvedValue(user);

        const result = await service.login(user);

        expect(result.requiresBranchSelection).toBe(false);
        expect(result.user.defaultPortalPath).toBe(path);
      });
    });
  });

  describe('C. Branch-scoped user branch-selection tests', () => {
    it('Branch Admin with multiple active branches and no branchId: requiresBranchSelection === true', async () => {
      const user = makeUserWithRoles(['Branch Admin']);
      mockBranches(2);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.login(user);

      expect(result.requiresBranchSelection).toBe(true);
      expect(result.availableBranches).toBeDefined();
      expect(result.availableBranches?.length).toBe(2);
      expect(result.user.defaultPortalPath).toBe('/branch-admin');
    });

    it('Branch Admin after selectBranch: requiresBranchSelection === false', async () => {
      const user = makeUserWithRoles(['Branch Admin']);
      mockBranches(2);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.session.update.mockResolvedValue(undefined);

      const result = await service.selectBranch(
        'user-123',
        'tenant-456',
        'branch-0',
      );

      expect(result).toBeDefined();
      expect(result!.requiresBranchSelection).toBe(false);
      expect(result!.user.defaultPortalPath).toBe('/branch-admin');

      // JWT should contain branchId
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-0',
        }),
        expect.any(Object),
      );
    });

    it('Doctor with multiple branches and no branchId: requiresBranchSelection === true', async () => {
      const user = makeUserWithRoles(['Doctor']);
      mockBranches(3);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.login(user);

      expect(result.requiresBranchSelection).toBe(true);
      expect(result.user.defaultPortalPath).toBe('/doctor');
    });

    it('Cashier with multiple branches and no branchId: requiresBranchSelection === true', async () => {
      const user = makeUserWithRoles(['Cashier']);
      mockBranches(2);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.login(user);

      expect(result.requiresBranchSelection).toBe(true);
      expect(result.user.defaultPortalPath).toBe('/cashier');
    });
  });

  describe('D. Unknown-role loop prevention tests', () => {
    it('Unknown role login/getMe defaultPortalPath is /unauthorized', async () => {
      const user = makeUserWithRoles(['Ghost']);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const loginResult = await service.login(user);
      expect(loginResult.user.defaultPortalPath).toBe('/unauthorized');
      expect(loginResult.user.defaultPortalPath).not.toBe('/');

      const meResult = await service.getMe('user-123', 'tenant-456');
      expect(meResult!.defaultPortalPath).toBe('/unauthorized');
      expect(meResult!.defaultPortalPath).not.toBe('/');
    });

    it('Empty roles defaultPortalPath is /unauthorized', async () => {
      const user = makeUserWithRoles([]);
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const loginResult = await service.login(user);
      expect(loginResult.user.defaultPortalPath).toBe('/unauthorized');
      expect(loginResult.user.defaultPortalPath).not.toBe('/');

      const meResult = await service.getMe('user-123', 'tenant-456');
      expect(meResult!.defaultPortalPath).toBe('/unauthorized');
      expect(meResult!.defaultPortalPath).not.toBe('/');
    });
  });
});
