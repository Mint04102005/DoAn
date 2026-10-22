import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetSalonAvailabilityDto {
  /**
   * Ngày cần kiểm tra khung giờ đã đặt (định dạng YYYY-MM-DD)
   */
  @IsNotEmpty({ message: 'Tham số date không được để trống' })
  @IsString({ message: 'date phải là chuỗi ký tự' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date phải có định dạng chính xác YYYY-MM-DD (ví dụ: 2026-10-25)',
  })
  date: string;
}
