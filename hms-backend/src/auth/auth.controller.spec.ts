import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SelectBranchDto } from './dto/select-branch.dto';
import { RequestUser } from '../common/types/authenticated-request.type';

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      selectBranch: jest.fn(),
      getUserBranches: jest.fn(),
      getMe: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
      verifyMfa: jest.fn(),
      verifyMfaWithRecoveryCode: jest.fn(),
    };

    const mockMfaService = {
      generateSecret: jest.fn(),
      enableMfa: jest.fn(),
      verifyCode: jest.fn(),
      generateRecoveryCodes: jest.fn(),
      verifyRecoveryCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: MfaService,
          useValue: mockMfaService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-mfa-token'),
            verify: jest.fn().mockReturnValue({ sub: 'user-id' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException if validation fails', async () => {
      authService.validateUser.mockResolvedValue(null);
      const loginDto = { tenantCode: 't1', email: 'e', password: 'p' };
      const mockRes = createMockRes();

      await expect(controller.login(loginDto, mockRes as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return Authenticated message if validation succeeds', async () => {
      const mockUser = { id: 'u1' };
      authService.validateUser.mockResolvedValue(mockUser as any);
      authService.login.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'rt',
        user: { id: 'u1', tenantId: 't1', roles: ['Admin'] },
      } as any);
      const loginDto = { tenantCode: 't1', email: 'e', password: 'p' };
      const mockRes = createMockRes();

      const result = await controller.login(loginDto, mockRes as any);
      expect(result.message).toBe('Authenticated');
      expect(result.user).toBeDefined();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.cookie).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should return MFA_REQUIRED for sensitive roles', async () => {
      const mockUser = { id: 'u1' };
      authService.validateUser.mockResolvedValue(mockUser as any);
      authService.login.mockResolvedValue({
        message: 'MFA_REQUIRED',
        challenge: 'MFA_VERIFY',
        mfaToken: 'mfa-token',
      } as any);
      const loginDto = { tenantCode: 't1', email: 'e', password: 'p' };
      const mockRes = createMockRes();

      const result = await controller.login(loginDto, mockRes as any);
      expect(result.message).toBe('MFA_REQUIRED');
      expect(result.mfaToken).toBeDefined();
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });

  describe('selectBranch', () => {
    const mockUser: RequestUser = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      roles: ['Admin'],
    };
    const selectBranchDto: SelectBranchDto = {
      branchId: 'branch-789',
    };

    it('should return refreshed token for valid active assignment', async () => {
      const mockResult = {
        accessToken: 'new-token',
        user: { id: 'user-123', branchId: 'branch-789' },
      };
      authService.selectBranch.mockResolvedValue(mockResult as any);
      const mockRes = createMockRes();

      const result = await controller.selectBranch(
        mockUser,
        selectBranchDto,
        mockRes as any,
      );

      expect(result).toBeDefined();
      expect(mockRes.cookie).toHaveBeenCalled();
      expect(authService.selectBranch).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.tenantId,
        selectBranchDto.branchId,
      );
    });

    it('should throw ForbiddenException for unauthorized branch assignment', async () => {
      authService.selectBranch.mockResolvedValue(null);
      const mockRes = createMockRes();

      await expect(
        controller.selectBranch(mockUser, selectBranchDto, mockRes as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyBranches', () => {
    it('should return branches for the user', async () => {
      const mockUser: RequestUser = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        roles: ['Admin'],
      };
      const mockBranches = [{ id: 'b1', name: 'Branch 1', code: 'B1' }];
      authService.getUserBranches.mockResolvedValue(mockBranches);

      const result = await controller.getMyBranches(mockUser);

      expect(result).toBe(mockBranches);

      expect(authService.getUserBranches).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.tenantId,
      );
    });
  });

  describe('getMe', () => {
    it('should return user profile with csrfToken', async () => {
      const mockUser: RequestUser = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        roles: ['Admin'],
      };
      const mockProfile = {
        id: 'user-123',
        userId: 'user-123',
        email: 'admin@test.com',
        tenantId: 'tenant-456',
        branchId: undefined,
        roles: ['Admin'],
        permissions: [],
        defaultPortalPath: '/admin',
      };
      authService.getMe.mockResolvedValue(mockProfile);

      const mockReq = { cookies: {} };
      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await controller.getMe(
        mockUser,
        mockReq as any,
        mockRes as any,
      );

      expect(result).toHaveProperty('csrfToken');
      expect(result).toMatchObject(mockProfile);
      expect(authService.getMe).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.tenantId,
      );
      // When no cookie exists, a new one should be set
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should return existing csrfToken from cookie', async () => {
      const mockUser: RequestUser = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        roles: ['Admin'],
      };
      const mockProfile = {
        id: 'user-123',
        userId: 'user-123',
        email: 'admin@test.com',
        tenantId: 'tenant-456',
        branchId: undefined,
        roles: ['Admin'],
        permissions: [],
        defaultPortalPath: '/admin',
      };
      authService.getMe.mockResolvedValue(mockProfile);

      const existingToken = 'existing-csrf-token-value';
      const mockReq = { cookies: { csrf_token: existingToken } };
      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await controller.getMe(
        mockUser,
        mockReq as any,
        mockRes as any,
      );

      expect(result).toHaveProperty('csrfToken', existingToken);
      expect(result).toMatchObject(mockProfile);
      // Should NOT set a new cookie since one already exists
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear cookies on logout', async () => {
      const mockUser: RequestUser = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        roles: ['Admin'],
      };
      const mockRes = createMockRes();

      await controller.logout(mockUser, mockRes as any);

      expect(authService.logout).toHaveBeenCalledWith(
        mockUser.userId,
        undefined,
      );
      expect(mockRes.clearCookie).toHaveBeenCalled();
    });
  });
});
