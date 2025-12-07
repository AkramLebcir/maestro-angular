import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isAdmin = false;
  menuItems: Array<{ 
    labelKey: string;
    route: string; 
    icon: string; 
    active: boolean;
    adminOnly?: boolean;
  }> = [
    { 
      labelKey: 'menu.dashboard',
      route: '/dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      active: false
    },
    { 
      labelKey: 'menu.teacherCard',
      route: '/teacher-card', 
      icon: 'M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm4 4a3 3 0 100 6 3 3 0 000-6zm7 1h-3m3 4h-5',
      active: false
    },
    { 
      labelKey: 'menu.timetable',
      route: '/timetable', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      active: false
    },
    { 
      labelKey: 'menu.classes',
      route: '/classes', 
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      active: false
    },
    { 
      labelKey: 'menu.students',
      route: '/students', 
      icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      active: false
    },
    { 
      labelKey: 'menu.labs',
      route: '/labs', 
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      active: false
    },
    { 
      labelKey: 'menu.seatingChart',
      route: '/seating-chart', 
      icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
      active: false
    },
    { 
      labelKey: 'menu.topics',
      route: '/topics', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      active: false
    },
    { 
      labelKey: 'menu.notebooks',
      route: '/notebooks', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      active: false
    },
    { 
      labelKey: 'menu.attendance',
      route: '/attendance', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      active: false
    },
    { 
      labelKey: 'menu.behavior',
      route: '/behavior', 
      icon: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
      active: false
    },
    { 
      labelKey: 'menu.gradebook',
      route: '/gradebook', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      active: false
    },
    { 
      labelKey: 'menu.achievementsPenalties',
      route: '/achievements-penalties', 
      icon: 'M5 3h14a2 2 0 012 2v4a5 5 0 01-5 5h-1v3h2a1 1 0 011 1v3H5v-3a1 1 0 011-1h2v-3h-1a5 5 0 01-5-5V5a2 2 0 012-2z',
      active: false
    },
    { 
      labelKey: 'menu.annualDistribution',
      route: '/annual-distribution', 
      icon: 'M4 6h16M4 12h8m-8 6h16', 
      active: false
    },
    { 
      labelKey: 'menu.progressTracking',
      route: '/progress-tracking', 
      icon: 'M3 17l6-6 4 4 7-7', 
      active: false
    },
    { 
      labelKey: 'menu.trainingInspection',
      route: '/training-inspection', 
      icon: 'M5 13l4 4L19 7M5 7h14M5 11h8', 
      active: false
    },
    { 
      labelKey: 'menu.pedagogicalDocs',
      route: '/pedagogical-docs', 
      icon: 'M4 6h16M4 10h16M4 14h10M4 18h6', 
      active: false
    },
    { 
      labelKey: 'menu.clubs',
      route: '/clubs', 
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      active: false
    },
    { 
      labelKey: 'menu.teacherNotebook',
      route: '/teacher-notebook', 
      icon: 'M4 5h16a1 1 0 011 1v11a2 2 0 01-2 2H5a2 2 0 01-2-2V6a1 1 0 011-1zm3 3h8m-8 4h5', 
      active: false
    },
    { 
      labelKey: 'menu.reports',
      route: '/reports', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      active: false
    },
    { 
      labelKey: 'menu.settings',
      route: '/admin', 
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      active: false,
      adminOnly: true
    }
  ];

  private languageSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private router: Router,
    public languageService: LanguageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is admin
    this.isAdmin = this.authService.isAdmin();

    // الاشتراك في تغييرات اللغة
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      // تحديث الترجمة عند تغيير اللغة
    });

    // Set active menu item based on current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentRoute = event.urlAfterRedirects;
        this.menuItems.forEach(item => {
          item.active = currentRoute === item.route || currentRoute.startsWith(item.route + '/');
        });
      });
    
    // Set initial active state
    const currentRoute = this.router.url;
    this.menuItems.forEach(item => {
      item.active = currentRoute === item.route || currentRoute.startsWith(item.route + '/');
    });
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  setActive(index: number): void {
    this.menuItems.forEach((item, i) => {
      item.active = i === index;
    });
  }
}

