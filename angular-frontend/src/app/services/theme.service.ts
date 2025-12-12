import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('light');
  public currentTheme$: Observable<ThemeMode> = this.currentThemeSubject.asObservable();

  constructor() {
    // جلب المظهر المحفوظ من localStorage أو استخدام النظام الافتراضي
    const savedTheme = localStorage.getItem('appTheme') as ThemeMode;
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      this.applyTheme(savedTheme);
    } else {
      // إذا لم يكن هناك مظهر محفوظ، تحقق من تفضيلات النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme: ThemeMode = prefersDark ? 'dark' : 'light';
      this.applyTheme(systemTheme);
      localStorage.setItem('appTheme', systemTheme);
    }

    // الاستماع لتغييرات تفضيلات النظام
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('appTheme')) {
        const systemTheme: ThemeMode = e.matches ? 'dark' : 'light';
        this.applyTheme(systemTheme);
      }
    });
  }

  getCurrentTheme(): ThemeMode {
    return this.currentThemeSubject.value;
  }

  setTheme(theme: ThemeMode): void {
    this.applyTheme(theme);
    localStorage.setItem('appTheme', theme);
  }

  toggleTheme(): void {
    const newTheme: ThemeMode = this.getCurrentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private applyTheme(theme: ThemeMode): void {
    this.currentThemeSubject.next(theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}




