import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard للتحقق من صلاحية اشتراك المستخدم
 * يسمح للمسؤولين بالوصول دائماً، ويفحص اشتراك الأساتذة
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // المسؤولون يمكنهم الوصول دائماً
    if (user?.role === UserRole.ADMIN) {
      return true;
    }

    // التحقق من اشتراك الأستاذ
    if (user?.role === UserRole.TEACHER) {
      const isActive = await this.subscriptionsService.isUserSubscriptionActive(user.id);
      if (!isActive) {
        throw new ForbiddenException(
          'Your subscription has expired. Please renew your subscription to continue using the application.',
        );
      }
    }

    return true;
  }
}







