import { Component, OnInit, OnDestroy } from '@angular/core';
import { LanguageService, LanguageCode } from './services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'TeacherKit Plus Informatique';
  isSidebarOpen = false;
  currentLanguage: LanguageCode = 'AR';
  private languageSubscription?: Subscription;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    // تهيئة اللغة عند بدء التطبيق - العربية هي اللغة الافتراضية
    const savedLang = localStorage.getItem('appLanguage') as LanguageCode;
    if (savedLang && ['AR', 'FR', 'EN', 'ES', 'IT', 'DE', 'TR'].includes(savedLang)) {
      this.languageService.setLanguage(savedLang);
    } else {
      // إذا لم تكن هناك لغة محفوظة، استخدم العربية كافتراضية
      this.languageService.setLanguage('AR');
    }
    
    // الاشتراك في تغييرات اللغة
    this.languageSubscription = this.languageService.currentLanguage$.subscribe((lang: LanguageCode) => {
      this.currentLanguage = lang;
    });
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  get dir(): string {
    return this.currentLanguage === 'AR' ? 'rtl' : 'ltr';
  }
}

