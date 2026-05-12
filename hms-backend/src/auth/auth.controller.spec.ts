import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SelectBranchDto } from './dto/select-branch.dto';
import { RequestUser } from '../common/types/authenticated-request.type';

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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return token if validation succeeds', async () => {
      const mockUser = { id: 'u1' };
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue({ access_token: 'token' });
      const loginDto = { tenantCode: 't1', email: 'e', password: 'p' };

      const result = await controller.login(loginDto);
      expect(result).toEqual({ access_token: 'token' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(mockUser);
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
        access_token: 'new-token',
        user: { id: 'user-123', branchId: 'branch-789' },
      };
      authService.selectBranch.mockResolvedValue(mockResult);

      const result = await controller.selectBranch(mockUser, selectBranchDto);

      expect(result).toBe(mockResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.selectBranch).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.tenantId,
        selectBranchDto.branchId,
      );
    });

    it('should throw ForbiddenException for unauthorized branch assignment', async () => {
      authService.selectBranch.mockResolvedValue(null);

      await expect(
        controller.selectBranch(mockUser, selectBranchDto),
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

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.getUserBranches).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.tenantId,
      );
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      const mockUser: RequestUser = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        roles: ['Admin'],
      };
      const mockProfile = {
        userId: 'user-123',
        email: 'admin@test.com',
        tenantId: 'tenant-456',
        branchId: undefined,
        roles: ['Admin'],
        permissions: [],
      };
      authService.getMe.mockResolvedValue(mockProfile);

      const result = await controller.getMe(mockUser);

      expect(result).toBe(mockProfile);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.getMe).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.tenantId,
      );
    });
  });
});
