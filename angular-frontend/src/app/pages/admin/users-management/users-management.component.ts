import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { AuthService, User } from '../../../services/auth.service';
import { LanguageService } from '../../../services/language.service';

export interface UserListItem extends User {
  lastLoginAt?: string;
  createdAt: string;
}

@Component({
  standalone: false,
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {
  users: UserListItem[] = [];
  isLoading: boolean = false;
  showUserForm: boolean = false;
  editingUser: UserListItem | null = null;
  
  // Form data
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'teacher' as 'admin' | 'teacher',
    isActive: true
  };

  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Verify user is admin before loading
    if (!this.authService.isAdmin()) {
      this.errorMessage = 'ليس لديك صلاحيات للوصول إلى هذه الصفحة. يجب أن تكون مسؤولاً.';
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.apiService.get<UserListItem[]>('/users').subscribe({
      next: (data) => {
        this.users = data || [];
        this.isLoading = false;
        this.clearMessages();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        let errorMsg = 'حدث خطأ أثناء تحميل قائمة المستخدمين';
        
        if (error.status === 401) {
          errorMsg = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.';
        } else if (error.status === 403) {
          errorMsg = 'ليس لديك صلاحيات للوصول إلى هذه الصفحة. يجب أن تكون مسؤولاً.';
        } else if (error.status === 0 || error.status === 504) {
          errorMsg = 'لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل.';
        } else if (error.error?.message) {
          errorMsg = `خطأ: ${error.error.message}`;
        } else if (error.message) {
          errorMsg = `خطأ: ${error.message}`;
        }
        
        this.errorMessage = errorMsg;
        this.users = [];
        this.isLoading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingUser = null;
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: 'teacher',
      isActive: true
    };
    this.showUserForm = true;
    this.clearMessages();
  }

  openEditForm(user: UserListItem): void {
    this.editingUser = user;
    this.formData = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      username: user.username || '',
      password: '', // Don't pre-fill password
      role: user.role,
      isActive: user.isActive
    };
    this.showUserForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showUserForm = false;
    this.editingUser = null;
    this.clearMessages();
  }

  saveUser(): void {
    if (!this.formData.email) {
      this.errorMessage = 'البريد الإلكتروني مطلوب';
      return;
    }

    if (!this.editingUser && !this.formData.password) {
      this.errorMessage = 'كلمة المرور مطلوبة للمستخدمين الجدد';
      return;
    }

    this.clearMessages();
    this.isLoading = true;

    const payload: any = {
      firstName: this.formData.firstName || undefined,
      lastName: this.formData.lastName || undefined,
      email: this.formData.email,
      username: this.formData.username || undefined,
      role: this.formData.role,
      isActive: this.formData.isActive
    };

    if (this.formData.password) {
      payload.password = this.formData.password;
    }

    const request = this.editingUser
      ? this.apiService.patch<User>(`/users/${this.editingUser.id}`, payload)
      : this.apiService.post<User>('/users', payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingUser ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح';
        this.loadUsers();
        setTimeout(() => {
          this.closeForm();
        }, 1500);
      },
      error: (error) => {
        console.error('Error saving user:', error);
        this.errorMessage = error?.error?.message || 'حدث خطأ أثناء حفظ المستخدم';
        this.isLoading = false;
      }
    });
  }

  toggleUserStatus(user: UserListItem): void {
    if (user.id === this.authService.getCurrentUser()?.id) {
      this.errorMessage = 'لا يمكنك تعطيل حسابك الخاص';
      return;
    }

    this.apiService.patch(`/users/${user.id}/status`, {
      isActive: !user.isActive
    }).subscribe({
      next: () => {
        this.successMessage = `تم ${user.isActive ? 'تعطيل' : 'تفعيل'} المستخدم بنجاح`;
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        this.errorMessage = 'حدث خطأ أثناء تحديث حالة المستخدم';
      }
    });
  }

  deleteUser(user: UserListItem): void {
    if (user.id === this.authService.getCurrentUser()?.id) {
      this.errorMessage = 'لا يمكنك حذف حسابك الخاص';
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.email}"؟`)) {
      return;
    }

    this.apiService.delete(`/users/${user.id}`).subscribe({
      next: () => {
        this.successMessage = 'تم حذف المستخدم بنجاح';
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.errorMessage = 'حدث خطأ أثناء حذف المستخدم';
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'لم يسجل دخول';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn'
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}

