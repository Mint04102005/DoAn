import { AdminModule } from './admin/admin.module';
import { APP_FILTER } from '@nestjs/core';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { FaceShapesModule } from './face-shapes/face-shapes.module';
import { HairstylesModule } from './hairstyles/hairstyles.module';
import { PrismaModule } from './prisma/prisma.module';
import { SalonsModule } from './salons/salons.module';
import { UsersModule } from './users/users.module';

@Module({
  providers: [{ provide: APP_FILTER, useClass: PrismaExceptionFilter }],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HairstylesModule,
    FaceShapesModule,
    SalonsModule,
    BookingsModule,
    AdminModule,
  ],
})
export class AppModule {}

