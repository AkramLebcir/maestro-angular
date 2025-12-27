import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

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
  standalone: false,
  selector: 'app-pedagogical-docs',
  templateUrl: './pedagogical-docs.component.html',
  styleUrls: ['./pedagogical-docs.component.css'],
})
export class PedagogicalDocsComponent implements OnInit {
  classLevels: string[] = [
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
  activeTab: 'documents' | 'generator' | 'create-memo' = 'documents';
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

  // قائمة المستويات الثابتة للمذكرة
  memoLevels: string[] = [
    'ابتدائي',
    'متوسط',
    'ثانوي'
  ];

  // قائمة الشعب الثابتة
  sections: string[] = [
    'جذع مشترك آداب',
    'جذع مشترك علوم وتكنولوجيا',
    'شعبة العلوم التجريبية',
    'شعبة الرياضيات',
    'شعبة التقني رياضي',
    'شعبة التسيير والاقتصاد',
    'شعبة الآداب والفلسفة',
    'شعبة اللغات الأجنبية'
  ];

  // Manual Memo Creation Form
  memoForm: {
    teacherName: string;
    date: string;
    level: string;
    section: string;
    selectedClassId?: number;
    memoNumber: string;
    conceptualField: string;
    conceptualUnit: string;
    objective: string;
    recognizes: string;
    currentActivity: string;
    stages: Array<{
      time: string;
      stage: string;
      methodologicalApproach: string;
      strategy: string;
      requiredResources: string;
      notes: string;
    }>;
  } = {
    teacherName: '',
    date: new Date().toISOString().split('T')[0],
    level: '',
    section: '',
    selectedClassId: undefined,
    memoNumber: '',
    conceptualField: '',
    conceptualUnit: '',
    objective: '',
    recognizes: '',
    currentActivity: '',
    stages: [
      {
        time: '',
        stage: '1) التزام',
        methodologicalApproach: 'الوضعية المشكلة\n(بناء المعرفة المسبقة، والإثارة في الدرس)',
        strategy: '',
        requiredResources: '',
        notes: '',
      },
      {
        time: '',
        stage: '2) تمثيل',
        methodologicalApproach: 'طريقة القاء الدرس بالتفصيل (مقدمه إلى مفهوم الدرس) مع الاستراتيجيات المتبعة في كل عنصر',
        strategy: '',
        requiredResources: '',
        notes: '',
      },
      {
        time: '',
        stage: '3) مشاركه',
        methodologicalApproach: '(تفاعل التلاميذ مع الدرس)',
        strategy: '',
        requiredResources: '',
        notes: '',
      },
      {
        time: '',
        stage: '4) التقييم',
        methodologicalApproach: 'هل وصلت إلى هدفي كمدرس؟',
        strategy: '',
        requiredResources: '',
        notes: '',
      },
    ],
  };

  constructor(
    private api: ApiService,
    public languageService: LanguageService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    this.loadDocs();
    this.loadClasses();
    this.loadTeachingSubject();
    this.loadTeacherName();
    
    // إعداد توسيع textarea تلقائياً بعد تحميل الصفحة
    setTimeout(() => {
      this.setupAutoResizeTextareas();
    }, 500);

    // التحقق من query parameters للتصدير التلقائي
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'create-memo') {
        this.switchTab('create-memo');
      }
      if (params['autoExport'] === '1') {
        // الانتظار قليلاً للتأكد من تحميل الصفحة ثم التصدير
        setTimeout(() => {
          // التحقق من وجود نموذج المذكرة قبل التصدير
          const memoContainer = document.querySelector('.memo-form-container') as HTMLElement;
          if (memoContainer) {
            this.exportMemoToPDF();
          } else {
            // إذا لم يكن النموذج جاهزاً، انتظر قليلاً ثم حاول مرة أخرى
            setTimeout(() => {
              this.exportMemoToPDF();
            }, 500);
          }
          // إزالة query parameter بعد التصدير
          this.router.navigate(['/pedagogical-docs'], {
            queryParams: { tab: 'create-memo' },
            replaceUrl: true
          });
        }, 1500);
      }
    });
  }

  setupAutoResizeTextareas(): void {
    // دالة لتوسيع textarea تلقائياً حسب المحتوى
    const autoResize = (textarea: HTMLTextAreaElement) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    // إضافة event listeners لجميع textareas في الجدول
    const textareas = document.querySelectorAll('.memo-textarea');
    textareas.forEach((textarea: any) => {
      // توسيع عند التحميل
      autoResize(textarea);
      
      // توسيع عند الكتابة
      textarea.addEventListener('input', () => {
        autoResize(textarea);
      });
      
      // توسيع عند تغيير النموذج
      textarea.addEventListener('change', () => {
        autoResize(textarea);
      });
    });
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

  loadTeacherName(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }

    // محاولة جلب اسم الأستاذ من البطاقة الفنية
    const storageKey = `teacherCard_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const card = JSON.parse(stored);
        const firstName = card.firstName || '';
        const lastName = card.lastName || '';
        this.memoForm.teacherName = `${firstName} ${lastName}`.trim();
        
        // إذا لم يكن هناك اسم في البطاقة الفنية، استخدم بيانات المستخدم كبديل
        if (!this.memoForm.teacherName) {
          const userFirstName = user.firstName || '';
          const userLastName = user.lastName || '';
          this.memoForm.teacherName = `${userFirstName} ${userLastName}`.trim() || user.email || '';
        }
      } catch (error) {
        console.error('Error parsing teacher card data:', error);
        // في حالة الخطأ، استخدم بيانات المستخدم كبديل
        const userFirstName = user.firstName || '';
        const userLastName = user.lastName || '';
        this.memoForm.teacherName = `${userFirstName} ${userLastName}`.trim() || user.email || '';
      }
    } else {
      // إذا لم تكن البطاقة الفنية موجودة، استخدم بيانات المستخدم
      const userFirstName = user.firstName || '';
      const userLastName = user.lastName || '';
      this.memoForm.teacherName = `${userFirstName} ${userLastName}`.trim() || user.email || '';
    }
  }

  onMemoClassSelected(classId: number): void {
    const selectedClass = this.classes.find((c) => c.id === classId);
    if (selectedClass) {
      this.memoForm.selectedClassId = classId;
      // لا نغير المستوى أو الشعبة تلقائياً - يختارها المستخدم من القوائم
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

  switchTab(tab: 'documents' | 'generator' | 'create-memo'): void {
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
    } else if (tab === 'create-memo') {
      // Reset memo form with default date
      this.memoForm.date = new Date().toISOString().split('T')[0];
      // إعداد توسيع textarea بعد التبديل للتبويب
      setTimeout(() => {
        this.setupAutoResizeTextareas();
      }, 300);
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
        } else if (error?.status === 0 || error?.message?.includes('Network') || error?.message?.includes('timeout')) {
          errorMessage = 'لا يمكن الاتصال بالخادم أو انتهت مهلة الانتظار. تحقق من اتصالك بالإنترنت وأن الخادم يعمل.';
        } else if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
          errorMessage = 'تم تجاوز الوقت المسموح. يرجى المحاولة مرة أخرى. قد يكون الطلب معقداً جداً.';
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

  printMemo(): void {
    // إخفاء الأزرار قبل الطباعة
    const buttons = document.querySelectorAll('.memo-form-container button');
    buttons.forEach((btn: any) => {
      btn.style.display = 'none';
    });

    // الانتظار قليلاً ثم الطباعة
    setTimeout(() => {
      window.print();
      
      // إعادة عرض الأزرار بعد الطباعة
      setTimeout(() => {
        buttons.forEach((btn: any) => {
          btn.style.display = '';
        });
      }, 500);
    }, 100);
  }

  async exportMemoToPDF(): Promise<void> {
    try {
      const memoContainer = document.querySelector('.memo-form-container') as HTMLElement;
      
      if (!memoContainer) {
        alert('لم يتم العثور على نموذج المذكرة. يرجى التأكد من أنك في تبويب "إنشاء مذكرة".');
        return;
      }

      // حفظ الأنماط الأصلية
      const originalStyles = {
        padding: memoContainer.style.padding,
        marginBottom: memoContainer.style.marginBottom,
        overflow: memoContainer.style.overflow,
      };

      // تحسين التخطيط للتصدير (تقليل المسافات وإزالة overflow)
      memoContainer.style.padding = '10px';
      memoContainer.style.overflow = 'visible';
      
      // إزالة overflow من جميع العناصر الداخلية
      const allElements = memoContainer.querySelectorAll('*');
      const originalOverflows: string[] = [];
      allElements.forEach((el: any) => {
        originalOverflows.push(el.style.overflow);
        el.style.overflow = 'visible';
      });
      
      // توسيع جميع textareas وتأكد من عرض الأسطر بشكل صحيح
      const textareas = memoContainer.querySelectorAll('.memo-textarea');
      const originalHeights: string[] = [];
      const originalDisplays: string[] = [];
      const textareaReplacements: Array<{ textarea: HTMLElement; div: HTMLElement }> = [];
      
      textareas.forEach((textarea: any) => {
        originalHeights.push(textarea.style.height);
        originalDisplays.push(textarea.style.display);
        
        // التأكد من أن textarea تعرض الأسطر بشكل صحيح
        textarea.style.whiteSpace = 'pre-wrap';
        textarea.style.wordWrap = 'break-word';
        textarea.style.overflow = 'visible';
        
        // توسيع textarea أولاً
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = scrollHeight + 'px';
        
        // إنشاء div مؤقت يحاكي textarea لعرض النص مع الأسطر
        const div = document.createElement('div');
        div.textContent = textarea.value || textarea.innerText || '';
        
        // نسخ جميع الأنماط من textarea
        const computedStyle = window.getComputedStyle(textarea);
        div.style.width = textarea.offsetWidth + 'px';
        div.style.padding = computedStyle.padding;
        div.style.margin = computedStyle.margin;
        div.style.fontSize = computedStyle.fontSize;
        div.style.fontFamily = computedStyle.fontFamily;
        div.style.fontWeight = computedStyle.fontWeight;
        div.style.lineHeight = computedStyle.lineHeight;
        div.style.textAlign = computedStyle.textAlign;
        div.style.color = computedStyle.color;
        div.style.backgroundColor = computedStyle.backgroundColor;
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.overflow = 'visible';
        div.style.border = 'none';
        div.style.outline = 'none';
        div.style.boxSizing = 'border-box';
        div.style.direction = computedStyle.direction;
        div.style.verticalAlign = 'top';
        div.style.display = 'block';
        
        // إدراج div مكان textarea
        textarea.parentNode!.insertBefore(div, textarea);
        
        // حساب الارتفاع الفعلي بعد إدراج div في DOM
        const actualHeight = div.scrollHeight;
        div.style.height = actualHeight + 'px';
        div.style.minHeight = actualHeight + 'px';
        
        textareaReplacements.push({ textarea, div });
        
        // إخفاء textarea
        textarea.style.display = 'none';
      });
      
      // إخفاء الأزرار قبل التصدير
      const buttons = memoContainer.querySelectorAll('button');
      const originalButtonDisplays: string[] = [];
      buttons.forEach((btn) => {
        originalButtonDisplays.push(btn.style.display);
        btn.style.display = 'none';
      });

      // الانتظار قليلاً للتأكد من تحديث التخطيط
      await new Promise(resolve => setTimeout(resolve, 500));

      // استخدام html2canvas لالتقاط المحتوى - استخدام scrollWidth و scrollHeight لالتقاط كل المحتوى
      const canvas = await html2canvas(memoContainer, {
        scale: 1.5, // تقليل scale لضمان أن كل شيء يظهر في صفحة واحدة
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: memoContainer.scrollWidth,
        height: memoContainer.scrollHeight,
        windowWidth: memoContainer.scrollWidth,
        windowHeight: memoContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        allowTaint: true,
        removeContainer: false
      });

      // استعادة الأنماط الأصلية
      memoContainer.style.padding = originalStyles.padding;
      memoContainer.style.overflow = originalStyles.overflow;
      
      // استعادة overflow للعناصر
      allElements.forEach((el: any, index) => {
        el.style.overflow = originalOverflows[index] || '';
      });
      
      // استعادة textareas وإزالة divs المؤقتة
      textareaReplacements.forEach(({ textarea, div }, index) => {
        // إعادة عرض textarea
        textarea.style.display = originalDisplays[index] || '';
        // إزالة div المؤقت
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
        // استعادة ارتفاع textarea
        if (originalHeights && originalHeights[index] !== undefined) {
          textarea.style.height = originalHeights[index] || '';
        }
      });
      
      // إعادة عرض الأزرار
      buttons.forEach((btn, index) => {
        btn.style.display = originalButtonDisplays[index] || '';
      });

      // إنشاء PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table display
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // حساب الأبعاد لضمان أن كل شيء يظهر في صفحة واحدة
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // إذا كان المحتوى أطول من الصفحة، نقوم بتقليصه ليتناسب مع صفحة واحدة
      let finalImgHeight = imgHeight;
      let finalImgWidth = imgWidth;
      
      if (imgHeight > pageHeight) {
        // تقليص الحجم ليتناسب مع صفحة واحدة
        const scale = pageHeight / imgHeight;
        finalImgHeight = pageHeight;
        finalImgWidth = imgWidth * scale;
        const xOffset = (pageWidth - finalImgWidth) / 2; // توسيط الصورة
        
        pdf.addImage(imgData, 'PNG', xOffset, 0, finalImgWidth, finalImgHeight);
      } else {
        // المحتوى يتناسب مع صفحة واحدة
        pdf.addImage(imgData, 'PNG', 0, 0, finalImgWidth, finalImgHeight);
      }

      // حفظ الملف
      const fileName = `مذكرة_الدرس_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting memo to PDF:', error);
      alert('حدث خطأ أثناء تصدير ملف PDF. يرجى المحاولة مرة أخرى.');
    }
  }
}


