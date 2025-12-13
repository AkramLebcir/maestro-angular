import { Component, EventEmitter, OnInit, OnDestroy, Output, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LanguageService, LanguageCode } from '../../services/language.service';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService, Notification, NotificationStats } from '../../services/notification.service';
import { ThemeService, ThemeMode, ThemeColor } from '../../services/theme.service';

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
  
  // إعدادات المظهر (Dark/Light Mode)
  currentTheme: ThemeMode = 'light';
  currentThemeColor: ThemeColor = 'blue';
  private themeSubscription?: Subscription;
  private themeColorSubscription?: Subscription;
  isThemeColorMenuOpen = false;
  themeColorOptions: Array<{ value: ThemeColor; label: string; preview: string }> = [];
  get currentColorPreview(): string {
    return (
      this.themeColorOptions.find(option => option.value === this.currentThemeColor)?.preview ||
      '#2563eb'
    );
  }

  // إعدادات الإشعارات
  notifications: Notification[] = [];
  notificationStats: NotificationStats | null = null;
  showNotificationsPanel = false;
  notificationsLoaded = false;
  @ViewChild('notificationsPanel', { static: false }) notificationsPanelRef?: ElementRef;
  @ViewChild('notificationsButton', { static: false }) notificationsButtonRef?: ElementRef;
  @ViewChild('themeMenuPanel', { static: false }) themeMenuPanelRef?: ElementRef;
  @ViewChild('themeMenuButton', { static: false }) themeMenuButtonRef?: ElementRef;

  constructor(
    public languageService: LanguageService,
    private authService: AuthService,
    private router: Router,
    public notificationService: NotificationService,
    public themeService: ThemeService
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
    // خيارات ألوان الواجهة
    const colorLabels: Record<ThemeColor, string> = {
      blue: 'أزرق',
      emerald: 'زمردي',
      purple: 'بنفسجي',
      amber: 'كهرماني',
      rose: 'وردي'
    };
    this.themeColorOptions = this.themeService.getAvailableColors().map(color => ({
      value: color,
      label: colorLabels[color],
      preview: this.themeService.getColorPreview(color)
    }));

    // الاشتراك في تغييرات اللغة
    this.languageSubscription = this.languageService.currentLanguage$.subscribe((lang: LanguageCode) => {
      this.currentLanguageCode = lang;
    });
    this.currentLanguageCode = this.languageService.getCurrentLanguage();

    // الاشتراك في تغييرات المظهر
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme: ThemeMode) => {
      this.currentTheme = theme;
    });
    this.currentTheme = this.themeService.getCurrentTheme();

    // الاشتراك في تغييرات لون الواجهة
    this.themeColorSubscription = this.themeService.currentColor$.subscribe((color: ThemeColor) => {
      this.currentThemeColor = color;
    });
    this.currentThemeColor = this.themeService.getCurrentColorTheme();

    // الاشتراك في تغييرات المستخدم
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        this.teacherName = fullName || user.email || 'المستخدم';
        // تحميل الإشعارات فقط إذا كان المستخدم مسجلاً دخوله
        if (user) {
          this.loadNotifications();
        }
      } else {
        // إعادة تعيين الإشعارات إذا لم يكن هناك مستخدم
        this.notifications = [];
        this.notificationStats = null;
        this.notificationCount = 0;
        this.notificationsLoaded = true;
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

    // تحميل الإشعارات فقط إذا كان هناك مستخدم مسجل دخوله
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.loadNotifications();
    }
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.themeColorSubscription) {
      this.themeColorSubscription.unsubscribe();
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleThemeColorMenu(): void {
    this.isThemeColorMenuOpen = !this.isThemeColorMenuOpen;
  }

  setThemeColor(color: ThemeColor): void {
    this.themeService.setColorTheme(color);
    this.isThemeColorMenuOpen = false;
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
    // التحقق من وجود مستخدم مسجل دخوله قبل تحميل الإشعارات
    if (!this.currentUser) {
      this.notifications = [];
      this.notificationStats = null;
      this.notificationCount = 0;
      this.notificationsLoaded = true;
      return;
    }

    this.notificationsLoaded = false;

    // تحميل الإشعارات (غير المقروءة فقط حتى تختفي بعد قراءتها)
    this.notificationService.getNotifications(true).subscribe({
      next: notifications => {
        // نعرض فقط الإشعارات غير المقروءة (احتياط إضافي)
        this.notifications = (notifications || []).filter(n => !n.isRead);
        this.notificationsLoaded = true;
      },
      error: err => {
        // تجاهل أخطاء 401 (Unauthorized) بصمت - طبيعية إذا لم يكن المستخدم مسجلاً دخوله
        if (err.status !== 401) {
          console.error('Error loading notifications:', err);
        }
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
        // تجاهل أخطاء 401 (Unauthorized) بصمت - طبيعية إذا لم يكن المستخدم مسجلاً دخوله
        if (err.status !== 401) {
          console.error('Error loading notification stats:', err);
        }
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
   * تحديد المسار بناءً على نوع الإشعار
   */
  getNotificationRoute(notification: Notification): string {
    switch (notification.type) {
      case 'upcoming_assessment':
        // التنقل إلى صفحة سجل الدرجات للإشعارات المتعلقة بالاختبارات
        return '/gradebook';
      case 'upcoming_holiday':
      case 'upcoming_seminar':
      case 'upcoming_visit':
        // التنقل إلى صفحة الجدول الزمني للإشعارات المتعلقة بالعطلات والندوات والزيارات
        return '/timetable';
      case 'incomplete_task':
        // التنقل إلى صفحة الدفاتر للمهام غير المكتملة
        return '/notebooks';
      case 'subscription_expiring':
        // التنقل إلى صفحة حالة الاشتراك
        return '/subscription-status';
      default:
        // الافتراضي: التنقل إلى لوحة التحكم
        return '/dashboard';
    }
  }

  /**
   * معالجة النقر على الإشعار: التنقل إلى الصفحة المحددة ووضع علامة قراءة
   */
  handleNotificationClick(notification: Notification): void {
    // تحديد المسار بناءً على نوع الإشعار
    const route = this.getNotificationRoute(notification);
    
    // إغلاق لوحة الإشعارات
    this.showNotificationsPanel = false;
    
    // التنقل إلى الصفحة المحددة
    this.router.navigate([route]);
    
    // وضع علامة قراءة على الإشعار
    if (!notification.isRead) {
      this.markNotificationAsRead(notification);
    }
  }

  /**
   * عند قراءة/فتح الإشعار: نعلّمه كمقروء ونخفيه من القائمة
   */
  markNotificationAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: updatedNotification => {
          // إزالة الإشعار من القائمة (لأننا نعرض غير المقروء فقط)
          this.notifications = this.notifications.filter(n => n.id !== notification.id);

          // تحديث الإحصائيات المحلية
          if (this.notificationStats) {
            this.notificationStats.unread = Math.max(0, this.notificationStats.unread - 1);
            this.notificationCount = this.notificationStats.unread;
          } else {
            // في حال عدم وجود إحصائيات، نحدّث عدّاد الشارة يدوياً
            this.notificationCount = Math.max(0, this.notificationCount - 1);
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

    if (this.isThemeColorMenuOpen) {
      const clickedMenu = this.themeMenuPanelRef?.nativeElement?.contains(event.target);
      const clickedButton = this.themeMenuButtonRef?.nativeElement?.contains(event.target);
      if (!clickedMenu && !clickedButton) {
        this.isThemeColorMenuOpen = false;
      }
    }
  }
}

