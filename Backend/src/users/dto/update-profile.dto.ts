import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi ký tự' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Ngày sinh phải là chuỗi ký tự' })
  dob?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;
}
