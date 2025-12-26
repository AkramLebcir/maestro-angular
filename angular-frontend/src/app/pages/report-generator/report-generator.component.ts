import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ClassOption {
  id: number;
  name: string;
}

interface StudentOption {
  id: number;
  firstName: string;
  lastName?: string;
}

@Component({
  standalone: false,
  selector: 'app-report-generator',
  templateUrl: './report-generator.component.html',
  styleUrls: ['./report-generator.component.css']
})
export class ReportGeneratorComponent implements OnInit {
  @ViewChild('reportPreview') reportPreview!: ElementRef;
  @Input() embedMode = false;

  classes: ClassOption[] = [];
  students: StudentOption[] = [];
  selectedClassId?: number;
  selectedStudentId?: number;
  
  reportType: 'ACADEMIC' | 'BEHAVIORAL' | 'FOLLOW_UP' | 'CHEATING' = 'BEHAVIORAL';
  reportReason?: string;
  
  generatedContent = '';
  additionalDetails = '';
  recommendations = '';
  
  teacherName = '';
  reportDate = new Date();
  schoolName = 'اسم المؤسسة هنا'; // Default placeholder - will be loaded from teacher card
  
  isSubmitting = false;
  isExporting = false;
  message = '';
  errorMessage = '';

  reasonsMap = {
    ACADEMIC: [
      'ضعف في استيعاب المفاهيم الأساسية',
      'تراجع ملحوظ في النتائج',
      'إهمال الواجبات المنزلية بصفة متكررة',
      'عدم المشاركة داخل القسم',
      'تفوق ملحوظ ومشاركة فعالة'
    ],
    BEHAVIORAL: [
      'ملاحظة تدني في الانضباط',
      'التشويش المستمر داخل القسم',
      'عدم إحضار اللوازم المدرسية',
      'استعمال الهاتف النقال',
      'سلوك عدواني مع الزملاء',
      'مشاركة إيجابية وسلوك مثالي'
    ],
    FOLLOW_UP: [
      'غياب متكرر دون مبرر',
      'تأخرات صباحية متكررة',
      'استدعاء ولي الأمر للأهمية',
      'متابعة ملف صحي/اجتماعي'
    ],
    CHEATING: [
      'محاولة غش في الفرض المحروس',
      'نقل الواجب المنزلي من الزملاء',
      'ضبط وسيلة غش أثناء الامتحان'
    ]
  };

  private reasonKeyMap: Record<string, string> = {
    // Academic
    'ضعف في استيعاب المفاهيم الأساسية': 'reportReason.academic.weakConcepts',
    'تراجع ملحوظ في النتائج': 'reportReason.academic.declineResults',
    'إهمال الواجبات المنزلية بصفة متكررة': 'reportReason.academic.neglectedHomework',
    'عدم المشاركة داخل القسم': 'reportReason.academic.noParticipation',
    'تفوق ملحوظ ومشاركة فعالة': 'reportReason.academic.excellence',
    // Behavioral
    'ملاحظة تدني في الانضباط': 'reportReason.behavioral.discipline',
    'التشويش المستمر داخل القسم': 'reportReason.behavioral.disruption',
    'عدم إحضار اللوازم المدرسية': 'reportReason.behavioral.noSupplies',
    'استعمال الهاتف النقال': 'reportReason.behavioral.phoneUse',
    'سلوك عدواني مع الزملاء': 'reportReason.behavioral.aggressive',
    'مشاركة إيجابية وسلوك مثالي': 'reportReason.behavioral.exemplary',
    // Follow-up
    'غياب متكرر دون مبرر': 'reportReason.followup.repeatedAbsence',
    'تأخرات صباحية متكررة': 'reportReason.followup.lateness',
    'استدعاء ولي الأمر للأهمية': 'reportReason.followup.summonParent',
    'متابعة ملف صحي/اجتماعي': 'reportReason.followup.healthSocial',
    // Cheating
    'محاولة غش في الفرض المحروس': 'reportReason.cheating.attempt',
    'نقل الواجب المنزلي من الزملاء': 'reportReason.cheating.homeworkCopy',
    'ضبط وسيلة غش أثناء الامتحان': 'reportReason.cheating.examDevice'
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public languageService: LanguageService
  ) {}

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.teacherName = user ? `${user.firstName} ${user.lastName}` : 'الأستاذ';
    
    // Try to get school name from local storage teacherCard
    const storedCard = localStorage.getItem('teacherCard');
    if (storedCard) {
      try {
        const cardData = JSON.parse(storedCard);
        if (cardData.schoolName) {
          this.schoolName = cardData.schoolName;
        }
      } catch (e) {
        console.error('Error parsing teacher card', e);
      }
    }

    this.loadClasses();
  }

  loadClasses() {
    this.apiService.get<ClassOption[]>('/classes').subscribe({
      next: (data) => this.classes = data,
      error: () => this.errorMessage = this.translate('common.error') + ': ' + this.translate('report.class')
    });
  }

  onClassChange() {
    if (!this.selectedClassId) return;
    this.apiService.get<StudentOption[]>(`/students?classId=${this.selectedClassId}`).subscribe({
      next: (data) => {
        this.students = data;
        this.selectedStudentId = undefined;
      },
      error: () => this.errorMessage = this.translate('common.error') + ': ' + this.translate('report.student')
    });
  }

  onStudentChange() {
    this.generateContent();
  }

  onTypeChange() {
    this.reportReason = undefined;
    this.generateContent();
  }

  getReasons(): string[] {
    return this.reasonsMap[this.reportType] || [];
  }

  getTranslatedReason(reason: string): string {
    const key = this.reasonKeyMap[reason];
    if (key) {
      return this.translate(key);
    }
    return reason;
  }

  getOriginalReason(translatedReason: string | undefined): string {
    if (!translatedReason) {
      return '';
    }
    // Find the Arabic reason that matches the translated reason
    for (const [arabicReason, key] of Object.entries(this.reasonKeyMap)) {
      if (this.translate(key) === translatedReason) {
        return arabicReason;
      }
    }
    // If not found, return the reason as-is (might be already in Arabic)
    return translatedReason;
  }

  generateContent() {
    if (!this.selectedStudentId || !this.reportReason) {
      this.generatedContent = '';
      return;
    }

    const student = this.students.find(s => s.id == this.selectedStudentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : this.translate('report.student');

    // Translate the reason for use in the template
    const translatedReason = this.getTranslatedReason(this.reportReason);

    let templateKey = '';

    switch (this.reportType) {
      case 'BEHAVIORAL':
        templateKey = 'report.template.behavioral';
        break;
      case 'ACADEMIC':
        templateKey = 'report.template.academic';
        break;
      case 'CHEATING':
        templateKey = 'report.template.cheating';
        break;
      case 'FOLLOW_UP':
        templateKey = 'report.template.followUp';
        break;
    }

    if (templateKey) {
      this.generatedContent = this.translate(templateKey, {
        student: studentName,
        reason: translatedReason
      });
    } else {
      this.generatedContent = '';
    }
  }

  getReportTitle(): string {
    switch (this.reportType) {
      case 'ACADEMIC': return this.translate('report.titleAcademic');
      case 'BEHAVIORAL': return this.translate('report.titleBehavioral');
      case 'CHEATING': return this.translate('report.titleCheating');
      case 'FOLLOW_UP': return this.translate('report.titleFollowUp');
      default: return this.translate('report.setup');
    }
  }

  get selectedStudent() {
    return this.students.find(s => s.id == this.selectedStudentId);
  }

  get selectedClass() {
    return this.classes.find(c => c.id == this.selectedClassId);
  }

  async saveAndPrint() {
    if (!this.selectedStudentId || !this.generatedContent) {
      this.errorMessage = this.translate('common.required');
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    this.errorMessage = '';

    // Convert translated reason back to Arabic for backend storage
    const originalReason = this.reportReason ? this.getOriginalReason(this.reportReason) : undefined;

    // 1. Save to Backend
    const payload = {
      studentId: this.selectedStudentId,
      classId: this.selectedClassId,
      date: this.reportDate,
      type: this.reportType,
      reason: originalReason,
      description: this.generatedContent + (this.additionalDetails ? `\n\n${this.translate('report.additionalNotes')}: ${this.additionalDetails}` : ''),
      recommendations: this.recommendations
    };

    this.apiService.post('/behavior-events/report', payload).subscribe({
      next: async () => {
        this.message = this.translate('report.success');
        await this.generatePdf();
        this.isSubmitting = false;
      },
      error: () => {
        this.errorMessage = this.translate('report.error');
        this.isSubmitting = false;
      }
    });
  }

  async generatePdf() {
    const element = this.reportPreview.nativeElement;
    
    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const filename = `تقرير-${this.selectedStudent?.firstName}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  }

  async exportPenaltiesToPDF(): Promise<void> {
    if (!this.selectedStudentId || !this.reportPreview?.nativeElement) {
      this.errorMessage = this.translate('common.select') + ' ' + this.translate('report.student');
      return;
    }

    if (!this.generatedContent) {
      this.errorMessage = this.translate('report.content') + ' ' + this.translate('common.required');
      return;
    }

    this.isExporting = true;
    this.errorMessage = '';

    try {
      await this.generatePdf();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.errorMessage = this.translate('certificate.exportError');
    } finally {
      this.isExporting = false;
    }
  }
}
