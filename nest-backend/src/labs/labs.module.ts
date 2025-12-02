import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { Lab } from './lab.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lab])],
  controllers: [LabsController],
  providers: [LabsService],
  exports: [LabsService],
})
export class LabsModule {}




