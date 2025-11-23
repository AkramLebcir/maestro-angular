import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { Grade } from './grade.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Student, Class])],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}

