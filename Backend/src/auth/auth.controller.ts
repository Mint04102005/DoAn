import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint đăng ký tài khoản mới (mặc định role USER, hoặc SALON_OWNER)
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Endpoint đăng nhập nhận JWT token
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Lấy thông tin tài khoản hiện tại từ JWT token
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return {
      user,
    };
  }

  /**
   * Endpoint mẫu bảo vệ theo quyền ADMIN
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/dashboard')
  getAdminDashboard(@CurrentUser() user: any) {
    return {
      message: 'Chào mừng Quản trị viên đến hệ thống kiểm toán',
      admin: user,
    };
  }

  /**
   * Endpoint mẫu bảo vệ theo quyền SALON_OWNER
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER, Role.ADMIN)
  @Get('salon/management')
  getSalonManagement(@CurrentUser() user: any) {
    return {
      message: 'Khu vực quản lý salon dành cho đối tác',
      owner: user,
    };
  }
}
