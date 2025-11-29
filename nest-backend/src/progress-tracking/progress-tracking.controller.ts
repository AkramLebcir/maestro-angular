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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('progress-tracking')
@ModuleAccess('progress-tracking')
export class ProgressTrackingController {
  constructor(private readonly service: ProgressTrackingService) {}

  /**
   * تحديث/إنشاء آخر درس منجز لقسم معيّن
   */
  @Patch()
  async upsert(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      classId: number;
      teacherId?: number;
      lastLessonReached: number;
    },
  ): Promise<ProgressTracking> {
    return this.service.upsertProgress(user.id, body);
  }

  /**
   * تقرير "متابعة إنجاز برنامج مادة" حسب subjectId
   */
  @Get('subject/:subjectId')
  async getSubjectProgress(
    @CurrentUser() user: AuthUser,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Query('date') date?: string,
  ): Promise<SubjectProgressDto> {
    return this.service.getSubjectProgress(user.id, subjectId, { date });
  }
}


