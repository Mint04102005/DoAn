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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetMyBookingsDto } from './dto/get-my-bookings.dto';
import { GetSalonAvailabilityDto } from './dto/get-salon-availability.dto';
import { GetSalonBookingsDto } from './dto/get-salon-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * BE-07.1: API Tạo đơn đặt lịch hẹn làm tóc mới
   * POST /api/bookings
   * Quyền truy cập: Chỉ Khách hàng (User - roleId = 2)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  /**
   * BE-07.2: API Khách hàng xem danh sách lịch hẹn cá nhân
   * GET /api/bookings/my-bookings
   * Quyền truy cập: Người dùng đã đăng nhập (JwtAuthGuard)
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  async findMyBookings(
    @CurrentUser() user: any,
    @Query() query: GetMyBookingsDto,
  ) {
    return this.bookingsService.findMyBookings(user.id, query);
  }

  /**
   * BE-07.6: API Chủ Salon quản lý danh sách lịch hẹn tại Dashboard M8
   * GET /api/bookings/salon
   * Quyền truy cập: Chỉ Chủ Salon (roleId = 3)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @Get('salon')
  async findSalonBookings(
    @CurrentUser() user: any,
    @Query() query: GetSalonBookingsDto,
  ) {
    return this.bookingsService.findSalonBookings(user.id, query);
  }

  /**
   * BE-07.5: API kiểm tra khung giờ khả dụng của Salon
   * GET /api/bookings/salon/:salonId/availability?date=YYYY-MM-DD
   * Quyền truy cập: Public / Authenticated khách hàng đặt lịch
   */
  @Get('salon/:salonId/availability')
  async getSalonAvailability(
    @Param('salonId', ParseIntPipe) salonId: number,
    @Query() query: GetSalonAvailabilityDto,
  ) {
    if (salonId <= 0) {
      throw new BadRequestException('ID salon phải là số nguyên dương');
    }
    return this.bookingsService.getSalonAvailability(salonId, query);
  }

  /**
   * BE-07.4: API khách hàng chủ động hủy lịch hẹn
   * PATCH /api/bookings/:id/cancel
   * Quyền truy cập: Chỉ Khách hàng (User - roleId = 2) sở hữu đơn
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID đơn đặt lịch phải là số nguyên dương');
    }
    return this.bookingsService.cancel(id, user);
  }

  /**
   * API Chủ Salon / Admin cập nhật trạng thái lịch hẹn
   * PATCH /api/bookings/:id/status
   * Quyền truy cập: Chỉ Chủ Salon (roleId = 3) sở hữu tiệm hoặc Admin
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER, Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID đơn đặt lịch phải là số nguyên dương');
    }
    return this.bookingsService.updateStatus(id, user, dto.status);
  }

  /**
   * BE-07.3: API Xem chi tiết một đơn đặt lịch hẹn
   * GET /api/bookings/:id
   * Quyền truy cập: Khách hàng đã đặt hoặc Chủ Salon nhận đơn hoặc Admin
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    if (id <= 0) {
      throw new BadRequestException('ID đơn đặt lịch phải là số nguyên dương');
    }
    return this.bookingsService.findOne(id, user);
  }
}
