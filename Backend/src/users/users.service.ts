import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thông tin chi tiết tài khoản hiện tại qua token
   */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        gender: true,
        dob: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        salons: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            status: true,
            rating: true,
            operatingHours: true,
            images: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại trên hệ thống');
    }

    const salonId = user.salons?.[0]?.id || undefined;
    const salon = user.salons?.[0] || null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      dob: user.dob,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      salonId,
      salon,
    };
  }

  /**
   * Cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar, Giới tính, Ngày sinh, Địa chỉ)
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại trên hệ thống');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() : undefined,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl.trim() : undefined,
        gender: dto.gender !== undefined ? dto.gender.trim() : undefined,
        dob: dto.dob !== undefined ? dto.dob.trim() : undefined,
        address: dto.address !== undefined ? dto.address.trim() : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        gender: true,
        dob: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        salons: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            status: true,
            rating: true,
          },
          take: 1,
        },
      },
    });

    const salonId = updatedUser.salons?.[0]?.id || undefined;
    const salon = updatedUser.salons?.[0] || null;

    return {
      message: 'Cập nhật thông tin cá nhân thành công',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        gender: updatedUser.gender,
        dob: updatedUser.dob,
        address: updatedUser.address,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        salonId,
        salon,
      },
    };
  }

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại trên hệ thống');
    }

    // So khớp mật khẩu hiện tại
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // Băm mật khẩu mới và lưu vào cơ sở dữ liệu
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'Đổi mật khẩu tài khoản thành công',
    };
  }
}
