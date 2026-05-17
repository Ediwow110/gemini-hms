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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SelectBranchDto } from './dto/select-branch.dto';
import { GetUser } from './decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { Public } from '../common/decorators/public.decorator';
import { MfaChallengeGuard } from './guards/mfa-challenge.guard';
import { MfaService } from './mfa.service';
import { SkipMfa } from './decorators/skip-mfa.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @Public()
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
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('select-branch')
  async selectBranch(
    @GetUser() user: RequestUser,
    @Body() selectBranchDto: SelectBranchDto,
  ) {
    const result = await this.authService.selectBranch(
      user.userId!,
      user.tenantId,
      selectBranchDto.branchId,
    );

    if (!result) {
      // Throw 403 if user is not assigned to the branch or branch doesn't exist/is inactive
      throw new ForbiddenException('Invalid branch selection');
    }

    return result;
  }

  @Get('me')
  async getMe(@GetUser() user: RequestUser) {
    return this.authService.getMe(user.userId!, user.tenantId);
  }

  @Get('branches')
  async getMyBranches(@GetUser() user: RequestUser) {
    return this.authService.getUserBranches(user.userId!, user.tenantId);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Body('sessionId') sessionId: string,
    @Body('userId') userId: string,
  ) {
    return this.authService.refreshTokens(userId, sessionId, refreshToken);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@GetUser() user: RequestUser) {
    return this.authService.logout(user.userId!, user.sessionId!);
  }

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

  @HttpCode(HttpStatus.OK)
  @SkipMfa()
  @UseGuards(MfaChallengeGuard)
  @Post('mfa/verify')
  async mfaVerify(
    @GetUser() user: any,
    @Body('code') code: string,
    @Body('secret') secret?: string,
  ) {
    if (user.challenge === 'MFA_SETUP') {
      if (!secret)
        throw new BadRequestException('Secret required for initial setup');
      await this.mfaService.enableMfa(user.sub, secret, code);
    }
    return this.authService.verifyMfa(user.sub, user.sid, code);
  }

  @Post('mfa/recovery-codes/generate')
  async generateRecoveryCodes(@GetUser() user: RequestUser) {
    const codes = await this.mfaService.generateRecoveryCodes(
      user.userId!,
      user.tenantId,
    );
    return { recoveryCodes: codes };
  }

  @HttpCode(HttpStatus.OK)
  @SkipMfa()
  @UseGuards(MfaChallengeGuard)
  @Post('mfa/recovery-codes/verify')
  async verifyRecoveryCode(@GetUser() user: any, @Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Recovery code is required');
    }
    return this.authService.verifyMfaWithRecoveryCode(
      user.sub,
      user.sid,
      code,
      user.tenantId,
    );
  }
}
