import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type NotificationType =
  | 'upcoming_assessment'
  | 'upcoming_holiday'
  | 'incomplete_task'
  | 'upcoming_seminar'
  | 'upcoming_visit'
  | 'subscription_expiring';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
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

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  getNotifications(unreadOnly = false): Observable<Notification[]> {
    const queryParams = unreadOnly ? '?unreadOnly=true' : '';
    return this.api.get<Notification[]>(`/notifications${queryParams}`);
  }

  getNotificationStats(): Observable<NotificationStats> {
    return this.api.get<NotificationStats>('/notifications/stats');
  }

  getNotification(id: number): Observable<Notification> {
    return this.api.get<Notification>(`/notifications/${id}`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.api.patch<Notification>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.api.patch<void>('/notifications/mark-all-read', {});
  }

  generateNotifications(): Observable<void> {
    return this.api.post<void>('/notifications/generate', {});
  }

  updateNotification(id: number, updates: { isRead?: boolean }): Observable<Notification> {
    return this.api.patch<Notification>(`/notifications/${id}`, updates);
  }

  deleteNotification(id: number): Observable<void> {
    return this.api.delete<void>(`/notifications/${id}`);
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'upcoming_assessment':
        return '📝';
      case 'upcoming_holiday':
        return '🏖️';
      case 'incomplete_task':
        return '⚠️';
      case 'upcoming_seminar':
        return '🎓';
      case 'upcoming_visit':
        return '👥';
      default:
        return '📢';
    }
  }

  getNotificationColor(priority: NotificationPriority): string {
    switch (priority) {
      case 'low':
        return 'text-blue-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'urgent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getNotificationBgColor(priority: NotificationPriority): string {
    switch (priority) {
      case 'low':
        return 'bg-blue-50 border-blue-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'urgent':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }
}
