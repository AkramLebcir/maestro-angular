import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LanguageService, LanguageCode } from './services/language.service';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
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
  showLayout = true; // Show header/sidebar by default
  private languageSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private languageService: LanguageService,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    // Initialize theme service - it will apply theme on construction
  }

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

    // Check route to show/hide layout
    this.updateLayoutVisibility(this.router.url);
    
    // Subscribe to route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateLayoutVisibility(event.urlAfterRedirects);
      });
  }

  private updateLayoutVisibility(url: string): void {
    this.showLayout = !url.includes('/login');
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  get dir(): string {
    return this.currentLanguage === 'AR' ? 'rtl' : 'ltr';
  }
}

