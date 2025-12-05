import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { Grade } from './grade.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { GradingSettingsModule } from '../grading-settings/grading-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grade, Student, Class]),
    GradingSettingsModule,
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}

