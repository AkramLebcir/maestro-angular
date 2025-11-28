import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService, LanguageCode } from '../../services/language.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  teacherName = 'الأستاذ';
  teacherPhotoUrl: string | null = null;
  notificationCount = 3;

  @Output() toggleMenu = new EventEmitter<void>();

  // إعدادات اللغة الحالية وقائمة اللغات المتاحة
  currentLanguageCode: LanguageCode = 'AR';
  isLanguageMenuOpen = false;
  private languageSubscription?: Subscription;

  constructor(public languageService: LanguageService) {}

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

    // جلب بيانات بطاقة الأستاذ من التخزين المحلي إن وُجدت
    const stored = localStorage.getItem('teacherCard');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';

        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
          this.teacherName = fullName;
        }

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
  }
}


