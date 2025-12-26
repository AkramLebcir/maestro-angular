import { Component, OnInit, OnDestroy } from '@angular/core';
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
  identifier: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  private loginSubscription?: Subscription;
  recaptchaSiteKey: string = environment.recaptchaSiteKey;
  captchaToken: string = '';

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
    if (!this.identifier || !this.password) {
      this.errorMessage = this.translate('login.username') + ' / ' + this.translate('login.password') + ' ' + this.translate('common.required');
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
        // Redirect based on role
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || this.translate('login.error');
      }
    });
  }

  onCaptchaResolved(captchaToken: string): void {
    this.captchaToken = captchaToken;
  }

  onCaptchaExpired(): void {
    this.captchaToken = '';
  }

  onCaptchaError(): void {
    this.captchaToken = '';
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }

  }
}


