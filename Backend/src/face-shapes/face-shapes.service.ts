import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaceShapesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh mục các dáng khuôn mặt được chuẩn hóa trong hệ thống
   * GET /api/face-shapes
   */
  async findAll() {
    return this.prisma.faceShape.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }
}
