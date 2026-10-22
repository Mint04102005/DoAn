import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';

export class GetSalonBookingsDto {
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
   * Lọc theo ngày hẹn (định dạng YYYY-MM-DD)
   */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date phải có định dạng chính xác YYYY-MM-DD (ví dụ: 2026-10-25)',
  })
  date?: string;

  /**
   * Số trang hiện tại (mặc định 1)
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
