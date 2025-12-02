import { Component, EventEmitter, OnInit, OnDestroy, Output, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LanguageService, LanguageCode } from '../../services/language.service';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService, Notification, NotificationStats } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  teacherName = 'الأستاذ';
  teacherPhotoUrl: string | null = null;
  notificationCount = 0;
  currentUser: User | null = null;
  isUserMenuOpen = false;

  @Output() toggleMenu = new EventEmitter<void>();

  // إعدادات اللغة الحالية وقائمة اللغات المتاحة
  currentLanguageCode: LanguageCode = 'AR';
  isLanguageMenuOpen = false;
  private languageSubscription?: Subscription;
  private userSubscription?: Subscription;

  // إعدادات الإشعارات
  notifications: Notification[] = [];
  notificationStats: NotificationStats | null = null;
  showNotificationsPanel = false;
  notificationsLoaded = false;
  @ViewChild('notificationsPanel', { static: false }) notificationsPanelRef?: ElementRef;
  @ViewChild('notificationsButton', { static: false }) notificationsButtonRef?: ElementRef;

  constructor(
    public languageService: LanguageService,
    private authService: AuthService,
    private router: Router,
    public notificationService: NotificationService
  ) {}

  toggleLanguageMenu(): void {
    this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
  }

  selectLanguage(code: LanguageCode): void {
    this.languageService.setLanguage(code);
    this.isLanguageMenuOpen = false;
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    // الاشتراك في تغييرات اللغة
    this.languageSubscription = this.languageService.currentLanguage$.subscribe((lang: LanguageCode) => {
      this.currentLanguageCode = lang;
    });
    this.currentLanguageCode = this.languageService.getCurrentLanguage();

    // الاشتراك في تغييرات المستخدم
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        this.teacherName = fullName || user.email || 'المستخدم';
      }
    });

    // جلب بيانات بطاقة الأستاذ من التخزين المحلي إن وُجدت
    const stored = localStorage.getItem('teacherCard');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.photoDataUrl) {
          this.teacherPhotoUrl = data.photoDataUrl;
        }
      } catch {
        // في حال وجود خطأ في الـ JSON نتجاهله ونبقي القيم الافتراضية
      }
    }

    // تحميل الإشعارات
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
    this.isUserMenuOpen = false;
  }

  /**
   * تبديل عرض لوحة الإشعارات
   */
  toggleNotificationsPanel(): void {
    this.showNotificationsPanel = !this.showNotificationsPanel;
    if (this.showNotificationsPanel && !this.notificationsLoaded) {
      this.loadNotifications();
    }
  }

  /**
   * تحميل الإشعارات
   */
  private loadNotifications(): void {
    this.notificationsLoaded = false;

    // تحميل الإشعارات
    this.notificationService.getNotifications().subscribe({
      next: notifications => {
        this.notifications = notifications || [];
        this.notificationsLoaded = true;
      },
      error: err => {
        console.error('Error loading notifications:', err);
        this.notifications = [];
        this.notificationsLoaded = true;
      }
    });

    // تحميل إحصائيات الإشعارات
    this.notificationService.getNotificationStats().subscribe({
      next: stats => {
        this.notificationStats = stats;
        this.notificationCount = stats?.unread || 0;
      },
      error: err => {
        console.error('Error loading notification stats:', err);
        this.notificationStats = null;
        this.notificationCount = 0;
      }
    });
  }

  /**
   * تحديث الإشعارات يدوياً
   */
  refreshNotifications(): void {
    this.notificationsLoaded = false;
    this.loadNotifications();
  }

  /**
   * وضع علامة قراءة على إشعار
   */
  markNotificationAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: updatedNotification => {
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index] = updatedNotification;
            // تحديث الإحصائيات
            if (this.notificationStats) {
              this.notificationStats.unread = Math.max(0, this.notificationStats.unread - 1);
              this.notificationCount = this.notificationStats.unread;
            }
          }
        },
        error: err => {
          console.error('Error marking notification as read:', err);
        }
      });
    }
  }

  /**
   * ترجمة عنوان الإشعار حسب نوعه، مع الاحتفاظ بالقيمة الأصلية كاحتياط
   */
  getNotificationTitle(notification: Notification): string {
    switch (notification.type) {
      case 'upcoming_holiday':
        return this.translate('notifications.type.upcomingHoliday.title');
      case 'upcoming_assessment':
        return this.translate('notifications.type.upcomingAssessment.title');
      case 'incomplete_task':
        return this.translate('notifications.type.incompleteTask.title');
      case 'subscription_expiring':
        return this.translate('notifications.type.subscriptionExpiring.title');
      default:
        return notification.title;
    }
  }

  /**
   * ترجمة نص الإشعار حسب نوعه، مع الاحتفاظ بالنص الأصلي كاحتياط
   */
  getNotificationMessage(notification: Notification): string {
    switch (notification.type) {
      case 'upcoming_holiday':
        return this.translate('notifications.type.upcomingHoliday.message');
      case 'upcoming_assessment':
        return this.translate('notifications.type.upcomingAssessment.message');
      case 'incomplete_task':
        return this.translate('notifications.type.incompleteTask.message');
      case 'subscription_expiring':
        return this.translate('notifications.type.subscriptionExpiring.message');
      default:
        return notification.message;
    }
  }

  /**
   * وضع علامة قراءة على جميع الإشعارات
   */
  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        if (this.notificationStats) {
          this.notificationStats.unread = 0;
          this.notificationCount = 0;
        }
      },
      error: err => {
        console.error('Error marking all notifications as read:', err);
      }
    });
  }

  /**
   * إغلاق لوحة الإشعارات عند النقر خارجها
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showNotificationsPanel) {
      const clickedInsidePanel = this.notificationsPanelRef?.nativeElement?.contains(event.target);
      const clickedInsideButton = this.notificationsButtonRef?.nativeElement?.contains(event.target);
      
      if (!clickedInsidePanel && !clickedInsideButton) {
        this.showNotificationsPanel = false;
      }
    }
  }
}


