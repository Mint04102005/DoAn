import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, Role, SalonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetMyBookingsDto } from './dto/get-my-bookings.dto';
import { GetSalonAvailabilityDto } from './dto/get-salon-availability.dto';
import { GetSalonBookingsDto } from './dto/get-salon-bookings.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper ánh xạ status từ Enum sang mã chữ cái (P, C, D, X) và ngược lại
   */
  private readonly statusMapToCode: Record<string, string> = {
    PENDING: 'P',
    CONFIRMED: 'C',
    COMPLETED: 'D',
    CANCELLED: 'X',
  };

  private readonly statusCodeToEnum: Record<string, BookingStatus> = {
    P: BookingStatus.PENDING,
    C: BookingStatus.CONFIRMED,
    D: BookingStatus.COMPLETED,
    X: BookingStatus.CANCELLED,
    PENDING: BookingStatus.PENDING,
    CONFIRMED: BookingStatus.CONFIRMED,
    COMPLETED: BookingStatus.COMPLETED,
    CANCELLED: BookingStatus.CANCELLED,
  };

  /**
   * Helper chuyển đổi ngày theo múi giờ nghiệp vụ Việt Nam (Asia/HaNoi - UTC+7)
   */
  private parseVietnamDateRange(dateStr: string): { startUtc: Date; endUtc: Date } {
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      throw new BadRequestException('Định dạng ngày không hợp lệ, yêu cầu YYYY-MM-DD');
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Kiểm tra tính hợp lệ của ngày theo lịch
    const checkDate = new Date(year, month - 1, day);
    if (
      checkDate.getFullYear() !== year ||
      checkDate.getMonth() !== month - 1 ||
      checkDate.getDate() !== day
    ) {
      throw new BadRequestException(`Ngày ${dateStr} không tồn tại trên lịch`);
    }

    // Thời điểm bắt đầu ngày theo giờ Việt Nam (UTC+7)
    const startUtc = new Date(`${dateStr}T00:00:00.000+07:00`);
    if (isNaN(startUtc.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    // Thời điểm kết thúc ngày (bắt đầu ngày tiếp theo 24h sau)
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

    return { startUtc, endUtc };
  }

  /**
   * Định dạng dữ liệu Booking chuẩn hóa cho cả Backend và Frontend
   */
  private formatBooking(booking: any) {
    const statusCode = this.statusMapToCode[booking.status] || booking.status;
    const timeIso = booking.bookingTime
      ? new Date(booking.bookingTime).toISOString()
      : '';
    const localIso = timeIso ? new Date(new Date(timeIso).getTime() + 7 * 3600000).toISOString() : '';
    const dateStr = localIso ? localIso.split('T')[0] : '';
    const timeStr =
      localIso && localIso.includes('T')
        ? localIso.split('T')[1].substring(0, 5)
        : '09:00';

    return {
      id: booking.id,
      booking_id: booking.id,
      userId: booking.userId,
      user_id: booking.userId,
      salonId: booking.salonId,
      salon_id: booking.salonId,
      bookingDate: booking.bookingTime,
      bookingTime: booking.bookingTime,
      booking_date: timeIso,
      booking_time: timeStr,
      status: statusCode,
      statusCode: statusCode,
      statusEnum: booking.status,
      notes: booking.notes || '',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      salon: booking.salon
        ? {
            id: booking.salon.id,
            salon_id: booking.salon.id,
            name: booking.salon.name,
            salonname: booking.salon.name,
            address: booking.salon.address,
            phone: booking.salon.phone,
            rating: booking.salon.rating,
            images: booking.salon.images || [],
            image_url:
              booking.salon.images && booking.salon.images.length > 0
                ? booking.salon.images[0]
                : '',
            tag: booking.salon.tag || '',
            description: booking.salon.description || '',
            ownerId: booking.salon.ownerId,
            owner_id: booking.salon.ownerId,
          }
        : undefined,
      user: booking.user
        ? {
            id: booking.user.id,
            user_id: booking.user.id,
            name: booking.user.name,
            fullname: booking.user.name,
            phone: booking.user.phone,
            email: booking.user.email,
            gender: booking.user.gender,
            avatarUrl: booking.user.avatarUrl,
            avatar_url: booking.user.avatarUrl,
          }
        : undefined,
    };
  }

  /**
   * BE-07.1: API Tạo đơn đặt lịch hẹn làm tóc mới
   * POST /api/bookings
   * Quyền truy cập: Khách hàng (User - roleId = 2)
   */
  async create(userId: number, dto: CreateBookingDto) {
    const targetSalonId = dto.salonId ?? dto.salon_id;
    if (!targetSalonId) {
      throw new BadRequestException('Vui lòng chọn salon cần đặt lịch (salonId)');
    }

    const dateStr = dto.bookingDate ?? dto.booking_date;
    if (!dateStr) {
      throw new BadRequestException(
        'Vui lòng cung cấp ngày giờ đặt lịch (bookingDate)',
      );
    }

    const scheduledDate = new Date(dateStr);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException(
        'Ngày giờ đặt lịch không hợp lệ, vui lòng dùng định dạng chuẩn ISO 8601',
      );
    }

    // 1. Kiểm tra thời gian hẹn: Bắt buộc bookingDate phải lớn hơn thời điểm hiện tại
    const now = new Date();
    if (scheduledDate <= now) {
      throw new BadRequestException(
        'Thời gian hẹn làm tóc phải lớn hơn thời điểm hiện tại',
      );
    }

    // 2. Kiểm tra salonId tồn tại và thuộc salon đã được phê duyệt hoạt động (APPROVED)
    const salon = await this.prisma.salon.findUnique({
      where: { id: targetSalonId },
      include: { owner: { select: { isLocked: true, role: true } } },
    });

    if (!salon || salon.status !== SalonStatus.APPROVED || salon.owner.isLocked || salon.owner.role !== Role.SALON_OWNER) {
      throw new NotFoundException(
        'Salon không tồn tại hoặc chưa được kích hoạt hoạt động',
      );
    }

    // 3. Insert bản ghi mới vào bảng Booking với status mặc định là Chờ duyệt ('P' / PENDING)
    const newBooking = await this.prisma.booking.create({
      data: {
        userId,
        salonId: targetSalonId,
        bookingTime: scheduledDate,
        status: BookingStatus.PENDING,
        notes: dto.notes.trim(),
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            rating: true,
            images: true,
            tag: true,
            description: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Đặt lịch hẹn làm tóc thành công',
      data: this.formatBooking(newBooking),
      ...this.formatBooking(newBooking),
    };
  }

  /**
   * BE-07.2: API Khách hàng xem danh sách lịch hẹn cá nhân
   * GET /api/bookings/my-bookings
   * Quyền truy cập: Người dùng đã đăng nhập (JwtAuthGuard)
   */
  async findMyBookings(userId: number, query: GetMyBookingsDto) {
    const where: Prisma.BookingWhereInput = {
      userId,
    };

    // Lọc theo trạng thái nếu có
    if (query.status) {
      const normalizedStatus = query.status.toUpperCase();
      const statusEnum = this.statusCodeToEnum[normalizedStatus];
      if (statusEnum) {
        where.status = statusEnum;
      }
    }

    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ bookingTime: 'desc' }, { createdAt: 'desc' }],
        include: {
          salon: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              rating: true,
              images: true,
              tag: true,
              description: true,
              ownerId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              gender: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    const formattedList = bookings.map((b) => this.formatBooking(b));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: formattedList,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * BE-07.3: API Xem chi tiết một đơn đặt lịch hẹn
   * GET /api/bookings/:id
   * Quyền truy cập: User sở hữu đơn đặt, Chủ salon nhận đơn hoặc Admin
   */
  async findOne(bookingId: number, currentUser: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            rating: true,
            images: true,
            tag: true,
            description: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt lịch hẹn');
    }

    // Kiểm tra quyền truy cập (Authorization):
    // Chỉ cho phép Khách hàng sở hữu đơn, Chủ Salon nhận đơn hoặc Quản trị viên (Admin)
    const isCustomerOwner = booking.userId === currentUser.id;
    const isSalonOwner = booking.salon.ownerId === currentUser.id;
    const isAdmin = currentUser.role === Role.ADMIN;

    if (!isCustomerOwner && !isSalonOwner && !isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin đơn đặt lịch này',
      );
    }

    return this.formatBooking(booking);
  }

  /**
   * BE-07.4: API Khách hàng chủ động hủy lịch hẹn
   * PATCH /api/bookings/:id/cancel
   * Quyền truy cập: Chỉ Khách hàng (User - roleId = 2) sở hữu đơn
   */
  async cancel(bookingId: number, currentUser: any) {
    // 1. Tìm đơn booking trong database
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đơn đặt lịch hẹn');
    }

    // 2. Kiểm tra quyền sở hữu đơn đặt lịch
    if (booking.userId !== currentUser.id) {
      throw new ForbiddenException(
        'Bạn không có quyền hủy lịch hẹn của người khác',
      );
    }

    // 3. Kiểm tra trạng thái hiện tại (chỉ PENDING hoặc CONFIRMED được hủy)
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Lịch hẹn đã hoàn thành, không thể thực hiện hủy',
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Lịch hẹn này đã được hủy trước đó');
    }

    // 4. Kiểm tra thời gian còn lại trước giờ hẹn (bắt buộc trước giờ hẹn ít nhất 2 tiếng)
    const now = new Date();
    const scheduledTime = new Date(booking.bookingTime);
    const remainingMs = scheduledTime.getTime() - now.getTime();
    const minimumCancellationMs = 2 * 60 * 60 * 1000; // 2 tiếng

    if (remainingMs <= 0) {
      throw new BadRequestException(
        'Không thể hủy lịch hẹn đã qua thời gian hẹn',
      );
    }

    if (remainingMs < minimumCancellationMs) {
      throw new BadRequestException(
        'Chỉ có thể hủy lịch hẹn trước giờ hẹn ít nhất 2 tiếng.',
      );
    }

    // 5. Cập nhật an toàn với điều kiện concurrency (đảm bảo vẫn ở trạng thái P hoặc C khi update)
    const updateResult = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        userId: currentUser.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException(
        'Lịch hẹn đã được cập nhật trạng thái khác trước đó, không thể hủy',
      );
    }

    // 6. Truy vấn bản ghi đã cập nhật kèm thông tin Salon để trả về
    const refreshed = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            rating: true,
            images: true,
            tag: true,
            description: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Hủy lịch hẹn thành công',
      data: this.formatBooking(refreshed),
      ...this.formatBooking(refreshed),
    };
  }

  /**
   * BE-07.5: API kiểm tra khung giờ khả dụng của Salon
   * GET /api/bookings/salon/:salonId/availability?date=YYYY-MM-DD
   */
  async getSalonAvailability(salonId: number, query: GetSalonAvailabilityDto) {
    // 1. Kiểm tra salon tồn tại
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException('Không tìm thấy thông tin Salon');
    }

    // 2. Chuyển đổi ngày theo múi giờ nghiệp vụ Việt Nam (Asia/HaNoi - UTC+7)
    const { startUtc, endUtc } = this.parseVietnamDateRange(query.date);

    // 3. Truy vấn các booking bận (trạng thái PENDING hoặc CONFIRMED)
    const busyBookings = await this.prisma.booking.findMany({
      where: {
        salonId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        bookingTime: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      select: {
        id: true,
        bookingTime: true,
        status: true,
      },
      orderBy: {
        bookingTime: 'asc',
      },
    });

    // 4. Định dạng danh sách bookedSlots
    const bookedSlots = busyBookings.map((b) => {
      const statusCode = this.statusMapToCode[b.status] || b.status;
      const timeIso = new Date(b.bookingTime).toISOString();
      const localIso = new Date(new Date(timeIso).getTime() + 7 * 3600000).toISOString();
      const timeStr =
        localIso && localIso.includes('T')
          ? localIso.split('T')[1].substring(0, 5)
          : '09:00';

      return {
        id: b.id,
        bookingId: b.id,
        bookingDate: timeIso,
        bookingTime: timeIso,
        time: timeStr,
        status: statusCode,
        statusEnum: b.status,
      };
    });

    return {
      salonId,
      date: query.date,
      bookedSlots,
    };
  }

  /**
   * BE-07.6: API Chủ Salon quản lý danh sách lịch hẹn
   * GET /api/bookings/salon
   * Quyền truy cập: Chỉ Chủ Salon (roleId = 3)
   */
  async findSalonBookings(ownerId: number, query: GetSalonBookingsDto) {
    // 1. Xác định Salon thuộc quyền sở hữu của Chủ Salon đang đăng nhập
    const salon = await this.prisma.salon.findFirst({
      where: { ownerId },
    });

    if (!salon) {
      throw new NotFoundException(
        'Không tìm thấy thông tin Salon thuộc quyền quản lý của bạn',
      );
    }

    // 2. Xây dựng điều kiện lọc theo salonId
    const where: Prisma.BookingWhereInput = {
      salonId: salon.id,
    };

    // Áp dụng bộ lọc status nếu có
    if (query.status) {
      const normalizedStatus = query.status.toUpperCase();
      const statusEnum = this.statusCodeToEnum[normalizedStatus];
      if (statusEnum) {
        where.status = statusEnum;
      }
    }

    // Áp dụng bộ lọc date theo múi giờ Việt Nam
    if (query.date) {
      const { startUtc, endUtc } = this.parseVietnamDateRange(query.date);
      where.bookingTime = {
        gte: startUtc,
        lt: endUtc,
      };
    }

    // 3. Phân trang
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    // 4. Truy vấn song song dữ liệu và tổng số bản ghi
    const [total, bookings, statusGroups] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        // Sắp xếp thời gian hẹn tăng dần để tiện theo dõi các lịch sắp diễn ra
        orderBy: [{ bookingTime: 'asc' }, { createdAt: 'asc' }],
        include: {
          salon: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              rating: true,
              images: true,
              tag: true,
              description: true,
              ownerId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              gender: true,
              avatarUrl: true,
            },
          },
        },
      }),
      // Thống kê số lượng từng trạng thái phục vụ hiển thị Tabs Dashboard M8
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { salonId: salon.id },
        _count: { id: true },
      }),
    ]);

    // 5. Tính toán counts cho Tabs Dashboard
    const counts = {
      all: 0,
      p: 0,
      c: 0,
      d: 0,
      x: 0,
    };

    for (const group of statusGroups) {
      const count = group._count.id;
      counts.all += count;
      if (group.status === BookingStatus.PENDING) counts.p = count;
      if (group.status === BookingStatus.CONFIRMED) counts.c = count;
      if (group.status === BookingStatus.COMPLETED) counts.d = count;
      if (group.status === BookingStatus.CANCELLED) counts.x = count;
    }

    const formattedData = bookings.map((b) => this.formatBooking(b));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      total,
      page,
      limit,
      totalPages,
      counts,
    };
  }

  /**
   * Cập nhật trạng thái lịch hẹn dành cho Chủ Salon (Role.SALON_OWNER) hoặc Admin
   * PATCH /api/bookings/:id/status
   */
  async updateStatus(id: number, user: any, newStatusRaw: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        salon: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt lịch với ID ${id}`);
    }

    // Kiểm tra quyền sở hữu Salon: Phải là Chủ Salon nhận đơn hoặc Admin
    const isOwner =
      booking.salon.ownerId === user.id ||
      booking.salon.owner?.id === user.id;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền quản lý lịch hẹn của salon khác');
    }

    const targetEnum = this.statusCodeToEnum[newStatusRaw.toUpperCase()];
    if (!targetEnum) {
      throw new BadRequestException('Trạng thái mới không hợp lệ');
    }

    // Nghiệp vụ trạng thái: Đã hoàn thành hoặc đã hủy thì không được sửa
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Lịch hẹn đã hoàn thành, không thể thay đổi trạng thái');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Lịch hẹn đã bị hủy, không thể thay đổi trạng thái');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: targetEnum },
    });

    return {
      message: 'Cập nhật trạng thái lịch hẹn thành công',
      data: {
        id: updated.id,
        userId: updated.userId,
        salonId: updated.salonId,
        bookingDate: updated.bookingTime,
        status: this.statusMapToCode[updated.status] || updated.status,
        notes: updated.notes,
      },
    };
  }
}

