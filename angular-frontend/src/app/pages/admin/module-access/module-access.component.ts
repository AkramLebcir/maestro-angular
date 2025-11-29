import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { AuthService, User } from '../../../services/auth.service';

export interface Module {
  key: string;
  name: string;
  description: string;
}

export interface UserWithModules extends User {
  allowedModules?: string[];
}

@Component({
  selector: 'app-module-access',
  templateUrl: './module-access.component.html',
  styleUrls: ['./module-access.component.css']
})
export class ModuleAccessComponent implements OnInit {
  users: UserWithModules[] = [];
  selectedUser: UserWithModules | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Available modules
  availableModules: Module[] = [
    { key: 'classes', name: 'الأقسام', description: 'إدارة الأقسام والصفوف' },
    { key: 'students', name: 'الطلاب', description: 'إدارة بيانات الطلاب' },
    { key: 'attendance', name: 'الحضور والغياب', description: 'تسجيل حضور الطلاب' },
    { key: 'grades', name: 'الدرجات', description: 'تسجيل وتتبع درجات الطلاب' },
    { key: 'notebooks', name: 'المذكرات', description: 'مذكرات الأستاذ' },
    { key: 'topics', name: 'المواضيع', description: 'إدارة مواضيع الدروس' },
    { key: 'timetable', name: 'جدول الأوقات', description: 'تنظيم الجدول الدراسي' },
    { key: 'progress-tracking', name: 'تتبع التقدم', description: 'متابعة تقدم المنهاج' },
    { key: 'pedagogical-docs', name: 'الوثائق التربوية', description: 'إدارة الوثائق التعليمية' },
    { key: 'training-inspection', name: 'التفتيش التربوي', description: 'سجل التفتيش' },
    { key: 'annual-distribution', name: 'التوزيع السنوي', description: 'توزيع المنهاج السنوي' },
    { key: 'behavior', name: 'السلوك', description: 'تسجيل أحداث السلوك' },
    { key: 'labs', name: 'المختبرات', description: 'إدارة المختبرات' },
    { key: 'lab-management', name: 'إدارة المختبر', description: 'إدارة مخزون المختبر' },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.apiService.get<UserWithModules[]>('/users').subscribe({
      next: (data) => {
        this.users = data.filter(u => u.role === 'teacher'); // Only show teachers
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'حدث خطأ أثناء تحميل قائمة المستخدمين';
        this.isLoading = false;
      }
    });
  }

  selectUser(user: UserWithModules): void {
    this.selectedUser = user;
    this.clearMessages();
  }

  isModuleEnabled(moduleKey: string): boolean {
    if (!this.selectedUser) return false;
    if (this.selectedUser.role === 'admin') return true;
    return this.selectedUser.allowedModules?.includes(moduleKey) ?? false;
  }

  toggleModule(moduleKey: string): void {
    if (!this.selectedUser) return;

    const currentModules = this.selectedUser.allowedModules || [];
    const newModules = this.isModuleEnabled(moduleKey)
      ? currentModules.filter(m => m !== moduleKey)
      : [...currentModules, moduleKey];

    this.updateUserModules(newModules);
  }

  selectAllModules(): void {
    if (!this.selectedUser) return;
    const allModuleKeys = this.availableModules.map(m => m.key);
    this.updateUserModules(allModuleKeys);
  }

  deselectAllModules(): void {
    if (!this.selectedUser) return;
    this.updateUserModules([]);
  }

  private updateUserModules(modules: string[]): void {
    if (!this.selectedUser) return;

    this.isLoading = true;
    this.clearMessages();

    this.apiService.patch(`/users/${this.selectedUser.id}/modules`, { modules }).subscribe({
      next: () => {
        this.selectedUser!.allowedModules = modules;
        this.successMessage = 'تم تحديث الصلاحيات بنجاح';
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating modules:', error);
        this.errorMessage = 'حدث خطأ أثناء تحديث الصلاحيات';
        this.isLoading = false;
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}

