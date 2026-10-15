import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role, SalonStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản mới (Chỉ cho phép USER hoặc SALON_OWNER)
   */
  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Kiểm tra email đã tồn tại hay chưa
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email đã được đăng ký');
    }

    // 2. Băm mật khẩu
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const assignedRole = (dto.role as Role) || Role.USER;

    try {
      // 3. Thực thi transaction tạo User và Salon (nếu là SALON_OWNER)
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: passwordHash,
            name: dto.name.trim(),
            phone: dto.phone?.trim() || null,
            avatarUrl: dto.avatarUrl?.trim() || null,
            role: assignedRole,
          },
        });

        let salonId: number | undefined = undefined;

        if (assignedRole === Role.SALON_OWNER) {
          const salonName = dto.salonName?.trim() || `${user.name}'s Salon`;
          const salonAddress = dto.salonAddress?.trim() || 'Chưa cập nhật địa chỉ';
          const salonPhone = dto.salonPhone?.trim() || dto.phone?.trim() || 'Chưa cập nhật SĐT';

          const salon = await tx.salon.create({
            data: {
              ownerId: user.id,
              name: salonName,
              address: salonAddress,
              phone: salonPhone,
              status: SalonStatus.PENDING,
            },
          });
          salonId = salon.id;
        }

        return { user, salonId };
      });

      // 4. Ký JWT Access Token (hạn 7 ngày)
      const accessToken = await this.generateToken(
        result.user.id,
        result.user.email,
        result.user.role,
      );

      return {
        message: 'Đăng ký tài khoản thành công',
        accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phone: result.user.phone,
          avatarUrl: result.user.avatarUrl,
          role: result.user.role,
          salonId: result.salonId,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi xảy ra trong quá trình tạo tài khoản');
    }
  }

  /**
   * Đăng nhập dùng chung cho cả 3 vai trò (USER, SALON_OWNER, ADMIN)
   */
  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        salons: {
          select: { id: true, name: true, status: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const salonId = user.salons?.[0]?.id || undefined;
    const accessToken = await this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        dob: user.dob,
        address: user.address,
        role: user.role,
        salonId,
      },
    };
  }

  /**
   * Lấy thông tin tài khoản hiện tại từ JWT token
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
          select: { id: true, name: true, status: true, address: true, phone: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không còn tồn tại trên hệ thống');
    }

    const salonId = user.salons?.[0]?.id || undefined;

    return {
      user: {
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
        salon: user.salons?.[0] || null,
      },
    };
  }

  /**
   * Ký JWT Access Token (hạn 7 ngày)
   */
  private async generateToken(userId: number, email: string, role: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.signAsync(payload);
  }
}
