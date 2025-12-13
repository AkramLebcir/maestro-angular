import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LanguageService } from './language.service';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';

type ThemePalette = {
  preview: string;
  values: Record<string, string>;
};

const COLOR_PALETTES: Record<ThemeColor, ThemePalette> = {
  blue: {
    preview: '#2563eb',
    values: {
      'primary-50': '#eff6ff',
      'primary-100': '#dbeafe',
      'primary-200': '#bfdbfe',
      'primary-300': '#93c5fd',
      'primary-400': '#60a5fa',
      'primary-500': '#3b82f6',
      'primary-600': '#2563eb',
      'primary-700': '#1d4ed8',
      'primary-800': '#1e40af',
      'primary-900': '#1e3a8a',
      'primary-400-rgb': '96, 165, 250',
      'primary-500-rgb': '59, 130, 246',
      'primary-700-rgb': '29, 78, 216',
      'primary-800-rgb': '30, 64, 175',
      'primary-900-rgb': '30, 58, 138'
    }
  },
  emerald: {
    preview: '#059669',
    values: {
      'primary-50': '#ecfdf3',
      'primary-100': '#d1fae5',
      'primary-200': '#a7f3d0',
      'primary-300': '#6ee7b7',
      'primary-400': '#34d399',
      'primary-500': '#10b981',
      'primary-600': '#059669',
      'primary-700': '#047857',
      'primary-800': '#065f46',
      'primary-900': '#064e3b',
      'primary-400-rgb': '52, 211, 153',
      'primary-500-rgb': '16, 185, 129',
      'primary-700-rgb': '4, 120, 87',
      'primary-800-rgb': '6, 95, 70',
      'primary-900-rgb': '6, 78, 59'
    }
  },
  purple: {
    preview: '#7c3aed',
    values: {
      'primary-50': '#f5f3ff',
      'primary-100': '#ede9fe',
      'primary-200': '#ddd6fe',
      'primary-300': '#c4b5fd',
      'primary-400': '#a78bfa',
      'primary-500': '#8b5cf6',
      'primary-600': '#7c3aed',
      'primary-700': '#6d28d9',
      'primary-800': '#5b21b6',
      'primary-900': '#4c1d95',
      'primary-400-rgb': '167, 139, 250',
      'primary-500-rgb': '139, 92, 246',
      'primary-700-rgb': '109, 40, 217',
      'primary-800-rgb': '91, 33, 182',
      'primary-900-rgb': '76, 29, 149'
    }
  },
  amber: {
    preview: '#d97706',
    values: {
      'primary-50': '#fffbeb',
      'primary-100': '#fef3c7',
      'primary-200': '#fde68a',
      'primary-300': '#fcd34d',
      'primary-400': '#fbbf24',
      'primary-500': '#f59e0b',
      'primary-600': '#d97706',
      'primary-700': '#b45309',
      'primary-800': '#92400e',
      'primary-900': '#78350f',
      'primary-400-rgb': '251, 191, 36',
      'primary-500-rgb': '245, 158, 11',
      'primary-700-rgb': '180, 83, 9',
      'primary-800-rgb': '146, 64, 14',
      'primary-900-rgb': '120, 53, 15'
    }
  },
  rose: {
    preview: '#e11d48',
    values: {
      'primary-50': '#fff1f2',
      'primary-100': '#ffe4e6',
      'primary-200': '#fecdd3',
      'primary-300': '#fda4af',
      'primary-400': '#fb7185',
      'primary-500': '#f43f5e',
      'primary-600': '#e11d48',
      'primary-700': '#be123c',
      'primary-800': '#9f1239',
      'primary-900': '#881337',
      'primary-400-rgb': '251, 113, 133',
      'primary-500-rgb': '244, 63, 94',
      'primary-700-rgb': '190, 18, 60',
      'primary-800-rgb': '159, 18, 57',
      'primary-900-rgb': '136, 19, 55'
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('light');
  public currentTheme$: Observable<ThemeMode> = this.currentThemeSubject.asObservable();
  private currentColorSubject = new BehaviorSubject<ThemeColor>('blue');
  public currentColor$: Observable<ThemeColor> = this.currentColorSubject.asObservable();

  constructor(private languageService: LanguageService) {
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

    // تعيين لوحة الألوان المحفوظة أو الافتراضية
    const savedColor = localStorage.getItem('appThemeColor') as ThemeColor;
    const initialColor: ThemeColor = savedColor && COLOR_PALETTES[savedColor] ? savedColor : 'blue';
    this.applyColorTheme(initialColor, false);

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

  getCurrentColorTheme(): ThemeColor {
    return this.currentColorSubject.value;
  }

  setTheme(theme: ThemeMode): void {
    this.applyTheme(theme);
    localStorage.setItem('appTheme', theme);
  }

  toggleTheme(): void {
    const newTheme: ThemeMode = this.getCurrentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setColorTheme(color: ThemeColor): void {
    this.applyColorTheme(color);
  }

  getAvailableColors(): ThemeColor[] {
    return Object.keys(COLOR_PALETTES) as ThemeColor[];
  }

  getColorPreview(color: ThemeColor): string {
    return COLOR_PALETTES[color]?.preview || COLOR_PALETTES['blue'].preview;
  }

  getColorName(color: ThemeColor): string {
    return this.languageService.translate(`theme.color.${color}`) || color;
  }

  private applyTheme(theme: ThemeMode): void {
    this.currentThemeSubject.next(theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyColorTheme(color: ThemeColor, persist: boolean = true): void {
    const palette = COLOR_PALETTES[color] || COLOR_PALETTES['blue'];
    Object.entries(palette.values).forEach(([token, value]) => {
      document.documentElement.style.setProperty(`--${token}`, value);
    });
    this.currentColorSubject.next(color);
    document.documentElement.dataset['themeColor'] = color;
    if (persist) {
      localStorage.setItem('appThemeColor', color);
    }
  }
}
