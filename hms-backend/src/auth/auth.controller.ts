import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
}
