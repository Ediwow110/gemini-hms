import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SelectBranchDto } from './dto/select-branch.dto';
import { GetUser } from './decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { Public } from '../common/decorators/public.decorator';
import { MfaChallengeGuard } from './guards/mfa-challenge.guard';
import { MfaService } from './mfa.service';
import { SkipMfa } from './decorators/skip-mfa.decorator';
import type { Request, Response } from 'express';

const COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/',
});

const REFRESH_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/api/v1/auth/refresh',
});

const CSRF_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: false,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/',
});

function setAuthCookies(
  res: Response,
  result: any,
  isProd: boolean,
  userId?: string,
): void {
  if (result.accessToken) {
    res.cookie('access_token', result.accessToken, COOKIE_OPTIONS(isProd));
  }
  if (result.refreshToken) {
    res.cookie(
      'refresh_token',
      result.refreshToken,
      REFRESH_COOKIE_OPTIONS(isProd),
    );
  }
  if (result.sessionId) {
    res.cookie('session_id', result.sessionId, REFRESH_COOKIE_OPTIONS(isProd));
  }
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', csrfToken, CSRF_COOKIE_OPTIONS(isProd));
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
  res.clearCookie('csrf_token', { path: '/' });
  res.clearCookie('session_id', { path: '/api/v1/auth/refresh' });
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const user = await this.authService.validateUser(
      loginDto.tenantCode,
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const result: any = await this.authService.login(user);
    res.status(result.statusCode || HttpStatus.OK);

    // If MFA is required, return mfaToken in response body (not as cookie)
    if (result.message === 'MFA_REQUIRED') {
      return {
        message: 'MFA_REQUIRED',
        challenge: result.challenge,
        mfaToken: result.mfaToken,
      };
    }

    // Set httpOnly cookies for standard auth
    const isProd = process.env.NODE_ENV === 'production';
    setAuthCookies(res, result, isProd, user.id);

    return {
      message: 'Authenticated',
      user: result.user,
      requiresBranchSelection: result.requiresBranchSelection,
      availableBranches: result.availableBranches,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('select-branch')
  async selectBranch(
    @GetUser() user: RequestUser,
    @Body() selectBranchDto: SelectBranchDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.selectBranch(
      user.userId!,
      user.tenantId,
      selectBranchDto.branchId,
    );

    if (!result) {
      throw new ForbiddenException('Invalid branch selection');
    }

    const isProd = process.env.NODE_ENV === 'production';
    setAuthCookies(res, result as any, isProd, user.userId);

    return {
      message: 'Branch selected',
      user: (result as any).user,
      requiresBranchSelection: (result as any).requiresBranchSelection,
      availableBranches: (result as any).availableBranches,
    };
  }

  @SkipThrottle({ auth: true, sensitive: true, default: true })
  @Get('me')
  async getMe(@GetUser() user: RequestUser) {
    const res = await this.authService.getMe(user.userId!, user.tenantId);
    if (res && user.branchId !== undefined) {
      return {
        ...res,
        branchId: user.branchId,
      };
    }
    return res;
  }

  @Get('branches')
  async getMyBranches(@GetUser() user: RequestUser) {
    return this.authService.getUserBranches(user.userId!, user.tenantId);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: any) {
    const csrfCookie = req.cookies?.csrf_token;
    const csrfHeader = req.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const refreshToken = req.cookies?.refresh_token;
    const sessionId = req.cookies?.session_id;

    if (!refreshToken || !sessionId) {
      throw new UnauthorizedException('Missing refresh credentials');
    }

    const result = await this.authService.refreshTokens(
      sessionId,
      refreshToken,
    );

    const isProd = process.env.NODE_ENV === 'production';
    setAuthCookies(res, result, isProd);

    return { message: 'Tokens refreshed' };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @GetUser() user: RequestUser,
    @Res({ passthrough: true }) res: any,
  ) {
    await this.authService.logout(user.userId!, user.sessionId!);
    clearAuthCookies(res);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @SkipMfa()
  @UseGuards(MfaChallengeGuard)
  @Post('mfa/setup')
  async mfaSetup(@GetUser() user: any) {
    return this.mfaService.generateSecret(
      user.sub,
      user.email || 'user@hms.local',
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @SkipMfa()
  @UseGuards(MfaChallengeGuard)
  @Post('mfa/verify')
  async mfaVerify(
    @GetUser() user: any,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: any,
    @Body('secret') secret?: string,
  ) {
    if (user.challenge === 'MFA_SETUP') {
      if (!secret)
        throw new BadRequestException('Secret required for initial setup');
      await this.mfaService.enableMfa(user.sub, secret, code);
    }
    const result = await this.authService.verifyMfa(user.sub, user.sid, code);

    const isProd = process.env.NODE_ENV === 'production';
    setAuthCookies(res, result, isProd, user.sub);

    return {
      message: 'MFA verified',
      user: result.user,
      requiresBranchSelection: result.requiresBranchSelection,
      availableBranches: result.availableBranches,
    };
  }

  @Post('mfa/recovery-codes/generate')
  async generateRecoveryCodes(@GetUser() user: RequestUser) {
    const codes = await this.mfaService.generateRecoveryCodes(
      user.userId!,
      user.tenantId,
    );
    return { recoveryCodes: codes };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @SkipMfa()
  @UseGuards(MfaChallengeGuard)
  @Post('mfa/recovery-codes/verify')
  async verifyRecoveryCode(
    @GetUser() user: any,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: any,
  ) {
    if (!code) {
      throw new BadRequestException('Recovery code is required');
    }
    const result = await this.authService.verifyMfaWithRecoveryCode(
      user.sub,
      user.sid,
      code,
      user.tenantId,
    );

    const isProd = process.env.NODE_ENV === 'production';
    setAuthCookies(res, result, isProd, user.sub);

    return {
      message: 'MFA verified via recovery code',
      user: result.user,
      requiresBranchSelection: result.requiresBranchSelection,
      availableBranches: result.availableBranches,
    };
  }
}
