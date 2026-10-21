import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { GetSalonsDto } from './dto/get-salons.dto';
import { SalonsService } from './salons.service';

@Controller('salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  /**
   * BE-05.1: API khám phá danh sách Salon
   * GET /api/salons
   * Quyền truy cập: Public
   */
  @Get()
  async findAll(@Query() query: GetSalonsDto) {
    return this.salonsService.findAll(query);
  }

  /**
   * BE-05.2: API chi tiết Salon
   * GET /api/salons/:id
   * Quyền truy cập: Public
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID salon phải là số nguyên dương');
    }
    return this.salonsService.findOne(id);
  }
}
