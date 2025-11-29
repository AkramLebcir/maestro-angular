import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LanguageService, LanguageCode } from '../../services/language.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  teacherName = 'الأستاذ';
  teacherPhotoUrl: string | null = null;
  notificationCount = 3;
  currentUser: User | null = null;
  isUserMenuOpen = false;

  @Output() toggleMenu = new EventEmitter<void>();

  // إعدادات اللغة الحالية وقائمة اللغات المتاحة
  currentLanguageCode: LanguageCode = 'AR';
  isLanguageMenuOpen = false;
  private languageSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    public languageService: LanguageService,
    private authService: AuthService,
    private router: Router
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
}


