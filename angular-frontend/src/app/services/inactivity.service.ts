import { Injectable, NgZone } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private readonly INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour
  private timeoutId: any;

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.initListeners();
    this.resetTimer();
  }

  private initListeners(): void {
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => this.resetTimer());
    });
  }

  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Run timer outside Angular to avoid unnecessary change detection
    this.ngZone.runOutsideAngular(() => {
      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          if (this.authService.isAuthenticated()) {
            this.authService.logout();
          }
        });
      }, this.INACTIVITY_LIMIT_MS);
    });
  }
}




