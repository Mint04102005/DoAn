import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class GetMyBookingsDto {
  /**
   * Lọc theo trạng thái đơn đặt lịch:
   * P (Chờ duyệt) / C (Đã xác nhận) / D (Hoàn thành) / X (Đã hủy)
   */
  @IsOptional()
  @IsIn(
    ['P', 'C', 'D', 'X', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    {
      message:
        'status phải là một trong các giá trị: P, C, D, X, PENDING, CONFIRMED, COMPLETED, CANCELLED',
    },
  )
  status?: string;

  /**
   * Số trang (mặc định 1)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page tối thiểu là 1' })
  page?: number = 1;

  /**
   * Số lượng bản ghi mỗi trang (mặc định 10)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  limit?: number = 10;
}
