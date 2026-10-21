import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FaceShapesModule } from './face-shapes/face-shapes.module';
import { HairstylesModule } from './hairstyles/hairstyles.module';
import { PrismaModule } from './prisma/prisma.module';
import { SalonsModule } from './salons/salons.module';
import { UsersModule } from './users/users.module';

@Module({
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
  ],
})
export class AppModule {}

