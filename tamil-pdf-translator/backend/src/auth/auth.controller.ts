import { Controller, Post, Body, HttpCode, HttpStatus, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Controller('auth')
export class AuthController implements OnModuleInit {
  constructor(private authService: AuthService) {}

  async onModuleInit() {
    // Initialize demo user when the module starts
    await this.authService.initializeDemoUser();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }
}
