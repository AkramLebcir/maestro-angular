import { ProgressItemDto } from './progress-item.dto';

export class SubjectProgressDto {
  subjectId: number;
  subjectNameAr: string;
  level: string;
  totalLessons: number;
  currentDate: string;
  currentWeek: number;
  expectedLesson: number;

  items: ProgressItemDto[];
  delayed: ProgressItemDto[];
  advanced: ProgressItemDto[];
}



