import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  Inject,
} from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CertificateService, CertificateTemplate } from '../../services/certificate.service';
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
  selector: 'app-certificate-generator',
  templateUrl: './certificate-generator.component.html',
  styleUrls: ['./certificate-generator.component.css'],
})
export class CertificateGeneratorComponent implements OnInit, OnDestroy {
  @ViewChild('certificatePreview', { static: false })
  certificatePreview?: ElementRef<HTMLDivElement>;
  @Input()
  embedMode = false;

  classes: ClassOption[] = [];
  students: StudentOption[] = [];
  selectedClassId?: number;
  selectedStudentId?: number;
  selectedTemplateId?: number;
  selectedTemplateName?: string;

  mainText = '';
  reason = '';
  issueDate = new Date().toISOString().slice(0, 10);
  academicYear = this.buildAcademicYear();
  signatureName = '';

  isLoadingStudents = false;
  isSubmitting = false;
  isExporting = false;
  message = '';
  errorMessage = '';

  availableTemplates: CertificateTemplate[] = [];
  private languageSubscription?: any;

  constructor(
    private certificateService: CertificateService,
    private apiService: ApiService,
    private authService: AuthService,
    @Inject('LanguageService') public languageService: LanguageService,
  ) {}

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  ngOnInit(): void {
    this.signatureName = this.authService
      .getCurrentUser()
      ?.firstName
      ? `${this.authService.getCurrentUser()?.firstName ?? ''} ${
          this.authService.getCurrentUser()?.lastName ?? ''
        }`.trim()
      : '';
    this.loadClasses();
    this.loadTemplates();
    
    // Subscribe to language changes to update certificate content
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      // Update content when language changes if a template is selected
      if (this.selectedTemplateId) {
        const template = this.availableTemplates.find((tpl) => tpl.id === this.selectedTemplateId);
        if (template) {
          const translatedMainText = this.getTranslatedMainText(template.name, template.defaultMainText);
          const translatedReason = this.getTranslatedReason(template.name, template.defaultReason);
          this.mainText = this.replaceStudentPlaceholder(translatedMainText);
          this.reason = translatedReason;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private buildAcademicYear(): string {
    const year = new Date().getFullYear();
    return `${year - 1}/${year}`;
  }

  private loadClasses(): void {
    this.apiService.get<ClassOption[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
        if (!this.selectedClassId && this.classes.length) {
          this.selectedClassId = this.classes[0].id;
        }
        this.updateStudents();
      },
      error: () => {
        this.errorMessage = this.translate('common.error') + ': ' + this.translate('certificate.class');
      },
    });
  }

  private loadTemplates(): void {
    this.certificateService.getTemplates().subscribe({
      next: (data) => {
        this.availableTemplates = data;
        if (!this.selectedTemplateId && data.length) {
          this.selectTemplate(data[0].id);
        }
      },
      error: () => {
        this.errorMessage = this.translate('common.error') + ': ' + this.translate('certificate.title');
      },
    });
  }

  updateStudents(): void {
    if (!this.selectedClassId) {
      this.students = [];
      this.selectedStudentId = undefined;
      return;
    }

    this.isLoadingStudents = true;
    this.apiService
      .get<StudentOption[]>(`/students?classId=${this.selectedClassId}`)
      .subscribe({
        next: (data) => {
          this.students = data;
          if (!this.selectedStudentId && data.length) {
            this.selectedStudentId = data[0].id;
          }
          this.updateMainTextPlaceholder();
          this.isLoadingStudents = false;
        },
        error: () => {
          this.errorMessage = this.translate('common.error') + ': ' + this.translate('certificate.student');
          this.isLoadingStudents = false;
        },
      });
  }

  selectTemplate(templateId: number): void {
    const template = this.availableTemplates.find((tpl) => tpl.id === templateId);
    if (!template) {
      return;
    }
    this.selectedTemplateId = template.id;
    this.selectedTemplateName = template.name;
    
    // Translate default main text and reason based on template type
    const translatedMainText = this.getTranslatedMainText(template.name, template.defaultMainText);
    const translatedReason = this.getTranslatedReason(template.name, template.defaultReason);
    
    this.mainText = this.replaceStudentPlaceholder(translatedMainText);
    this.reason = translatedReason;
    this.academicYear = template.defaultAcademicYear;
    this.signatureName = template.defaultSignatureLabel;
  }

  private getTranslatedMainText(templateName: string, defaultText: string): string {
    const student = this.students.find((item) => item.id === this.selectedStudentId);
    const studentName = student ? `${student.firstName} ${student.lastName ?? ''}`.trim() : this.translate('certificate.student');
    
    // Check template type and return translated text
    if (templateName.includes('تفوق دراسي') || templateName.includes('Academic Excellence')) {
      return this.translate('certificate.defaultMainTextAcademicExcellence', { student: studentName });
    } else if (templateName.includes('حسن سلوك') || templateName.includes('Good Conduct')) {
      return this.translate('certificate.defaultMainTextGoodConduct', { student: studentName });
    } else if (templateName.includes('مشاركة فعالة') || templateName.includes('Active Participation')) {
      return this.translate('certificate.defaultMainTextActiveParticipation', { student: studentName });
    }
    // For other templates, use the default text
    return defaultText;
  }

  private getTranslatedReason(templateName: string, defaultReason: string): string {
    // Check template type and return translated reason
    if (templateName.includes('تفوق دراسي') || templateName.includes('Academic Excellence')) {
      return this.translate('certificate.defaultReasonAcademicExcellence');
    } else if (templateName.includes('حسن سلوك') || templateName.includes('Good Conduct')) {
      return this.translate('certificate.defaultReasonGoodConduct');
    } else if (templateName.includes('مشاركة فعالة') || templateName.includes('Active Participation')) {
      return this.translate('certificate.defaultReasonActiveParticipation');
    }
    // For other templates, use the default reason
    return defaultReason;
  }

  private replaceStudentPlaceholder(text: string): string {
    const student = this.students.find((item) => item.id === this.selectedStudentId);
    const fullName = student ? `${student.firstName} ${student.lastName ?? ''}`.trim() : this.translate('certificate.student');
    return text.replace(/{{student}}/g, fullName);
  }

  private updateMainTextPlaceholder(): void {
    if (!this.selectedTemplateId) {
      return;
    }
    const template = this.availableTemplates.find((tpl) => tpl.id === this.selectedTemplateId);
    if (template) {
      // Translate default main text based on template type
      const translatedMainText = this.getTranslatedMainText(template.name, template.defaultMainText);
      this.mainText = this.replaceStudentPlaceholder(translatedMainText);
    }
  }

  issueCertificate(): void {
    if (!this.selectedStudentId || !this.selectedTemplateId) {
      this.errorMessage = this.translate('common.select') + ' ' + this.translate('certificate.student') + ' ' + this.translate('common.and') + ' ' + this.translate('common.template');
      return;
    }
    this.isSubmitting = true;
    this.message = '';
    this.errorMessage = '';

    const payload = {
      studentId: this.selectedStudentId,
      templateId: this.selectedTemplateId,
      mainText: this.mainText,
      reason: this.reason,
      issueDate: this.issueDate,
      academicYear: this.academicYear,
      signatureName: this.signatureName || this.translate('certificate.signature'),
    };

    this.certificateService.issueCertificate(payload).subscribe({
      next: () => {
        this.message = this.translate('certificate.success');
        this.isSubmitting = false;
      },
      error: () => {
        this.errorMessage = this.translate('certificate.error');
        this.isSubmitting = false;
      },
    });
  }

  hasStudent(): boolean {
    return !!this.students.length;
  }

  async downloadPdf(): Promise<void> {
    if (!this.certificatePreview?.nativeElement) {
      return;
    }

    this.isExporting = true;
    const element = this.certificatePreview.nativeElement;
    
    // Create a clone to render off-screen
    // This avoids messing with the live DOM and ensures we can set arbitrary dimensions
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Set styles on clone to ensure it captures full content
    clone.style.width = '1200px'; // Fixed width for A4 landscape consistency
    clone.style.height = 'auto';   // Auto height to fit all content
    clone.style.position = 'absolute';
    clone.style.top = '-10000px';
    clone.style.left = '0';
    clone.style.zIndex = '-1';
    clone.style.overflow = 'visible'; // Ensure nothing is clipped
    
    // Important: Append to body so it can be rendered
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 3, // High quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1200,
        windowHeight: clone.scrollHeight + 50, // Capture full scroll height plus buffer
        backgroundColor: '#ffffff',
        x: 0,
        y: 0
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const student = this.students.find((item) => item.id === this.selectedStudentId);
      const fileName = `${student ? student.firstName : 'certificate'}-certificate.pdf`;
      pdf.save(fileName);

    } catch (err) {
      console.error('PDF Export Error:', err);
      this.errorMessage = this.translate('certificate.exportError');
    } finally {
      // Clean up clone
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      this.isExporting = false;
    }
  }

  getSelectedTheme(): string {
    if (!this.selectedTemplateName) return 'theme-classic';
    if (this.selectedTemplateName.includes('تفوق دراسي')) return 'theme-modern';
    if (this.selectedTemplateName.includes('مشاركة فعالة')) return 'theme-creative';
    return 'theme-classic';
  }

  getTemplateKey(templateName: string): string {
    const templateMap: Record<string, string> = {
      'تقدير تفوق دراسي': 'certificate.templateAcademicExcellence',
      'تقدير حسن سلوك': 'certificate.templateGoodConduct',
      'تقدير مشاركة فعالة': 'certificate.templateActiveParticipation'
    };
    return templateMap[templateName] || '';
  }

  getTemplateTranslation(templateName: string): string {
    const key = this.getTemplateKey(templateName);
    if (key) {
      return this.translate(key);
    }
    return templateName;
  }

  get selectedStudent() {
    return this.students.find((item) => item.id === this.selectedStudentId);
  }
}
