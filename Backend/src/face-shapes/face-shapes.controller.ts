import { Controller, Get } from '@nestjs/common';
import { FaceShapesService } from './face-shapes.service';

@Controller('face-shapes')
export class FaceShapesController {
  constructor(private readonly faceShapesService: FaceShapesService) {}

  /**
   * Endpoint công khai lấy danh sách toàn bộ các dáng khuôn mặt chuẩn hóa
   * GET /api/face-shapes
   * Không yêu cầu JWT token / authentication
   */
  @Get()
  async findAll() {
    return this.faceShapesService.findAll();
  }
}
