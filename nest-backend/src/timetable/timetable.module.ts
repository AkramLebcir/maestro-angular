import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { Timetable } from './timetable.entity';
import { Class } from '../classes/class.entity';
import { Lab } from '../labs/lab.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Timetable, Class, Lab])],
  controllers: [TimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}




