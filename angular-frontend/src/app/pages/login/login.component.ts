import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  // Using signals for reactive state management (Angular 19 best practice)
  identifier = signal<string>('');
  password = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  captchaToken = signal<string>('');
  
  // Computed signal for form validation
  isFormValid = computed(() => {
    return this.identifier().trim().length > 0 && 
           this.password().trim().length > 0 && 
           this.captchaToken().length > 0;
  });

  private loginSubscription?: Subscription;
  readonly recaptchaSiteKey: string = environment.recaptchaSiteKey;

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

  onSubmit(): void {
    const identifierValue = this.identifier().trim();
    const passwordValue = this.password().trim();
    const captchaTokenValue = this.captchaToken();

    if (!identifierValue || !passwordValue) {
      this.errorMessage.set(
        this.translate('login.username') + ' / ' + 
        this.translate('login.password') + ' ' + 
        this.translate('common.required')
      );
      return;
    }

    if (!captchaTokenValue) {
      this.errorMessage.set(this.translate('login.captchaRequired') || 'Please complete the reCAPTCHA verification');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Cancel any existing subscription
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }

    this.loginSubscription = this.authService.login(
      identifierValue, 
      passwordValue, 
      captchaTokenValue
    ).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Redirect based on role
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error?.error?.message || this.translate('login.error'));
        // Reset captcha on error
        this.captchaToken.set('');
      }
    });
  }

  onCaptchaResolved(captchaToken: string | null): void {
    if (captchaToken) {
      this.captchaToken.set(captchaToken);
      // Clear any previous error messages when captcha is resolved
      if (this.errorMessage().includes('reCAPTCHA') || this.errorMessage().includes('captcha')) {
        this.errorMessage.set('');
      }
    } else {
      this.captchaToken.set('');
    }
  }

  onCaptchaExpired(): void {
    this.captchaToken.set('');
  }

  onCaptchaError(): void {
    this.captchaToken.set('');
    this.errorMessage.set(this.translate('login.captchaError') || 'reCAPTCHA verification failed. Please try again.');
  }

  // Helper methods for two-way binding with signals
  updateIdentifier(value: string): void {
    this.identifier.set(value);
  }

  updatePassword(value: string): void {
    this.password.set(value);
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }
}


