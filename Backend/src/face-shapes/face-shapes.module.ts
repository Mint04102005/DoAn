import { Module } from '@nestjs/common';
import { FaceShapesController } from './face-shapes.controller';
import { FaceShapesService } from './face-shapes.service';

@Module({
  controllers: [FaceShapesController],
  providers: [FaceShapesService],
  exports: [FaceShapesService],
})
export class FaceShapesModule {}
