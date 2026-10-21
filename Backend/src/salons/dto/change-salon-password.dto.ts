import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeSalonPasswordDto {
  /**
   * Mật khẩu hiện tại của chủ Salon
   */
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp mật khẩu hiện tại' })
  @MaxLength(100, { message: 'Mật khẩu hiện tại không được vượt quá 100 ký tự' })
  currentPassword: string;

  /**
   * Mật khẩu mới đáp ứng chính sách bảo mật tối thiểu 8 ký tự
   */
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp mật khẩu mới' })
  @MinLength(8, { message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' })
  @MaxLength(100, { message: 'Mật khẩu mới không được vượt quá 100 ký tự' })
  newPassword: string;

  /**
   * Xác nhận mật khẩu mới
   */
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng xác nhận lại mật khẩu mới' })
  @MaxLength(100, { message: 'Xác nhận mật khẩu không được vượt quá 100 ký tự' })
  confirmPassword: string;
}
