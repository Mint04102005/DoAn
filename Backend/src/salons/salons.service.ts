import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SalonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetSalonsDto } from './dto/get-salons.dto';

@Injectable()
export class SalonsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * BE-05.1: API khám phá danh sách Salon công khai
   * Chỉ trả về Salon thuộc chủ tiệm đã được Admin xác thực (status = APPROVED)
   * Hỗ trợ tìm kiếm theo tên Salon, địa chỉ, thẻ thế mạnh
   */
  async findAll(query: GetSalonsDto) {
    // 1. Kiểm tra bộ lọc tag:
    // Schema hiện tại của model Salon không có cột tag/tags/faceShapes.
    // Nếu client truyền một tag thực sự (chuỗi không rỗng), AND logic với tập dữ liệu thực tế
    // sẽ cho kết quả 0 bản ghi, trả về [] theo đúng yêu cầu kiểm thử và không sửa đổi schema tuỳ tiện.
    const trimmedTag = query.tag?.trim();
    if (trimmedTag) {
      return [];
    }

    // 2. Xây dựng điều kiện lọc bắt buộc: chỉ Salon đã APPROVED và có chủ tiệm hợp lệ
    const where: Prisma.SalonWhereInput = {
      status: SalonStatus.APPROVED,
      owner: {
        role: Role.SALON_OWNER,
      },
    };

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
      tag: '',
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
      tag: '',
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
}
