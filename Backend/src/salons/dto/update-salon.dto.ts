import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSalonDto {
  /**
   * Tên salon
   */
  @IsOptional()
  @IsString({ message: 'Tên Salon phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tên Salon phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên Salon không được vượt quá 100 ký tự' })
  salonname?: string;

  @IsOptional()
  @IsString({ message: 'Tên Salon phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tên Salon phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên Salon không được vượt quá 100 ký tự' })
  name?: string;

  /**
   * Địa chỉ salon
   */
  @IsOptional()
  @IsString({ message: 'Địa chỉ Salon phải là chuỗi ký tự' })
  @MinLength(5, { message: 'Địa chỉ Salon phải có ít nhất 5 ký tự' })
  @MaxLength(255, { message: 'Địa chỉ không được vượt quá 255 ký tự' })
  address?: string;

  /**
   * Thẻ thế mạnh dáng mặt (hỗ trợ string "Tròn, Oval" hoặc mảng ["Tròn", "Oval"])
   */
  @IsOptional()
  tag?: string | string[];

  @IsOptional()
  tags?: string | string[];

  /**
   * Mô tả giới thiệu salon
   */
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;

  /**
   * Ảnh đại diện salon
   */
  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phải là chuỗi ký tự' })
  image_url?: string;
}
