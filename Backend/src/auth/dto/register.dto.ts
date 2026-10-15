import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  avatarUrl?: string;

  @IsOptional()
  @IsIn(['USER', 'SALON_OWNER'], {
    message: 'Vai trò chỉ có thể là USER hoặc SALON_OWNER',
  })
  role?: 'USER' | 'SALON_OWNER';

  // Các trường bổ sung nếu role là SALON_OWNER
  @IsOptional()
  @IsString({ message: 'Tên Salon phải là chuỗi ký tự' })
  salonName?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ Salon phải là chuỗi ký tự' })
  salonAddress?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại Salon phải là chuỗi ký tự' })
  salonPhone?: string;
}
