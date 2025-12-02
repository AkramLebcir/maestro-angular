import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../environments/environment';

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

  constructor(
    private api: ApiService,
    public languageService: LanguageService
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    this.loadDocs();
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
}


