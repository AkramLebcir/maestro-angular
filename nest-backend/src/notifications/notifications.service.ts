import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { HolidayPeriod } from '../annual-planning/holiday-period.entity';
import { AnnualDistribution } from '../annual-planning/annual-distribution.entity';
import { CourseEntry } from '../notebooks/course-entry.entity';
import { Notebook } from '../notebooks/notebook.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(HolidayPeriod)
    private holidayRepository: Repository<HolidayPeriod>,
    @InjectRepository(AnnualDistribution)
    private distributionRepository: Repository<AnnualDistribution>,
    @InjectRepository(CourseEntry)
    private courseEntryRepository: Repository<CourseEntry>,
    @InjectRepository(Notebook)
    private notebookRepository: Repository<Notebook>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async findAll(ownerId: number, unreadOnly = false): Promise<NotificationResponseDto[]> {
    const where: any = { ownerId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return notifications.map(n => this.mapToResponseDto(n));
  }

  async findOne(ownerId: number, id: number): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, ownerId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.mapToResponseDto(notification);
  }

  async markAsRead(ownerId: number, id: number): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, ownerId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);

    return this.mapToResponseDto(notification);
  }

  async markAllAsRead(ownerId: number): Promise<void> {
    await this.notificationRepository.update(
      { ownerId, isRead: false },
      { isRead: true }
    );
  }

  async update(ownerId: number, id: number, updateDto: UpdateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, ownerId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    Object.assign(notification, updateDto);
    await this.notificationRepository.save(notification);

    return this.mapToResponseDto(notification);
  }

  async delete(ownerId: number, id: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, ownerId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  /**
   * Generate notifications for upcoming events
   */
  async generateNotifications(ownerId: number): Promise<void> {
    await this.generateUpcomingHolidayNotifications(ownerId);
    await this.generateUpcomingAssessmentNotifications(ownerId);
    await this.generateIncompleteTasksNotifications(ownerId);
    await this.generateSubscriptionExpiringNotifications(ownerId);
    // TODO: Add more notification types when training-inspection modules are implemented
  }

  /**
   * Generate notifications for upcoming holidays
   */
  private async generateUpcomingHolidayNotifications(ownerId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30); // Check for holidays in the next 30 days
    thirtyDaysFromNow.setHours(23, 59, 59, 999); // Set to end of day

    // Get all holidays for this owner
    const allHolidays = await this.holidayRepository.find({
      where: { ownerId },
      order: { startDate: 'ASC' }
    });

    console.log(`[Notifications] Found ${allHolidays.length} holidays for owner ${ownerId}`);
    console.log(`[Notifications] Checking holidays between ${today.toISOString()} and ${thirtyDaysFromNow.toISOString()}`);

    // Filter holidays that start within the next 30 days (not in the past)
    const upcomingHolidays = allHolidays.filter(holiday => {
      const holidayStartDate = new Date(holiday.startDate);
      holidayStartDate.setHours(0, 0, 0, 0);
      const isUpcoming = holidayStartDate >= today && holidayStartDate <= thirtyDaysFromNow;
      console.log(`[Notifications] Holiday "${holiday.name}" starts on ${holidayStartDate.toISOString()}, isUpcoming: ${isUpcoming}`);
      return isUpcoming;
    });

    console.log(`[Notifications] Found ${upcomingHolidays.length} upcoming holidays`);

    for (const holiday of upcomingHolidays) {
      // Check if notification already exists (check all, not just unread)
      const existingNotification = await this.notificationRepository.findOne({
        where: {
          ownerId,
          type: 'upcoming_holiday',
          relatedEntityId: holiday.id,
          relatedEntityType: 'holiday'
        }
      });

      // Create notification if it doesn't exist
      if (!existingNotification) {
        const holidayStartDate = new Date(holiday.startDate);
        holidayStartDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((holidayStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Set priority based on days until holiday starts
        const priority: 'low' | 'medium' | 'high' | 'urgent' = 
          daysUntil <= 1 ? 'urgent' :   // Tomorrow or today
          daysUntil <= 3 ? 'high' :     // Within 3 days
          daysUntil <= 7 ? 'medium' :   // Within a week
          'low';                         // More than a week

        const daysText = daysUntil === 0 ? 'اليوم' : 
                         daysUntil === 1 ? 'غداً' : 
                         `بعد ${daysUntil} يوم${daysUntil > 1 ? 'ات' : ''}`;

        const notification = this.notificationRepository.create({
          ownerId,
          title: `اقتراب عطلة: ${holiday.name}`,
          message: `العطلة "${holiday.name}" ستبدأ ${daysText} (${new Date(holiday.startDate).toLocaleDateString('ar-EG')}) وتنتهي في ${new Date(holiday.endDate).toLocaleDateString('ar-EG')}`,
          type: 'upcoming_holiday',
          priority,
          relatedEntityId: holiday.id,
          relatedEntityType: 'holiday',
          dueDate: holiday.startDate,
          metadata: {
            holidayType: holiday.type,
            notes: holiday.notes,
            daysUntil
          }
        });

        const saved = await this.notificationRepository.save(notification);
        console.log(`[Notifications] Created notification for holiday "${holiday.name}" with ID ${saved.id}`);
      } else {
        console.log(`[Notifications] Notification already exists for holiday "${holiday.name}"`);
      }
    }
  }

  /**
   * Generate notifications for upcoming assessments based on annual distribution
   */
  private async generateUpcomingAssessmentNotifications(ownerId: number): Promise<void> {
    // This is a simplified implementation
    // In a real system, you might have assessment schedules
    // For now, we'll create notifications for upcoming weeks with assessments

    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    // Get current year
    const currentYear = `${today.getFullYear()}-${today.getFullYear() + 1}`;

    const upcomingDistributions = await this.distributionRepository.find({
      where: {
        ownerId,
        year: currentYear,
        // This is simplified - in reality you'd need date calculations
      },
      relations: ['subject']
    });

    // For demonstration, create a sample notification
    // In a real implementation, you'd check for actual assessment dates
    if (upcomingDistributions.length > 0) {
      const sampleNotification = await this.notificationRepository.findOne({
        where: {
          ownerId,
          type: 'upcoming_assessment',
          title: 'تذكير بالتقييمات الأسبوعية'
        }
      });

      if (!sampleNotification) {
        const notification = this.notificationRepository.create({
          ownerId,
          title: 'تذكير بالتقييمات الأسبوعية',
          message: 'تأكد من إجراء التقييمات الأسبوعية للتلاميذ حسب المنهاج المحدد',
          type: 'upcoming_assessment',
          priority: 'medium',
          dueDate: oneWeekFromNow.toISOString().split('T')[0]
        });

        await this.notificationRepository.save(notification);
      }
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(ownerId: number): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const [total, unread] = await Promise.all([
      this.notificationRepository.count({ where: { ownerId } }),
      this.notificationRepository.count({ where: { ownerId, isRead: false } })
    ]);

    const notifications = await this.notificationRepository.find({
      where: { ownerId },
      select: ['type', 'priority']
    });

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });

    return { total, unread, byType, byPriority };
  }

  /**
   * Generate notifications for incomplete tasks in notebooks
   */
  private async generateIncompleteTasksNotifications(ownerId: number): Promise<void> {
    // Get course entries that don't have marks or notes (considered incomplete)
    const incompleteTasks = await this.courseEntryRepository.find({
      where: [
        { ownerId, mark: null },
        { ownerId, note: null }
      ],
      relations: ['notebook'],
      order: { date: 'ASC' }
    });

    // Group by notebook and count incomplete tasks
    const notebookTasks: { [notebookId: number]: { notebook: Notebook, tasks: CourseEntry[] } } = {};

    incompleteTasks.forEach(task => {
      if (task.notebook) {
        if (!notebookTasks[task.notebookId]) {
          notebookTasks[task.notebookId] = { notebook: task.notebook, tasks: [] };
        }
        notebookTasks[task.notebookId].tasks.push(task);
      }
    });

    // Create notifications for notebooks with incomplete tasks
    for (const [notebookId, data] of Object.entries(notebookTasks)) {
      const { notebook, tasks } = data;

      // Check if notification already exists for this notebook
      const existingNotification = await this.notificationRepository.findOne({
        where: {
          ownerId,
          type: 'incomplete_task',
          relatedEntityId: parseInt(notebookId),
          relatedEntityType: 'notebook'
        }
      });

      if (!existingNotification) {
        const oldestTask = tasks.reduce((oldest, task) =>
          new Date(task.date) < new Date(oldest.date) ? task : oldest
        );

        const notification = this.notificationRepository.create({
          ownerId,
          title: `مهام غير مكتملة في ${notebook.title}`,
          message: `يوجد ${tasks.length} مهمة غير مكتملة في مفكرة "${notebook.title}". أقدم مهمة بتاريخ ${oldestTask.date}`,
          type: 'incomplete_task',
          priority: tasks.length > 5 ? 'high' : 'medium',
          relatedEntityId: parseInt(notebookId),
          relatedEntityType: 'notebook',
          dueDate: oldestTask.date,
          metadata: {
            incompleteTasksCount: tasks.length,
            oldestTaskDate: oldestTask.date,
            taskIds: tasks.map(t => t.id)
          }
        });

        await this.notificationRepository.save(notification);
      }
    }
  }

  /**
   * Generate notifications for subscriptions expiring soon
   */
  private async generateSubscriptionExpiringNotifications(ownerId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    twoWeeksFromNow.setHours(23, 59, 59, 999);

    // Find active subscriptions expiring within 14 days
    const expiringSubscriptions = await this.subscriptionRepository.find({
      where: {
        userId: ownerId,
        status: 'active' as any,
        endDate: Between(today, twoWeeksFromNow),
      },
      relations: ['plan'],
    });

    for (const subscription of expiringSubscriptions) {
      // Check if notification already exists
      const existingNotification = await this.notificationRepository.findOne({
        where: {
          ownerId,
          type: 'subscription_expiring',
          relatedEntityId: subscription.id,
          relatedEntityType: 'subscription',
        },
      });

      if (!existingNotification) {
        const endDate = new Date(subscription.endDate);
        endDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Set priority based on days until expiration
        const priority: 'low' | 'medium' | 'high' | 'urgent' =
          daysUntil <= 3 ? 'urgent' : // Within 3 days
          daysUntil <= 7 ? 'high' : // Within a week
          'medium'; // More than a week

        const daysText =
          daysUntil === 0
            ? 'اليوم'
            : daysUntil === 1
            ? 'غداً'
            : `بعد ${daysUntil} يوم${daysUntil > 1 ? 'ات' : ''}`;

        const notification = this.notificationRepository.create({
          ownerId,
          title: 'تنبيه: انتهاء الاشتراك قريباً',
          message: `اشتراكك في باقة "${subscription.plan?.name}" سينتهي ${daysText} (${endDate.toLocaleDateString('ar-EG')}). يرجى تجديد اشتراكك لتجنب تعطيل حسابك.`,
          type: 'subscription_expiring',
          priority,
          relatedEntityId: subscription.id,
          relatedEntityType: 'subscription',
          dueDate: subscription.endDate.toISOString().split('T')[0],
          metadata: {
            subscriptionId: subscription.id,
            planName: subscription.plan?.name,
            daysUntil,
            endDate: subscription.endDate.toISOString(),
          },
        });

        await this.notificationRepository.save(notification);
      }
    }
  }

  private mapToResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
      metadata: notification.metadata,
      dueDate: notification.dueDate,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
