import { Component, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';
import { ApiService } from '../../services/api.service';

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

@Component({
  selector: 'app-annual-distribution',
  templateUrl: './annual-distribution.component.html',
  styleUrls: ['./annual-distribution.component.css'],
})
export class AnnualDistributionComponent implements OnInit {
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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.initYears();
    this.loadHolidays();
    this.loadDistributions(true);
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
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'فشل في جلب التوزيع السنوي';
        this.loading = false;
      },
    });
  }

  addDistribution() {
    if (!this.newDistribution.unitTitle || !this.newDistribution.domain || !this.newDistribution.yearStartDate) {
      this.errorMessage = 'الرجاء إدخال عنوان الوحدة، المجال، وتاريخ بداية السنة';
      return;
    }
    this.errorMessage = '';
    const payload: AnnualDistribution = {
      ...this.newDistribution,
      year: this.selectedYear,
      level: this.selectedLevel,
      track: this.selectedTrack,
    };
    this.api.post<AnnualDistribution>('/annual-planning/distributions', payload).subscribe({
      next: () => {
        this.loadDistributions(true);
        this.newDistribution = {
          year: this.selectedYear,
          level: this.selectedLevel,
          track: this.selectedTrack,
          term: this.newDistribution.term,
          weekNumber: this.newDistribution.weekNumber + 1,
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

  exportDistributionToPdf(): void {
    if (!this.distributions.length) {
      this.errorMessage = 'لا يوجد توزيع لطباعته.';
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');

    const title = `التوزيع السنوي - ${this.selectedYear}`;
    const subTitle = `${this.selectedLevel} - ${this.selectedTrack}`;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(title, 105, 15, { align: 'center' });

    pdf.setFontSize(11);
    pdf.text(subTitle, 105, 22, { align: 'center' });

    const startY = 30;
    const lineHeight = 7;
    const colX = [10, 25, 40, 110, 150, 180]; // term, week, unit, domain, start, end

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('فصل', colX[0], startY);
    pdf.text('أسبوع', colX[1], startY);
    pdf.text('الوحدة / النشاط', colX[2], startY);
    pdf.text('المجال', colX[3], startY);
    pdf.text('بداية', colX[4], startY);
    pdf.text('نهاية', colX[5], startY);

    pdf.setFont('helvetica', 'normal');

    let y = startY + lineHeight;
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (const row of this.distributions) {
      if (y > pageHeight - 15) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(String(row.term), colX[0], y);
      pdf.text(String(row.weekNumber), colX[1], y);

      const unitText = row.unitTitle || '';
      const domainText = row.domain || '';

      pdf.text(unitText.substring(0, 40), colX[2], y);
      pdf.text(domainText.substring(0, 30), colX[3], y);

      pdf.text(row.computedStartDate || '-', colX[4], y);
      pdf.text(row.computedEndDate || '-', colX[5], y);

      y += lineHeight;
    }

    pdf.save(`التوزيع_السنوي_${this.selectedYear}.pdf`);
  }
}


