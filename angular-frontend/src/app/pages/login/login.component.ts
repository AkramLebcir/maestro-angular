import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  identifier: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
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

    this.authService.login(this.identifier, this.password, this.captchaToken).subscribe({
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
        this.captchaToken = '';
        this.errorMessage = error?.error?.message || this.translate('login.error');
      }
    });
  }
}


