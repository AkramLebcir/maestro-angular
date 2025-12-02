import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ProgressItem {
  teacherId?: number;
  classId: number;
  className: string;
  level: string;
  lastLessonReached: number;
  lessonProgressPercentage: number;
  expectedLesson: number;
  delayOrAdvanceUnits: number;
  delayPercentage: number;
  status: 'advance' | 'delay' | 'onTrack';
}

interface SubjectProgressResponse {
  subjectId: number;
  subjectNameAr: string;
  level: string;
  totalLessons: number;
  currentDate: string;
  currentWeek: number;
  expectedLesson: number;
  items: ProgressItem[];
  delayed: ProgressItem[];
  advanced: ProgressItem[];
}

interface GroupedRow {
  teacherId?: number;
  level: string;
  className: string;
  rowSpanTeacher: number;
  rowSpanLevel: number;
  data: ProgressItem;
}

@Component({
  selector: 'app-progress-tracking',
  templateUrl: './progress-tracking.component.html',
  styleUrls: ['./progress-tracking.component.css'],
})
export class ProgressTrackingComponent implements OnInit {
  // يمكن ربطها لاحقاً باختيار من UI، الآن ثابتة لمثال بسيط
  subjectId: number = 1;

  loading = false;
  error?: string;

  overview?: SubjectProgressResponse;
  tableRows: GroupedRow[] = [];

  // اسم الأستاذ (الاسم + اللقب) من البطاقة الفنية المخزنة محلياً
  teacherFullName = '';

  // خريطة لتحويل مستويات enum إلى عبارات عربية
  private levelMap: Record<string, string> = {
    '1st_year_middle': 'السنة الأولى متوسط',
    '2nd_year_middle': 'السنة الثانية متوسط',
    '3rd_year_middle': 'السنة الثالثة متوسط',
    '4th_year_middle': 'السنة الرابعة متوسط',
    '1st_year_high': 'السنة الأولى ثانوي',
    '2nd_year_high': 'السنة الثانية ثانوي',
    '3rd_year_high': 'السنة الثالثة ثانوي',
  };

  // مرجع لعنصر التقرير الذي سيتم تصديره إلى PDF
  @ViewChild('reportContainer') reportContainerRef!: ElementRef<HTMLDivElement>;

  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // تحميل بيانات الأستاذ من البطاقة الفنية المخزنة في localStorage (خاصة بالمستخدم الحالي)
    const user = this.authService.getCurrentUser();
    const storageKey = user ? `teacherCard_${user.id}` : 'teacherCard';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const card = JSON.parse(stored);
        const first = card.firstName || '';
        const last = card.lastName || '';
        this.teacherFullName = `${first} ${last}`.trim();
      } catch {
        this.teacherFullName = '';
      }
    }

    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = undefined;

    this.api
      .get<SubjectProgressResponse>(`/progress-tracking/subject/${this.subjectId}`)
      .subscribe({
        next: (res) => {
          if (res && res.items) {
            this.overview = res;
            this.tableRows = this.buildRowspanTable(res.items);
            this.loading = false;
          } else {
            this.error = 'البيانات المستلمة غير صحيحة';
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error loading progress data:', err);
          // عرض رسالة خطأ أكثر تفصيلاً
          let errorMessage = 'خطأ في جلب بيانات التقدم';
          
          if (err?.error?.message) {
            errorMessage += `: ${err.error.message}`;
          } else if (err?.message) {
            errorMessage += `: ${err.message}`;
          } else if (err?.status === 401) {
            errorMessage = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى';
          } else if (err?.status === 403) {
            errorMessage = 'ليس لديك صلاحية للوصول إلى هذه البيانات';
          } else if (err?.status === 404) {
            errorMessage = 'لم يتم العثور على البيانات المطلوبة';
          } else if (err?.status === 500) {
            errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
          } else if (err?.status === 0) {
            errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من الاتصال بالإنترنت';
          }
          
          this.error = errorMessage;
          this.loading = false;
        },
      });
  }

  private buildRowspanTable(items: ProgressItem[]): GroupedRow[] {
    // تجميع حسب الأستاذ ثم المستوى
    const rows: GroupedRow[] = [];
    const byTeacher = new Map<number | undefined, ProgressItem[]>();

    for (const item of items) {
      const key = item.teacherId;
      if (!byTeacher.has(key)) {
        byTeacher.set(key, []);
      }
      byTeacher.get(key)!.push(item);
    }

    byTeacher.forEach((teacherItems, teacherId) => {
      // تجميع حسب المستوى داخل كل أستاذ
      const byLevel = new Map<string, ProgressItem[]>();
      teacherItems.forEach((it) => {
        const arabicLevel = this.toArabicLevel(it.level);
        if (!byLevel.has(arabicLevel)) {
          byLevel.set(arabicLevel, []);
        }
        byLevel.get(arabicLevel)!.push(it);
      });

      const teacherTotalRows = teacherItems.length;
      let teacherRowCounter = 0;

      byLevel.forEach((levelItems, level) => {
        const levelRows = levelItems.length;
        levelItems.forEach((it, indexInLevel) => {
          const row: GroupedRow = {
            teacherId,
            level,
            className: it.className,
            rowSpanTeacher:
              teacherRowCounter === 0 ? teacherTotalRows : 0,
            rowSpanLevel: indexInLevel === 0 ? levelRows : 0,
            data: it,
          };
          rows.push(row);
          teacherRowCounter++;
        });
      });
    });

    return rows;
  }

  toArabicLevel(level: string): string {
    return this.levelMap[level] || level;
  }

  async downloadPdf(): Promise<void> {
    const element = this.reportContainerRef?.nativeElement;
    if (!element) {
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape مثل النموذج
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 5;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const widthRatio = availableWidth / canvas.width;
      const heightRatio = availableHeight / canvas.height;
      const ratio = Math.min(widthRatio, heightRatio) * 0.98;

      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save('progress-it.pdf');
    } catch (error) {
      console.error('Error generating progress PDF', error);
    }
  }

  formatStatus(row: ProgressItem): string {
    if (row.delayOrAdvanceUnits > 0) return 'متقدم';
    if (row.delayOrAdvanceUnits < 0) return 'متأخر';
    return 'في الموعد';
  }
}


