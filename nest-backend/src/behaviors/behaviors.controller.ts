import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('behaviors')
@ModuleAccess('behavior-events')
export class BehaviorsController {
  @Get()
  getBehaviors(@CurrentUser() user: AuthUser): Array<{ id: number; type: string; name: string; nameAr: string }> {
    return [
      { id: 1, type: 'positive', name: 'Good General Behavior', nameAr: 'سلوك عام جيد' },
      { id: 2, type: 'positive', name: 'Good Progress', nameAr: 'تقدم جيد' },
      { id: 3, type: 'positive', name: 'Helpful', nameAr: 'متعاون' },
      { id: 4, type: 'positive', name: 'Homework done on time', nameAr: 'إنجاز الواجب في الوقت المحدد' },
      { id: 5, type: 'positive', name: 'Participating', nameAr: 'مشارك' },
      { id: 6, type: 'negative', name: 'Generally Bad Behavior', nameAr: 'سلوك عام سيء' },
      { id: 7, type: 'negative', name: 'Uses Mobile Phones Excessively', nameAr: 'استخدام الهاتف بشكل مفرط' },
      { id: 8, type: 'negative', name: 'Fighting', nameAr: 'شجار' },
      { id: 9, type: 'negative', name: 'Homework Issues', nameAr: 'مشاكل في الواجب' },
      { id: 10, type: 'negative', name: 'Chatting', nameAr: 'ثرثرة' }
    ];
  }
}


