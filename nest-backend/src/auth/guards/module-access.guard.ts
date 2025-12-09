import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_ACCESS_KEY } from '../decorators/module-access.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModule = this.reflector.getAllAndOverride<string>(MODULE_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('المستخدم غير مصرح له بالوصول');
    }

    // Admins have access to all modules
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // If allowedModules is null, undefined, or empty array, grant access (backward compatibility)
    // This means if no modules are explicitly restricted, allow access
    if (!user.allowedModules || user.allowedModules.length === 0) {
      return true;
    }

    // Check if user has access to the required module
    if (!user.allowedModules.includes(requiredModule)) {
      const moduleNames: Record<string, string> = {
        'workstations': 'مخطط المقاعد',
        'students': 'التلاميذ',
        'classes': 'الأقسام',
        'attendance': 'الحضور',
        'grades': 'الدرجات',
        'topics': 'المواضيع',
        'notebooks': 'الدفاتر',
        'behavior-events': 'أحداث السلوك',
        'certificate-generator': 'الشهادات',
        'lab-management': 'إدارة المخبر',
        'annual-planning': 'التخطيط السنوي',
        'progress-tracking': 'تتبع التقدم',
        'pedagogical-docs': 'الوثائق التربوية',
        'timetable': 'الجدول الزمني',
        'notifications': 'الإشعارات',
        'labs': 'المخابر',
        'clubs': 'النوادي',
      };
      
      const moduleName = moduleNames[requiredModule] || requiredModule;
      throw new ForbiddenException(
        `ليس لديك صلاحيات للوصول إلى ${moduleName}. يرجى الاتصال بالمسؤول لإضافة هذه الصلاحية.`
      );
    }

    return true;
  }
}


