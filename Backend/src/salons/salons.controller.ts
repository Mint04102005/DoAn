import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChangeSalonPasswordDto } from './dto/change-salon-password.dto';
import { GetSalonsDto } from './dto/get-salons.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { SalonsService } from './salons.service';

@Controller('salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  /**
   * BE-05.1: API khám phá danh sách Salon
   * GET /api/salons
   * Quyền truy cập: Public
   */
  @Get()
  async findAll(@Query() query: GetSalonsDto) {
    return this.salonsService.findAll(query);
  }

  /**
   * BE-05.3: API lấy thông tin Salon của Chủ Salon đang đăng nhập
   * GET /api/salons/owner/me
   * Quyền truy cập: Chỉ SALON_OWNER (roleId = 3)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @Get('owner/me')
  async getOwnerSalon(@CurrentUser() user: any) {
    return this.salonsService.getOwnerSalon(user.id);
  }

  /**
   * BE-05.4: API cập nhật thông tin Salon và các thẻ thế mạnh dáng mặt
   * PUT /api/salons/owner/me
   * Quyền truy cập: Chỉ SALON_OWNER (roleId = 3)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @Put('owner/me')
  async updateOwnerSalon(
    @CurrentUser() user: any,
    @Body() updateSalonDto: UpdateSalonDto,
  ) {
    return this.salonsService.updateOwnerSalon(user.id, updateSalonDto);
  }

  /**
   * BE-05.5: API đổi mật khẩu cho Chủ Salon
   * PATCH /api/salons/owner/me/password
   * Quyền truy cập: Chỉ SALON_OWNER (roleId = 3)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @HttpCode(HttpStatus.OK)
  @Patch('owner/me/password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changeSalonPasswordDto: ChangeSalonPasswordDto,
  ) {
    return this.salonsService.changePassword(user.id, changeSalonPasswordDto);
  }

  /**
   * BE-05.2: API chi tiết Salon
   * GET /api/salons/:id
   * Quyền truy cập: Public
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID salon phải là số nguyên dương');
    }
    return this.salonsService.findOne(id);
  }
}

