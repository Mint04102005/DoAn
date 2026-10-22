import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  /**
   * ID của Salon cần đặt lịch
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'salonId phải là số nguyên hợp lệ' })
  salonId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'salon_id phải là số nguyên hợp lệ' })
  salon_id?: number;

  /**
   * Thời gian hẹn làm tóc (định dạng ISO 8601, ví dụ: 2026-10-25T14:30:00.000Z)
   */
  @IsOptional()
  @IsISO8601(
    {},
    {
      message:
        'bookingDate phải đúng định dạng chuẩn ISO 8601 (ví dụ: 2026-10-25T14:30:00.000Z)',
    },
  )
  bookingDate?: string;

  @IsOptional()
  @IsISO8601(
    {},
    {
      message:
        'booking_date phải đúng định dạng chuẩn ISO 8601 (ví dụ: 2026-10-25T14:30:00.000Z)',
    },
  )
  booking_date?: string;

  /**
   * Ghi chú, yêu cầu dịch vụ làm tóc
   */
  @IsString({ message: 'notes phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'notes không được để trống' })
  @MaxLength(500, { message: 'notes không được vượt quá 500 ký tự' })
  notes: string;
}
