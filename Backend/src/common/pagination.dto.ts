import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export function paginate(query: PaginationDto) {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

export function pageResult<T>(data: T[], total: number, query: PaginationDto) {
  return {
    data,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
