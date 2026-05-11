import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SelectBranchDto } from './dto/select-branch.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.tenantCode,
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      // Per blueprint: "Do not reveal account existence" and return 401
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create Audit Log (LOGIN_SUCCESS) via a dedicated service in a real app
    // For now, return the JWT
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('branches')
  async getMyBranches(@GetUser() user: RequestUser) {
    return this.authService.getUserBranches(user.userId!, user.tenantId);
  }
}
