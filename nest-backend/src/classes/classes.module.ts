import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './class.entity';
import { Lab } from '../labs/lab.entity';
import { Student } from '../students/student.entity';
import { Grade } from '../grades/grade.entity';
import { Attendance } from '../attendance/attendance.entity';
import { BehaviorEvent } from '../behavior-events/behavior-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Lab, Student, Grade, Attendance, BehaviorEvent])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}





