import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const errors: Record<string, [number, string]> = {
      P2002: [409, 'Dữ liệu đã tồn tại'],
      P2003: [
        409,
        'Dữ liệu đang được sử dụng hoặc bản ghi liên quan không tồn tại',
      ],
      P2025: [404, 'Không tìm thấy dữ liệu'],
      P2024: [503, 'Database đang bận, vui lòng thử lại'],
      P2034: [409, 'Dữ liệu vừa thay đổi, vui lòng thử lại'],
    };
    const [statusCode, message] = errors[exception.code] ?? [
      500,
      'Không xử lý được dữ liệu',
    ];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ statusCode, message });
  }
}
