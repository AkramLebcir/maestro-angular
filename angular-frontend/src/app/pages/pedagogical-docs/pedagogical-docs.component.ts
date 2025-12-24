import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface PedagogicalDocument {
  id: number;
  title: string;
  type: 'lesson_plan' | 'progression' | 'curriculum' | 'textbook';
  level: string;
  subject?: string;
  originalFileName: string;
  fileUrl: string;
  createdAt: string;
}

@Component({
  selector: 'app-pedagogical-docs',
  templateUrl: './pedagogical-docs.component.html',
  styleUrls: ['./pedagogical-docs.component.css'],
})
export class PedagogicalDocsComponent implements OnInit {
  levels: string[] = [
    '1AP',
    '2AP',
    '3AP',
    '4AP',
    '5AP',
    '1AM',
    '2AM',
    '3AM',
    '4AM',
    '1AS',
    '2AS',
    '3AS',
  ];

  types: { value: PedagogicalDocument['type']; labelKey: string }[] = [
    { value: 'lesson_plan', labelKey: 'pedagogicalDocs.dailyNote' },
    { value: 'progression', labelKey: 'pedagogicalDocs.annualProgression' },
    { value: 'curriculum', labelKey: 'pedagogicalDocs.curriculum' },
    { value: 'textbook', labelKey: 'pedagogicalDocs.textbook' },
  ];

  selectedLevelFilter: string | 'all' = 'all';
  selectedTypeFilter: PedagogicalDocument['type'] | 'all' = 'all';

  docs: PedagogicalDocument[] = [];
  loading = false;
  errorMessage = '';

  // Upload form
  newDoc: {
    title: string;
    level: string;
    type: PedagogicalDocument['type'] | '';
    subject: string;
    file: File | null;
  } = {
    title: '',
    level: '',
    type: '',
    subject: '',
    file: null,
  };

  uploadInProgress = false;

  // Flipbook preview
  selectedDoc: PedagogicalDocument | null = null;

  // AI Lesson Plan Generator
  activeTab: 'documents' | 'generator' = 'documents';
  generatingLessonPlan = false;
  teachingSubject: string = '';
  lessonPlanForm: {
    level: string;
    section: string;
    conceptualField: string;
    conceptualUnit: string;
    lessonTitle: string;
    targetCompetency: string;
    classLevel: 'ضعيف' | 'متوسط' | 'ممتاز';
    sessionDuration: number;
  } = {
    level: '',
    section: '',
    conceptualField: '',
    conceptualUnit: '',
    lessonTitle: '',
    targetCompetency: '',
    classLevel: 'متوسط',
    sessionDuration: 60,
  };
  selectedClassId?: number;
  generatedLessonPlan: any = null;
  classes: any[] = [];

  constructor(
    private api: ApiService,
    public languageService: LanguageService,
    private authService: AuthService
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    this.loadDocs();
    this.loadClasses();
    this.loadTeachingSubject();
  }

  loadTeachingSubject(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }

    // محاولة جلب المادة الدراسية من البطاقة الفنية
    const storageKey = `teacherCard_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const card = JSON.parse(stored);
        this.teachingSubject = card.teachingSubject || '';
      } catch (error) {
        console.error('Error parsing teacher card data:', error);
      }
    }
  }

  loadClasses(): void {
    this.api.get<any[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data || [];
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      },
    });
  }

  onClassSelected(classId: number): void {
    const selectedClass = this.classes.find((c) => c.id === classId);
    if (selectedClass) {
      // تحويل level من التنسيق الإنجليزي إلى العربي
      const levelMap: { [key: string]: string } = {
        '1st_year_middle': '1AM',
        '2nd_year_middle': '2AM',
        '3rd_year_middle': '3AM',
        '4th_year_middle': '4AM',
        '1st_year_high': '1AS',
        '2nd_year_high': '2AS',
        '3rd_year_high': '3AS',
      };
      this.lessonPlanForm.level = levelMap[selectedClass.level] || selectedClass.level;
      this.lessonPlanForm.section = selectedClass.name || '';
    }
  }

  switchTab(tab: 'documents' | 'generator'): void {
    this.activeTab = tab;
    if (tab === 'generator') {
      this.loadTeachingSubject();
      this.generatedLessonPlan = null;
      this.selectedClassId = undefined;
      this.lessonPlanForm = {
        level: '',
        section: '',
        conceptualField: '',
        conceptualUnit: '',
        lessonTitle: '',
        targetCompetency: '',
        classLevel: 'متوسط',
        sessionDuration: 60,
      };
    }
  }

  generateLessonPlan(): void {
    if (
      !this.lessonPlanForm.level ||
      !this.lessonPlanForm.section ||
      !this.lessonPlanForm.conceptualField ||
      !this.lessonPlanForm.conceptualUnit ||
      !this.lessonPlanForm.lessonTitle ||
      !this.lessonPlanForm.targetCompetency
    ) {
      this.errorMessage = 'الرجاء ملء جميع الحقول المطلوبة.';
      return;
    }

    if (!this.teachingSubject) {
      this.errorMessage = 'الرجاء إضافة المادة الدراسية في البطاقة الفنية أولاً.';
      return;
    }

    this.generatingLessonPlan = true;
    this.errorMessage = '';

    const payload = {
      ...this.lessonPlanForm,
      subject: this.teachingSubject,
      sessionDuration: Number(this.lessonPlanForm.sessionDuration),
    };

    this.api.generateLessonPlan(payload).subscribe({
      next: (data) => {
        this.generatedLessonPlan = data;
        this.generatingLessonPlan = false;
      },
      error: (error) => {
        console.error('Error generating lesson plan:', error);
        let errorMessage = 'فشل في توليد خطة الدرس.';
        
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.error) {
          // Handle validation errors
          if (Array.isArray(error.error.error)) {
            errorMessage = error.error.error.join(', ');
          } else if (typeof error.error.error === 'string') {
            errorMessage = error.error.error;
          } else if (error.error.error.message) {
            errorMessage = error.error.error.message;
          }
        } else if (error?.status === 400) {
          errorMessage = 'بيانات غير صحيحة. تأكد من ملء جميع الحقول بشكل صحيح.';
        } else if (error?.status === 500) {
          errorMessage = 'خطأ في الخادم. تأكد من إعداد مفتاح Gemini API في ملف .env.';
        } else if (error?.status === 401) {
          errorMessage = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.';
        } else if (error?.status === 0 || error?.message?.includes('Network')) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل.';
        }
        
        this.errorMessage = errorMessage;
        this.generatingLessonPlan = false;
      },
    });
  }

  exportLessonPlanToPDF(): void {
    if (!this.generatedLessonPlan) {
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // العنوان الرئيسي
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('نموذج خطة الدرس', margin, yPos);
    yPos += 10;

    // معلومات عامة
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const currentDate = this.generatedLessonPlan.date || new Date().toLocaleDateString('ar-SA');
    const teacherName = this.generatedLessonPlan.teacherName || '___________';
    
    pdf.text(`اسم الأستاذ: ${teacherName}`, margin, yPos);
    pdf.text(`التاريخ : ${currentDate}`, pageWidth - margin - 50, yPos);
    yPos += 7;

    pdf.text(`المستوى : ${this.generatedLessonPlan.level}`, margin, yPos);
    pdf.text(`الشعبة : ${this.generatedLessonPlan.section}`, pageWidth - margin - 50, yPos);
    yPos += 7;

    pdf.text(`مذكرة رقم: ${this.generatedLessonPlan.memoNumber || '___________'}`, margin, yPos);
    yPos += 7;

    pdf.text(`المجال المفاهمي (الميدان): ${this.generatedLessonPlan.conceptualField}`, margin, yPos);
    yPos += 7;

    pdf.text(`الوحدة المفاهمية (المقطع): ${this.generatedLessonPlan.conceptualUnit}`, margin, yPos);
    yPos += 10;

    // الهدف
    pdf.setFont('helvetica', 'bold');
    pdf.text('الهدف: تحديد.', margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    const objectiveText = this.generatedLessonPlan.objective || '';
    const objectiveLines = pdf.splitTextToSize(`يتعرف على.. ${objectiveText}`, contentWidth);
    pdf.text(objectiveLines, margin, yPos);
    yPos += objectiveLines.length * 7 + 5;

    // النشاط الحالي (إن وجد)
    if (this.generatedLessonPlan.currentActivity) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('القيام الآن: نشاط مستقل يثير الاهتمام في الدرس:', margin, yPos);
      yPos += 7;
      pdf.setFont('helvetica', 'normal');
      const activityLines = pdf.splitTextToSize(this.generatedLessonPlan.currentActivity, contentWidth);
      pdf.text(activityLines, margin, yPos);
      yPos += activityLines.length * 7 + 10;
    }

    // الجدول
    const tableHeaders = ['الوقت', 'مرحله الدرس', 'السير المنهجي والاستراتيجيات المتبعة', 'الاستراتيجية', 'الموارد المطلوبة', 'ملاحظات'];
    const tableData: any[] = [];

    if (this.generatedLessonPlan.stages && this.generatedLessonPlan.stages.length > 0) {
      this.generatedLessonPlan.stages.forEach((stage: any) => {
        tableData.push([
          stage.time || 'دقيقة',
          stage.stage || '',
          stage.methodologicalApproach || '',
          stage.strategy || '',
          stage.requiredResources || '',
          stage.notes || '',
        ]);
      });
    }

    // إضافة الجدول باستخدام autoTable
    (pdf as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPos,
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: [0, 0, 0],
        cellPadding: 2,
        halign: 'right',
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'right',
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' }, // الوقت
        1: { cellWidth: 25, halign: 'right' }, // مرحلة الدرس
        2: { cellWidth: 55, halign: 'right' }, // السير المنهجي
        3: { cellWidth: 28, halign: 'right' }, // الاستراتيجية
        4: { cellWidth: 35, halign: 'right' }, // الموارد
        5: { cellWidth: 25, halign: 'right' }, // ملاحظات
      },
      margin: { left: margin, right: margin },
      theme: 'grid',
    });

    // حفظ الملف
    const fileName = `خطة_الدرس_${Date.now()}.pdf`;
    pdf.save(fileName);
  }

  loadDocs(): void {
    this.loading = true;
    this.errorMessage = '';

    const filters: { level?: string; type?: string } = {};
    if (this.selectedLevelFilter !== 'all') {
      filters.level = this.selectedLevelFilter;
    }
    if (this.selectedTypeFilter !== 'all') {
      filters.type = this.selectedTypeFilter;
    }

    this.api.getPedagogicalDocuments(filters).subscribe({
      next: (data) => {
        this.docs = data || [];
        this.loading = false;
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Error loading pedagogical documents:', error);
        // عرض رسالة خطأ أكثر تفصيلاً
        let errorMessage = 'فشل في جلب قائمة الوثائق البيداغوجية.';
        
        if (error?.error?.message) {
          errorMessage += ` ${error.error.message}`;
        } else if (error?.status === 401) {
          errorMessage = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.';
        } else if (error?.status === 403) {
          errorMessage = 'ليس لديك صلاحية للوصول إلى الوثائق البيداغوجية.';
        } else if (error?.status === 404) {
          errorMessage = 'لم يتم العثور على نقطة النهاية. تحقق من إعدادات الخادم.';
        } else if (error?.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
        } else if (error?.status === 0 || error?.message?.includes('Network')) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من الاتصال بالإنترنت وإعدادات الـAPI.';
        }
        
        this.errorMessage = errorMessage;
        this.loading = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newDoc.file = input.files[0];
    }
  }

  submitUpload(): void {
    if (!this.newDoc.title || !this.newDoc.level || !this.newDoc.type || !this.newDoc.file) {
      this.errorMessage = 'الرجاء إدخال العنوان، المستوى، نوع الوثيقة، واختيار ملف.';
      return;
    }
    this.errorMessage = '';
    this.uploadInProgress = true;

    this.api
      .uploadPedagogicalDocument({
        title: this.newDoc.title,
        level: this.newDoc.level,
        type: this.newDoc.type,
        subject: this.newDoc.subject || undefined,
        file: this.newDoc.file,
      })
      .subscribe({
        next: () => {
          this.uploadInProgress = false;
          this.newDoc = {
            title: '',
            level: '',
            type: '',
            subject: '',
            file: null,
          };
          this.loadDocs();
        },
        error: () => {
          this.errorMessage = 'فشل في رفع الوثيقة. تأكد من نوع الملف (PDF/صورة/Word) وحجمه.';
          this.uploadInProgress = false;
        },
      });
  }

  openDoc(doc: PedagogicalDocument): void {
    // إذا كان الملف PDF نفتح في تبويب جديد ليغطي الشاشة بالكامل
    if (this.isPdf(doc)) {
      const url = this.getViewerUrl(doc);
      window.open(url, '_blank');
      return;
    }

    // الملفات الأخرى (صور...) نعرضها داخل النافذة المنبثقة
    this.selectedDoc = doc;
  }

  closePreview(): void {
    this.selectedDoc = null;
  }

  isPdf(doc: PedagogicalDocument): boolean {
    return doc.originalFileName.toLowerCase().endsWith('.pdf');
  }

  getViewerUrl(doc: PedagogicalDocument): string {
    // في التطوير: environment.apiUrl = '/api' → نحتاج إزالة '/api' للحصول على أصل الباكند
    // في الإنتاج: environment.apiUrl قد يكون 'http://localhost:3000' أو دومين كامل.
    const apiBase = environment.apiUrl;
    let backendBase = apiBase;
    if (apiBase === '/api') {
      backendBase = 'http://localhost:3000';
    } else if (apiBase.endsWith('/api')) {
      backendBase = apiBase.replace(/\/api$/, '');
    }
    return `${backendBase}${doc.fileUrl}`;
  }

  deleteDoc(doc: PedagogicalDocument): void {
    if (confirm(`هل أنت متأكد من حذف الوثيقة "${doc.title}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`)) {
      this.api.deletePedagogicalDocument(doc.id).subscribe({
        next: () => {
          this.loadDocs();
        },
        error: (error) => {
          console.error('Error deleting pedagogical document:', error);
          let errorMessage = 'فشل في حذف الوثيقة البيداغوجية.';

          if (error?.error?.message) {
            errorMessage += ` ${error.error.message}`;
          } else if (error?.status === 404) {
            errorMessage = 'الوثيقة غير موجودة أو تم حذفها مسبقاً.';
          } else if (error?.status === 403) {
            errorMessage = 'ليس لديك صلاحية لحذف هذه الوثيقة.';
          }

          this.errorMessage = errorMessage;
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      });
    }
  }
}


