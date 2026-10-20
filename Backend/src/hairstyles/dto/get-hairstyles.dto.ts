import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetHairstylesDto {
  @IsOptional()
  @IsIn(['Nam', 'Nữ'], {
    message: 'Giới tính chỉ chấp nhận giá trị "Nam" hoặc "Nữ"',
  })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang (page) phải là số nguyên' })
  @Min(1, { message: 'Số trang (page) phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang (limit) phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang (limit) phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Số lượng mỗi trang (limit) tối đa là 100' })
  limit?: number = 10;
}
