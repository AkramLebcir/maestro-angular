import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notification.entity';
import { AnnualPlanningModule } from '../annual-planning/annual-planning.module';
import { CourseEntry } from '../notebooks/course-entry.entity';
import { Notebook } from '../notebooks/notebook.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, CourseEntry, Notebook, Subscription]),
    AnnualPlanningModule, // For accessing holiday and distribution data
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
