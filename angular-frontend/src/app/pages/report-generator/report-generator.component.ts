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

  generateContent() {
    if (!this.selectedStudentId || !this.reportReason) {
      this.generatedContent = '';
      return;
    }

    const student = this.students.find(s => s.id == this.selectedStudentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : this.translate('report.student');

    let template = '';

    switch (this.reportType) {
      case 'BEHAVIORAL':
        template = `بناءً على متابعتنا المستمرة للتلميذ(ة) ${studentName}، تم تسجيل ملاحظة سلوكية تتعلق بـ "${this.reportReason}". 
نود إحاطتكم علماً بأن هذا السلوك يؤثر سلباً على السير الحسن للدرس وعلى تركيز التلميذ وزملائه. وعليه، فإننا نؤكد على ضرورة الالتزام بالنظام الداخلي للمؤسسة.`;
        break;
      case 'ACADEMIC':
        template = `من خلال تقييمنا للمسار الدراسي للتلميذ(ة) ${studentName}، لاحظنا ${this.reportReason}. 
هذا الأمر يستدعي تضافر الجهود بين المدرسة والمنزل لتدارك النقائص وتعزيز المكتسبات، لضمان تحقيق نتائج أفضل في المستقبل.`;
        break;
      case 'CHEATING':
        template = `يؤسفنا إبلاغكم بأنه تم ضبط التلميذ(ة) ${studentName} في حالة مخالفة لقواعد النزاهة الأكاديمية، والمتمثلة في ${this.reportReason}. 
يعتبر هذا التصرف مخالفاً للقانون الداخلي ويستوجب إجراءات تأديبية لضمان تكافؤ الفرص بين الجميع.`;
        break;
      case 'FOLLOW_UP':
        template = `في إطار المتابعة التربوية للتلميذ(ة) ${studentName}، نلفت انتباهكم إلى ${this.reportReason}. 
نرجو منكم الحضور أو التواصل مع إدارة المؤسسة في أقرب وقت لمناقشة الوضع واتخاذ التدابير اللازمة.`;
        break;
    }

    this.generatedContent = template;
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

    // 1. Save to Backend
    const payload = {
      studentId: this.selectedStudentId,
      classId: this.selectedClassId,
      date: this.reportDate,
      type: this.reportType,
      reason: this.reportReason,
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
