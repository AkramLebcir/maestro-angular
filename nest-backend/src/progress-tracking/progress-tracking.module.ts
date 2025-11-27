import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressTracking } from './progress-tracking.entity';
import { Subject } from '../subjects/subject.entity';
import { Class } from '../classes/class.entity';
import { AnnualDistribution } from '../annual-planning/annual-distribution.entity';
import { Notebook } from '../notebooks/notebook.entity';
import { CourseEntry } from '../notebooks/course-entry.entity';
import { ProgressTrackingService } from './progress-tracking.service';
import { ProgressTrackingController } from './progress-tracking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgressTracking,
      Subject,
      Class,
      AnnualDistribution,
      Notebook,
      CourseEntry,
    ]),
  ],
  providers: [ProgressTrackingService],
  controllers: [ProgressTrackingController],
})
export class ProgressTrackingModule {}


