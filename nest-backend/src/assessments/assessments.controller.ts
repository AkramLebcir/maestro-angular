import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

export interface Assessment {
  id: number;
  type: string;
  name: string;
  nameAr: string;
  weight: number;
  maxScore: number;
  isAutomatic: boolean;
  formula?: string;
}

@Controller('assessments')
@ModuleAccess('grades')
export class AssessmentsController {
  @Get()
  getAssessments(@CurrentUser() user: AuthUser): Assessment[] {
    return [
      { id: 1, type: 'notebook_correction', name: 'Notebook Correction', nameAr: 'تصحيح الدفتر', weight: 1, maxScore: 5, isAutomatic: false },
      { id: 2, type: 'duty', name: 'Duty', nameAr: 'الواجب', weight: 1, maxScore: 5, isAutomatic: false },
      { id: 3, type: 'attendance', name: 'Attendance', nameAr: 'الحضور', weight: 1, maxScore: 5, isAutomatic: true },
      { id: 4, type: 'behavior', name: 'Behavior', nameAr: 'السلوك', weight: 1, maxScore: 5, isAutomatic: true },
      { id: 5, type: 'continuous_assessment', name: 'Continuous Assessment', nameAr: 'التقييم المستمر', weight: 2, maxScore: 20, isAutomatic: true, formula: 'notebook + duty + attendance + behavior' },
      { id: 6, type: 'oral_expression', name: 'Oral Expression/Practical Work', nameAr: 'التعبير الشفهي/العمل العملي', weight: 1, maxScore: 20, isAutomatic: false },
      { id: 8, type: 'assignment', name: 'Assignment', nameAr: 'الفرض', weight: 1, maxScore: 20, isAutomatic: false },
      { id: 9, type: 'test', name: 'Test', nameAr: 'الاختبار', weight: 3, maxScore: 20, isAutomatic: false }
    ];
  }
}

