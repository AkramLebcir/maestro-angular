import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionsScheduler {
  private readonly logger = new Logger(SubscriptionsScheduler.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * التحقق من انتهاء الاشتراكات كل ساعة
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions...');
    try {
      const expiredCount = await this.subscriptionsService.checkAndExpireSubscriptions();
      if (expiredCount > 0) {
        this.logger.log(`Expired ${expiredCount} subscription(s)`);
      }
    } catch (error) {
      this.logger.error(`Error checking expired subscriptions: ${error.message}`, error.stack);
    }
  }
}





