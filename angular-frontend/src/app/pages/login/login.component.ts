import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'الرجاء إدخال اسم المستخدم/البريد الإلكتروني وكلمة المرور';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.identifier, this.password).subscribe({
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
        this.errorMessage = error?.error?.message || 'خطأ في تسجيل الدخول. الرجاء التحقق من البيانات المدخلة.';
      }
    });
  }
}

