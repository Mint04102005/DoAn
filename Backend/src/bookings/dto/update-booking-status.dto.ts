import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  @IsIn(['P', 'C', 'D', 'X', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], {
    message: 'Trạng thái phải là P (PENDING), C (CONFIRMED), D (COMPLETED) hoặc X (CANCELLED)',
  })
  status: string;
}
