import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { GetHairstylesDto } from './dto/get-hairstyles.dto';
import { HairstylesService } from './hairstyles.service';

@Controller('hairstyles')
export class HairstylesController {
  constructor(private readonly hairstylesService: HairstylesService) {}

  /**
   * Endpoint công khai lấy danh sách kiểu tóc hiển thị dạng Grid trên trang chủ
   * GET /api/hairstyles
   * Không yêu cầu JWT token / authentication
   */
  @Get()
  async findAll(@Query() query: GetHairstylesDto) {
    return this.hairstylesService.findAll(query);
  }

  /**
   * Endpoint công khai lấy chi tiết kiểu tóc & độ phù hợp các dáng mặt
   * GET /api/hairstyles/:id
   * Không yêu cầu JWT token / authentication
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID kiểu tóc phải là số nguyên dương');
    }
    return this.hairstylesService.findOne(id);
  }
}

