import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkstationsService } from './workstations.service';
import { WorkstationsController } from './workstations.controller';
import { Workstation } from './workstation.entity';
import { SeatAssignment } from './seat-assignment.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { Grade } from '../grades/grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workstation,
      SeatAssignment,
      Class,
      Student,
      Grade,
    ]),
  ],
  controllers: [WorkstationsController],
  providers: [WorkstationsService],
  exports: [WorkstationsService],
})
export class WorkstationsModule {}








