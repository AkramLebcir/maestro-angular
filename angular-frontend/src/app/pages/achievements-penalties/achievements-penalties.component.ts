import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CertificateService } from '../../services/certificate.service';

interface Achievement {
  // ... existing fields if needed, or remove if not used
}

interface ClassOption {
  id: number;
  name: string;
}

interface BehaviorEventDto {
  id: number;
  student?: {
    firstName?: string;
    lastName?: string;
  };
  class?: {
    name?: string;
  };
  date: string;
  description?: string;
}

interface BehaviorReport {
  id: number;
  studentName: string;
  className?: string;
  date: string;
  description: string;
}

interface CertificateHistory {
  id: number;
  studentName: string;
  className: string;
  templateName: string;
  issueDate: string;
}

@Component({
  selector: 'app-achievements-penalties',
  templateUrl: './achievements-penalties.component.html',
  styleUrls: ['./achievements-penalties.component.css'],
})
export class AchievementsPenaltiesComponent implements OnInit {
  activeTab: 'achievements' | 'penalties' = 'achievements';
  // Removed static achievements array as we now load real certificates

  classes: ClassOption[] = [];
  selectedClassId?: number;
  
  // For Penalties tab
  behaviorReports: BehaviorReport[] = [];
  isLoadingReports = false;
  
  // For Achievements tab
  certificateHistory: CertificateHistory[] = [];
  isLoadingCertificates = false;

  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private certificateService: CertificateService
  ) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  onTabChange(tab: 'achievements' | 'penalties'): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    // Load data for the active tab if a class is selected
    if (this.selectedClassId) {
      if (tab === 'penalties') {
        this.loadBehaviorReports();
      } else {
        this.loadCertificateHistory();
      }
    }
  }

  private loadClasses(): void {
    this.apiService.get<ClassOption[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
        if (!this.selectedClassId && this.classes.length) {
          this.selectedClassId = this.classes[0].id;
        }
        // Load initial data
        if (this.activeTab === 'penalties') {
          this.loadBehaviorReports();
        } else {
          this.loadCertificateHistory();
        }
      },
      error: () => {
        this.errorMessage = 'تعذر تحميل قائمة الأقسام';
      },
    });
  }

  onClassChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedClassId = Number(value) || undefined;
    if (this.activeTab === 'penalties') {
      this.loadBehaviorReports();
    } else {
      this.loadCertificateHistory();
    }
  }

  private loadBehaviorReports(): void {
    if (!this.selectedClassId) {
      this.behaviorReports = [];
      return;
    }

    this.isLoadingReports = true;
    this.errorMessage = '';

    this.apiService
      .get<BehaviorEventDto[]>(
        `/behavior-events?classId=${this.selectedClassId}`,
      )
      .subscribe({
        next: (data) => {
          this.behaviorReports = data.map((event) => ({
            id: event.id,
            studentName: this.buildStudentLabel(event.student),
            className: event.class?.name,
            date: new Date(event.date).toLocaleDateString('ar-EG'),
            description: event.description || 'لا يوجد تفاصيل إضافية',
          }));
          this.isLoadingReports = false;
        },
        error: () => {
          this.errorMessage = 'تعذر تحميل تقارير السلوك';
          this.behaviorReports = [];
          this.isLoadingReports = false;
        },
      });
  }

  private loadCertificateHistory(): void {
    if (!this.selectedClassId) {
      this.certificateHistory = [];
      return;
    }

    this.isLoadingCertificates = true;
    this.errorMessage = '';

    this.certificateService.getCertificates(undefined, this.selectedClassId).subscribe({
      next: (data) => {
        this.certificateHistory = data.map((cert) => ({
          id: cert.id,
          studentName: `${cert.student.firstName} ${cert.student.lastName}`,
          className: cert.className || '',
          templateName: cert.template?.name || 'شهادة',
          issueDate: new Date(cert.issueDate).toLocaleDateString('ar-EG')
        }));
        this.isLoadingCertificates = false;
      },
      error: () => {
        this.errorMessage = 'تعذر تحميل سجل الشهادات';
        this.certificateHistory = [];
        this.isLoadingCertificates = false;
      }
    });
  }

  private buildStudentLabel(student?: { firstName?: string; lastName?: string }): string {
    if (!student) {
      return 'طالب غير معروف';
    }
    const fullName = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
    return fullName || 'طالب غير معروف';
  }
}

