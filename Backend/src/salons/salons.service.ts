import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, SalonStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeSalonPasswordDto } from './dto/change-salon-password.dto';
import { GetSalonsDto } from './dto/get-salons.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';

@Injectable()
export class SalonsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * BE-05.1: API khám phá danh sách Salon công khai
   * Chỉ trả về Salon thuộc chủ tiệm đã được Admin xác thực (status = APPROVED)
   * Hỗ trợ tìm kiếm theo tên Salon, địa chỉ, thẻ thế mạnh
   */
  async findAll(query: GetSalonsDto) {
    // 1. Xây dựng điều kiện lọc bắt buộc: chỉ Salon đã APPROVED và có chủ tiệm hợp lệ
    const where: Prisma.SalonWhereInput = {
      status: SalonStatus.APPROVED,
      owner: {
        role: Role.SALON_OWNER,
      },
    };

    // 2. Lọc theo tag (thế mạnh dáng mặt)
    const trimmedTag = query.tag?.trim();
    if (trimmedTag) {
      where.tag = {
        contains: trimmedTag,
        mode: 'insensitive',
      };
    }

    // 3. Lọc theo tên Salon (search)
    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      where.name = {
        contains: trimmedSearch,
        mode: 'insensitive',
      };
    }

    // 4. Lọc theo địa chỉ (address)
    const trimmedAddress = query.address?.trim();
    if (trimmedAddress) {
      where.address = {
        contains: trimmedAddress,
        mode: 'insensitive',
      };
    }

    // 5. Phân trang nếu có truyền
    const take = query.limit && query.limit > 0 ? Number(query.limit) : undefined;
    const skip =
      query.page && query.page > 0 && take ? (Number(query.page) - 1) * take : undefined;

    // 6. Truy vấn danh sách Salon thỏa mãn điều kiện
    const salons = await this.prisma.salon.findMany({
      where,
      skip,
      take,
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        operatingHours: true,
        images: true,
        rating: true,
        status: true,
        tag: true,
        description: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 7. Định dạng response công khai an toàn, bổ sung các trường tương thích Frontend
    return salons.map((salon) => ({
      id: salon.id,
      salon_id: salon.id,
      name: salon.name,
      salonname: salon.name,
      address: salon.address,
      phone: salon.phone,
      operatingHours: salon.operatingHours,
      images: salon.images,
      image_url: salon.images?.[0] || '',
      rating: salon.rating,
      status: salon.status,
      tag: salon.tag || '',
      tags: salon.tag ? salon.tag.split(',').map((t) => t.trim()).filter(Boolean) : [],
      description: salon.description || '',
      createdAt: salon.createdAt,
      owner: salon.owner,
    }));
  }

  /**
   * BE-05.2: API chi tiết Salon công khai
   * Chỉ hiển thị khi Salon có status = APPROVED và chủ tiệm hợp lệ
   */
  async findOne(id: number) {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        operatingHours: true,
        images: true,
        rating: true,
        status: true,
        tag: true,
        description: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Salon không tồn tại hoặc chưa được Admin phê duyệt hoặc không có chủ tiệm hợp lệ
    if (!salon || salon.status !== SalonStatus.APPROVED || !salon.owner) {
      throw new NotFoundException('Salon không tồn tại hoặc chưa được công khai');
    }

    return {
      id: salon.id,
      salon_id: salon.id,
      name: salon.name,
      salonname: salon.name,
      address: salon.address,
      phone: salon.phone,
      operatingHours: salon.operatingHours,
      images: salon.images,
      image_url: salon.images?.[0] || '',
      rating: salon.rating,
      status: salon.status,
      tag: salon.tag || '',
      tags: salon.tag ? salon.tag.split(',').map((t) => t.trim()).filter(Boolean) : [],
      description: salon.description || '',
      createdAt: salon.createdAt,
      owner: {
        id: salon.owner.id,
        name: salon.owner.name,
        phone: salon.owner.phone,
        email: salon.owner.email,
        avatarUrl: salon.owner.avatarUrl,
      },
    };
  }

  /**
   * BE-05.3: API lấy thông tin Salon của Chủ Salon đang đăng nhập
   */
  async getOwnerSalon(ownerId: number) {
    const salon = await this.prisma.salon.findFirst({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        operatingHours: true,
        images: true,
        rating: true,
        status: true,
        tag: true,
        description: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (!salon) {
      throw new NotFoundException('Không tìm thấy thông tin Salon của tài khoản này');
    }

    return {
      id: salon.id,
      salon_id: salon.id,
      name: salon.name,
      salonname: salon.name,
      address: salon.address,
      phone: salon.phone,
      operatingHours: salon.operatingHours,
      images: salon.images,
      image_url: salon.images?.[0] || '',
      rating: salon.rating,
      status: salon.status,
      tag: salon.tag || '',
      tags: salon.tag ? salon.tag.split(',').map((t) => t.trim()).filter(Boolean) : [],
      description: salon.description || '',
      createdAt: salon.createdAt,
      owner: {
        id: salon.owner.id,
        name: salon.owner.name,
        phone: salon.owner.phone,
        email: salon.owner.email,
        avatarUrl: salon.owner.avatarUrl,
      },
    };
  }

  /**
   * BE-05.4: API cập nhật thông tin Salon và các thẻ thế mạnh dáng mặt
   */
  async updateOwnerSalon(ownerId: number, dto: UpdateSalonDto) {
    const salon = await this.prisma.salon.findFirst({
      where: { ownerId },
    });

    if (!salon) {
      throw new NotFoundException('Không tìm thấy thông tin Salon của tài khoản này');
    }

    const updateData: Prisma.SalonUpdateInput = {};

    // 1. Tên Salon
    const rawName = dto.salonname !== undefined ? dto.salonname : dto.name;
    if (rawName !== undefined) {
      const trimmedName = rawName.trim();
      if (!trimmedName) {
        throw new BadRequestException('Tên Salon không được để trống');
      }
      updateData.name = trimmedName;
    }

    // 2. Địa chỉ
    if (dto.address !== undefined) {
      const trimmedAddress = dto.address.trim();
      if (!trimmedAddress) {
        throw new BadRequestException('Địa chỉ Salon không được để trống');
      }
      updateData.address = trimmedAddress;
    }

    // 3. Tag thế mạnh dáng mặt
    const rawTag = dto.tag !== undefined ? dto.tag : dto.tags;
    if (rawTag !== undefined) {
      let formattedTag = '';
      if (Array.isArray(rawTag)) {
        formattedTag = rawTag.map((t) => String(t).trim()).filter(Boolean).join(', ');
      } else if (typeof rawTag === 'string') {
        formattedTag = rawTag.split(',').map((t) => t.trim()).filter(Boolean).join(', ');
      }
      updateData.tag = formattedTag;
    }

    // 4. Mô tả
    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }

    // 5. Ảnh đại diện nếu có
    if (dto.image_url !== undefined && dto.image_url.trim()) {
      updateData.images = [dto.image_url.trim()];
    }

    const updated = await this.prisma.salon.update({
      where: { id: salon.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        operatingHours: true,
        images: true,
        rating: true,
        status: true,
        tag: true,
        description: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      salon_id: updated.id,
      name: updated.name,
      salonname: updated.name,
      address: updated.address,
      phone: updated.phone,
      operatingHours: updated.operatingHours,
      images: updated.images,
      image_url: updated.images?.[0] || '',
      rating: updated.rating,
      status: updated.status,
      tag: updated.tag || '',
      tags: updated.tag ? updated.tag.split(',').map((t) => t.trim()).filter(Boolean) : [],
      description: updated.description || '',
      createdAt: updated.createdAt,
      owner: {
        id: updated.owner.id,
        name: updated.owner.name,
        phone: updated.owner.phone,
        email: updated.owner.email,
        avatarUrl: updated.owner.avatarUrl,
      },
    };
  }

  /**
   * BE-05.5: API đổi mật khẩu cho Chủ Salon
   * PATCH /api/salons/owner/me/password
   * Quyền truy cập: Chỉ SALON_OWNER (roleId = 3)
   */
  async changePassword(userId: number, dto: ChangeSalonPasswordDto) {
    // 1. Kiểm tra xác nhận mật khẩu mới phải khớp
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không trùng khớp');
    }

    // 2. Tìm tài khoản người dùng đang đăng nhập
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    // 3. Kiểm tra mật khẩu hiện tại bằng bcrypt
    const isCurrentMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // 4. Kiểm tra mật khẩu mới không được trùng với mật khẩu hiện tại
    const isSameAsCurrent = await bcrypt.compare(dto.newPassword, user.password);
    if (isSameAsCurrent) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    // 5. Băm mật khẩu mới bằng bcrypt trước khi lưu database
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // 6. Cập nhật mật khẩu trong database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // 7. Trả về thông báo thành công (không để lộ mật khẩu cũ, mới hay password hash)
    return {
      message: 'Đổi mật khẩu thành công',
    };
  }
}

