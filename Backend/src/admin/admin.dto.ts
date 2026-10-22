import { Type } from 'class-transformer';
import { Role, SalonStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { FACE_SHAPES } from '../common/face-shapes';

export class UsersQueryDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsIn(['active', 'locked']) status?: string;
}

export class SalonsQueryDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsEnum(SalonStatus) status?: SalonStatus;
}

export class LogsQueryDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) adminId?: number;
  @IsOptional() @IsIn(['today', '7d', '30d']) dateRange?: string;
}

export class LockUserDto {
  @IsDefined() @IsBoolean() isLocked: boolean;
}

export class ReviewSalonDto {
  @IsIn(['APPROVED', 'REJECTED']) status: 'APPROVED' | 'REJECTED';
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class HairFaceDto {
  @IsInt() @Min(1) faceShapeId: number;
  @IsNumber() @Min(0) @Max(100) suitabilityScore: number;
}

// PUT uses full replacement to keep catalog metadata and rules consistent.
export class WriteHairstyleDto {
  @IsString() @IsNotEmpty() @MaxLength(150) name: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsIn(['Nam', 'Nữ']) gender: string;
  @IsOptional() @IsString() @MaxLength(100) hairType?: string;
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  imageUrl: string;
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tags: string[];
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => HairFaceDto)
  rules: HairFaceDto[];
}

export class CreateFaceShapeDto {
  @IsIn(FACE_SHAPES) name: string;
}
