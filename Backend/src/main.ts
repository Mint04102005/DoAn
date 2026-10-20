import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cấu hình tiền tố toàn cục /api
  app.setGlobalPrefix('api');

  // 2. Kích hoạt ValidationPipe toàn cục để tự động xác thực DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 3. Cấu hình CORS cho phép kết nối từ Frontend (localhost, 127.0.0.1 trên mọi port dev)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile app, curl, server-to-server)
      // hoặc từ localhost / 127.0.0.1 với bất kỳ cổng nào
      if (
        !origin ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin === frontendUrl
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Dev mode: cho phép truy cập linh hoạt
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 Curl Curator AI Backend is running on: http://localhost:${port}/api`);
}

bootstrap();
