import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ProgressTrackingService } from './progress-tracking.service';
import { SubjectProgressDto } from './dto/subject-progress.dto';
import { ProgressTracking } from './progress-tracking.entity';

@Controller('progress-tracking')
export class ProgressTrackingController {
  constructor(private readonly service: ProgressTrackingService) {}

  /**
   * تحديث/إنشاء آخر درس منجز لقسم معيّن
   */
  @Patch()
  async upsert(
    @Body()
    body: {
      classId: number;
      teacherId?: number;
      lastLessonReached: number;
    },
  ): Promise<ProgressTracking> {
    return this.service.upsertProgress(body);
  }

  /**
   * تقرير "متابعة إنجاز برنامج مادة" حسب subjectId
   */
  @Get('subject/:subjectId')
  async getSubjectProgress(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Query('date') date?: string,
  ): Promise<SubjectProgressDto> {
    return this.service.getSubjectProgress(subjectId, { date });
  }
}


