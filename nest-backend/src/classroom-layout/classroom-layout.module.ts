import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassroomLayoutService } from './classroom-layout.service';
import { ClassroomLayoutController } from './classroom-layout.controller';
import { ClassroomLayout } from './entities/classroom-layout.entity';
import { Desk } from './entities/desk.entity';
import { DeskAssignment } from './entities/desk-assignment.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassroomLayout,
      Desk,
      DeskAssignment,
      Class,
      Student,
    ]),
  ],
  controllers: [ClassroomLayoutController],
  providers: [ClassroomLayoutService],
  exports: [ClassroomLayoutService],
})
export class ClassroomLayoutModule {}


