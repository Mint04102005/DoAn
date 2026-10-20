import { Module } from '@nestjs/common';
import { HairstylesController } from './hairstyles.controller';
import { HairstylesService } from './hairstyles.service';

@Module({
  controllers: [HairstylesController],
  providers: [HairstylesService],
  exports: [HairstylesService],
})
export class HairstylesModule {}
