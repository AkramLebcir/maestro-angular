import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';

interface Topic {
  id: number;
  title: string;
  subtitle?: string;
}

interface HolidayPeriod {
  id?: number;
  year: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

interface AnnualDistribution {
  id?: number;
  year: string;
  level: string;
  track: string;
  term: number;
  weekNumber: number;
  yearStartDate: string;
  unitTitle: string;
  domain: string;
  notes?: string;
  computedStartDate?: string;
  computedEndDate?: string;
}

interface TimelineRow {
  kind: 'distribution' | 'holiday';
  distribution?: AnnualDistribution;
  holiday?: HolidayPeriod;
  sortDate: string;
}

@Component({
  standalone: false,
  selector: 'app-annual-distribution',
  templateUrl: './annual-distribution.component.html',
  styleUrls: ['./annual-distribution.component.css'],
})
export class AnnualDistributionComponent implements OnInit {
  @ViewChild('distributionPrintArea') distributionPrintArea?: ElementRef<HTMLElement>;
  activeTab: 'holidays' | 'distribution' = 'holidays';

  selectedYear = '';
  years: string[] = [];
  selectedLevel = 'اختر المستوى';
  selectedTrack = 'جذع مشترك علوم وتكنولوجيا';

  tracks: string[] = [
    'جذع مشترك علوم وتكنولوجيا',
    'جذع مشترك آداب',
    'متوسط',
  ];

  levels: string[] = [
    'اختر المستوى',
    'السنة أولى متوسط',
    'السنة ثانية متوسط',
    'السنة ثالثة متوسط',
    'السنة رابعة متوسط',
    'السنة أولى ثانوي',
    'السنة ثانية ثانوي',
    'السنة ثالثة ثانوي',
  ];

  holidays: HolidayPeriod[] = [];
  distributions: AnnualDistribution[] = [];
  timelineRows: TimelineRow[] = [];

  // Topics for linking domain/unit to topics list
  topics: Topic[] = [];
  selectedTopicId: number | null = null;
  topicSubtitles: string[] = [];
  selectedSubtitle = '';

  newHoliday: HolidayPeriod = {
    year: this.selectedYear,
    name: '',
    type: 'HOLIDAY',
    startDate: '',
    endDate: '',
    notes: '',
  };

  newDistribution: AnnualDistribution = {
    year: this.selectedYear,
    level: this.selectedLevel,
    track: this.selectedTrack,
    term: 1,
    weekNumber: 1,
    yearStartDate: '',
    unitTitle: '',
    domain: '',
    notes: '',
  };

  loading = false;
  errorMessage = '';

  constructor(
    private api: ApiService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.initYears();
    this.loadHolidays();
    this.loadDistributions(true);
    this.loadTopics();
  }

  private initYears(): void {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    // إذا كان الشهر من أوت فما بعد، فالسنة الدراسية تبدأ في هذه السنة وتنتهي في السنة الموالية
    const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;

    const prev = `${startYear - 1}-${startYear}`;
    const current = `${startYear}-${startYear + 1}`;
    const next = `${startYear + 1}-${startYear + 2}`;

    this.years = [prev, current, next];
    this.selectedYear = current;
    this.newHoliday.year = this.selectedYear;
    this.newDistribution.year = this.selectedYear;
  }

  setTab(tab: 'holidays' | 'distribution') {
    this.activeTab = tab;
  }

  onYearChange() {
    this.newHoliday.year = this.selectedYear;
    this.newDistribution.year = this.selectedYear;
    this.loadHolidays();
    this.loadDistributions(true);
  }

  loadHolidays() {
    this.loading = true;
    this.api
      .get<HolidayPeriod[]>(`/annual-planning/holidays?year=${encodeURIComponent(this.selectedYear)}`)
      .subscribe({
        next: (data) => {
          this.holidays = data;
          this.buildTimeline();
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'فشل في جلب بيانات العطل';
          this.loading = false;
        },
      });
  }

  addHoliday() {
    if (!this.newHoliday.name || !this.newHoliday.startDate || !this.newHoliday.endDate) {
      this.errorMessage = 'الرجاء إدخال الاسم وتواريخ البداية والنهاية';
      return;
    }
    this.errorMessage = '';
    this.api.post<HolidayPeriod>('/annual-planning/holidays', this.newHoliday).subscribe({
      next: (created) => {
        this.holidays.push(created);
        this.newHoliday = {
          year: this.selectedYear,
          name: '',
          type: 'HOLIDAY',
          startDate: '',
          endDate: '',
          notes: '',
        };
      },
      error: () => {
        this.errorMessage = 'فشل في إضافة العطلة';
      },
    });
  }

  deleteHoliday(holiday: HolidayPeriod) {
    if (!holiday.id) {
      return;
    }
    this.api.delete<void>(`/annual-planning/holidays/${holiday.id}`).subscribe({
      next: () => {
        this.holidays = this.holidays.filter((h) => h.id !== holiday.id);
      },
      error: () => {
        this.errorMessage = 'فشل في حذف العطلة';
      },
    });
  }

  loadTopics(): void {
    this.api.get<Topic[]>('/topics').subscribe({
      next: (data) => {
        this.topics = data || [];
      },
      error: () => {
        // إذا فشل تحميل المواضيع، نترك الحقول تعمل كنصوص عادية
        this.topics = [];
      },
    });
  }

  loadDistributions(withSchedule = false) {
    this.loading = true;
    const baseUrl = withSchedule
      ? '/annual-planning/distributions/scheduled'
      : '/annual-planning/distributions';
    const params = new URLSearchParams();
    params.set('year', this.selectedYear);
    params.set('level', this.selectedLevel);
    params.set('track', this.selectedTrack);

    this.api.get<AnnualDistribution[]>(`${baseUrl}?${params.toString()}`).subscribe({
      next: (data) => {
        this.distributions = data;
        this.buildTimeline();
        // تحديث رقم الأسبوع التالي بناءً على آخر أسبوع مسجل
        this.newDistribution.weekNumber = this.getNextWeekNumber();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'فشل في جلب التوزيع السنوي';
        this.loading = false;
      },
    });
  }

  /**
   * يحسب رقم الأسبوع التالي انطلاقاً من أول حصة في هذا التوزيع
   * (أكبر رقم أسبوع موجود + 1، أو 1 إذا لم توجد حصص بعد).
   */
  private getNextWeekNumber(): number {
    if (!this.distributions || this.distributions.length === 0) {
      return 1;
    }
    const maxWeek = Math.max(...this.distributions.map((d) => d.weekNumber || 0));
    return maxWeek + 1;
  }

  private buildTimeline() {
    const rows: TimelineRow[] = [];

    // Add distributions with effective start date (computed if available, otherwise base date)
    for (const d of this.distributions) {
      const sortDate = d.computedStartDate || d.yearStartDate;
      if (sortDate) {
        rows.push({
          kind: 'distribution',
          distribution: d,
          sortDate,
        });
      }
    }

    // Add holidays and exams
    for (const h of this.holidays) {
      if (h.startDate) {
        rows.push({
          kind: 'holiday',
          holiday: h,
          sortDate: h.startDate,
        });
      }
    }

    rows.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    this.timelineRows = rows;
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  onTopicTitleChange(): void {
    const topic = this.topics.find((t) => t.id === this.selectedTopicId!);
    if (topic) {
      // ربط المجال بعنوان الموضوع
      this.newDistribution.domain = topic.title;

      // بناء قائمة العناوين الفرعية بناءً على الموضوع المختار (إن وُجدت)
      this.topicSubtitles = topic.subtitle ? [topic.subtitle] : [];
      this.selectedSubtitle = this.topicSubtitles[0] || '';
      this.newDistribution.unitTitle = this.selectedSubtitle;
    } else {
      this.newDistribution.domain = '';
      this.topicSubtitles = [];
      this.selectedSubtitle = '';
      this.newDistribution.unitTitle = '';
    }
  }

  onSubtitleChange(): void {
    // ربط اسم الوحدة / النشاط بالعنوان الفرعي المختار
    this.newDistribution.unitTitle = this.selectedSubtitle || '';
  }

  addDistribution() {
    if (!this.newDistribution.unitTitle || !this.newDistribution.domain || !this.newDistribution.yearStartDate) {
      this.errorMessage = 'الرجاء إدخال عنوان الوحدة، المجال، وتاريخ بداية السنة';
      return;
    }
    this.errorMessage = '';

    // حساب رقم الأسبوع لهذه الحصة اعتماداً على عدد الأسابيع السابقة
    const nextWeekNumber = this.getNextWeekNumber();

    const payload: AnnualDistribution = {
      ...this.newDistribution,
      year: this.selectedYear,
      level: this.selectedLevel,
      track: this.selectedTrack,
      weekNumber: nextWeekNumber,
    };
    this.api.post<AnnualDistribution>('/annual-planning/distributions', payload).subscribe({
      next: () => {
        this.loadDistributions(true);
        // تجهيز النموذج للحصة القادمة مع رقم أسبوع تلقائي تالي
        this.newDistribution = {
          year: this.selectedYear,
          level: this.selectedLevel,
          track: this.selectedTrack,
          term: this.newDistribution.term,
          weekNumber: nextWeekNumber + 1,
          yearStartDate: this.newDistribution.yearStartDate,
          unitTitle: '',
          domain: this.newDistribution.domain,
          notes: '',
        };
      },
      error: () => {
        this.errorMessage = 'فشل في إضافة سطر التوزيع';
      },
    });
  }

  async exportDistributionToPdf(): Promise<void> {
    if (!this.distributions.length) {
      this.errorMessage = 'لا يوجد توزيع لطباعته.';
      return;
    }

    try {
      // نحاول أولاً عبر ViewChild، وإن لم ينجح نستخدم getElementById،
      // وإن فشل ذلك نلتقط كامل محتوى الصفحة كحل أخير.
      const container =
        this.distributionPrintArea?.nativeElement ||
        (document.getElementById('distribution-print-area') as HTMLElement | null) ||
        document.body;

      // استخدام html2canvas لالتقاط الجدول مع النص العربي كما هو
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');

      // نختار A4 بالوضع الأفقي لأن الجدول عريض
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = margin;
      let heightLeft = imgHeight;

      // الصفحة الأولى
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      // صفحات إضافية إذا كان المحتوى أطول من صفحة واحدة
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`التوزيع_السنوي_${this.selectedYear}.pdf`);
    } catch (error) {
      console.error('Error exporting annual distribution PDF:', error);
      this.errorMessage = 'حدث خطأ أثناء تصدير ملف PDF للتوزيع السنوي.';
    }
  }
}


