import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetHairstylesDto } from './dto/get-hairstyles.dto';

@Injectable()
export class HairstylesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách mẫu tóc công khai có phân trang, lọc theo giới tính và tìm kiếm theo tên
   */
  async findAll(query: GetHairstylesDto) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.HairstyleWhereInput = {};

    // 1. Lọc theo giới tính nếu có
    if (query.gender) {
      where.gender = query.gender;
    }

    // 2. Tìm kiếm theo tên kiểu tóc (không phân biệt chữ hoa, chữ thường và bỏ qua khoảng trắng thừa)
    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      where.name = {
        contains: trimmedSearch,
        mode: 'insensitive',
      };
    }

    // 3. Thực thi song song truy vấn đếm và truy vấn lấy dữ liệu với cùng điều kiện lọc
    const [total, data] = await Promise.all([
      this.prisma.hairstyle.count({ where }),
      this.prisma.hairstyle.findMany({
        where,
        skip,
        take,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          description: true,
          gender: true,
          faceShapes: true,
          hairType: true,
          imageUrl: true,
          tags: true,
          createdAt: true,
        },
      }),
    ]);

    // 4. Tính toán số trang
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Lấy chi tiết một kiểu tóc theo ID cùng danh sách dáng mặt phù hợp (HairFace & FaceShape)
   * GET /api/hairstyles/:id
   */
  async findOne(id: number) {
    const hairstyle = await this.prisma.hairstyle.findUnique({
      where: { id },
      include: {
        hairFace: {
          include: {
            faceShape: true,
          },
          orderBy: {
            suitabilityScore: 'desc',
          },
        },
      },
    });

    if (!hairstyle) {
      throw new NotFoundException('Hairstyle not found');
    }

    return hairstyle;
  }

  /**
   * Lọc danh sách kiểu tóc phù hợp với một dáng khuôn mặt, sắp xếp theo suitabilityScore giảm dần
   * GET /api/hairstyles/by-face-shape/:shapeId
   */
  async findByFaceShape(shapeId: number) {
    // 1. Kiểm tra dáng khuôn mặt có tồn tại hay không
    const faceShape = await this.prisma.faceShape.findUnique({
      where: { id: shapeId },
    });

    if (!faceShape) {
      throw new NotFoundException('Face shape not found');
    }

    // 2. Lấy danh sách liên kết HairFace kèm thông tin Hairstyle tương ứng, sắp xếp theo suitabilityScore giảm dần
    return this.prisma.hairFace.findMany({
      where: {
        faceShapeId: shapeId,
      },
      orderBy: {
        suitabilityScore: 'desc',
      },
      include: {
        hairstyle: true,
      },
    });
  }
}
