import { NotificationType, NotificationPriority } from '../notification.entity';

export class NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
  metadata?: Record<string, any>;
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
}








