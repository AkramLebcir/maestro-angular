import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  identifier: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  recaptchaSiteKey: string = environment.recaptchaSiteKey;
  captchaToken: string = '';
  private loginSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {}

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onCaptchaResolved(token: string): void {
    this.captchaToken = token;
  }

  onCaptchaExpired(): void {
    this.captchaToken = '';
  }

  onCaptchaError(): void {
    this.captchaToken = '';
    this.errorMessage = this.translate('login.captchaError') || 'حدث خطأ في التحقق من reCAPTCHA';
  }

  onSubmit(): void {
    if (!this.identifier || !this.password) {
      this.errorMessage = this.translate('login.username') + ' / ' + this.translate('login.password') + ' ' + this.translate('common.required');
      return;
    }

    if (!this.captchaToken) {
      this.errorMessage = this.translate('login.captchaRequired') || 'يرجى إكمال التحقق من reCAPTCHA';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Cancel any existing subscription
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }

    this.loginSubscription = this.authService.login(this.identifier, this.password, this.captchaToken).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Reset captcha token to prevent issues during navigation
        this.captchaToken = '';
        // Redirect based on role
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.captchaToken = '';
        this.errorMessage = error?.error?.message || this.translate('login.error');
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }

    // Reset captcha token to help with cleanup
    this.captchaToken = '';
  }
}


