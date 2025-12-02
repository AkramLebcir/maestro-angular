export class ProgressItemDto {
  teacherId?: number;
  classId: number;
  className: string;
  level: string;

  lastLessonReached: number;
  lessonProgressPercentage: number;

  expectedLesson: number;
  delayOrAdvanceUnits: number;
  delayPercentage: number;

  status: 'advance' | 'delay' | 'onTrack';
}





