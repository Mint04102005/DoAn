import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetSalonsDto {
  /**
   * Tìm kiếm theo tên Salon
   */
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  /**
   * Lọc theo địa chỉ hoặc khu vực hoạt động
   */
  @IsOptional()
  @IsString({ message: 'Địa chỉ tìm kiếm phải là chuỗi ký tự' })
  address?: string;

  /**
   * Lọc theo thẻ thế mạnh dáng mặt
   */
  @IsOptional()
  @IsString({ message: 'Thẻ thế mạnh phải là chuỗi ký tự' })
  tag?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang (page) phải là số nguyên' })
  @Min(1, { message: 'Số trang (page) phải lớn hơn hoặc bằng 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang (limit) phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang (limit) phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Số lượng mỗi trang (limit) tối đa là 100' })
  limit?: number;
}
