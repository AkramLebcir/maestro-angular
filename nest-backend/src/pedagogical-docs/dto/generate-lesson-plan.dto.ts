import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateLessonPlanDto {
  @IsString()
  @IsNotEmpty()
  level: string; // المستوى (مثل: 3 ثانوي)

  @IsString()
  @IsNotEmpty()
  section: string; // الشعبة (مثل: علوم تجريبية)

  @IsString()
  @IsNotEmpty()
  conceptualField: string; // المجال المفاهيمي

  @IsString()
  @IsNotEmpty()
  conceptualUnit: string; // الوحدة المفاهيمية

  @IsString()
  @IsNotEmpty()
  lessonTitle: string; // عنوان الدرس

  @IsString()
  @IsNotEmpty()
  targetCompetency: string; // الكفاءة المستهدفة (الهدف)

  @IsString()
  @IsIn(['ضعيف', 'متوسط', 'ممتاز'])
  classLevel: string; // مستوى القسم

  @IsString()
  @IsNotEmpty()
  subject: string; // المادة الدراسية

  @Type(() => Number)
  @IsNumber()
  @Min(30)
  sessionDuration: number; // مدة الحصة بالدقائق
}

export interface LessonPlanStage {
  stage: string; // مرحلة الدرس (التزام، تمثيل، مشاركة، تقييم)
  time: string; // الزمن بالدقائق
  methodologicalApproach: string; // السير المنهجي والاستراتيجيات المتبعة
  strategy: string; // الاستراتيجية
  requiredResources: string; // الموارد المطلوبة
  notes?: string; // ملاحظات
}

export class GenerateLessonPlanResponseDto {
  teacherName?: string;
  date: string;
  level: string;
  section: string;
  memoNumber?: string;
  conceptualField: string;
  conceptualUnit: string;
  objective: string;
  currentActivity?: string;
  stages: LessonPlanStage[];
}

