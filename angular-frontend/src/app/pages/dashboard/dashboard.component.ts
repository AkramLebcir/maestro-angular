import { Component, OnInit, Inject } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { NotificationService } from '../../services/notification.service';

interface ProgressItem {
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

interface Class {
  id: number;
  name: string;
}

interface Student {
  id: number;
  classId?: number;
}

interface Grade {
  id: number;
  studentId: number;
  classId: number;
  score: number;
  maxScore: number;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  classId: number;
  date: string;
  status: 'present' | 'absent' | 'excused' | 'late' | 'sick' | 'left_early';
}

interface BehaviorEvent {
  id: number;
  studentId: number;
  classId: number;
  behaviorId: number;
  date: string;
}

interface LabStatus {
  /** عدد الأجهزة التي تعمل من إجمالي الأجهزة في المخبر */
  workingDevices: {
    current: number;
    total: number;
  };
  /** حالة أثاث المخبر كنسبة مئوية 0-100 */
  furnitureCondition: number;
  /** نظافة/حالة المخبر (طاقة، نظافة، ترتيب...) كنسبة مئوية 0-100 */
  labCleanliness: number;
}

interface LabEquipmentItem {
  id: number;
  itemName: string;
  totalCount: number;
  workingCount: number;
  notWorkingCount: number;
}

interface LabFurnitureItem {
  id: number;
  itemName: string;
  totalCount: number;
  workingCount: number;
  notWorkingCount: number;
}

interface LabCleaningRecord {
  id: number;
  deviceCleanliness: string;
  desktopCleanliness: string;
  roomCleanliness: string;
  checkDate: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // القيم الملخصة
  totalStudents = 0;
  averageAttendance = 0; // %
  averageGrade = 0; // %
  todayLabel = ''; // مثال: الأربعاء 26 نوفمبر 2025

  attendanceSummary = {
    present: 0,
    absent: 0,
    excused: 0,
    late: 0,
    sick: 0
  };

  behaviorSummary = {
    positive: 0,
    negative: 0
  };

  gradeCounts = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0
  };

  // إحصائيات سجل الدرجات للـ quick view
  gradebookStats = {
    studentsWithAverage10OrAbove: 0,
    studentsWithAverageBelow10: 0,
    highestGrade: 0,
    lowestGrade: 20
  };


  // بيانات خام
  classes: Class[] = [];
  /** 0 = جميع الأقسام (Global)، غير ذلك = معرف القسم */
  selectedClassId: number = 0;
  selectedClass: Class | null = null;
  students: Student[] = [];
  grades: Grade[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  behaviorEvents: BehaviorEvent[] = [];

  // حالة المخبر
  labStatus: LabStatus = {
    workingDevices: {
      current: 0,
      total: 0
    },
    furnitureCondition: 0,
    labCleanliness: 0
  };

  // تقدم إنجاز البرنامج (متوسط جميع الأقسام + قسم معيّن إن اختير)
  subjectProgressOverview?: SubjectProgressResponse;
  averageProgramProgressAllClasses = 0; // %
  selectedClassProgramProgress: number | null = null; // %
  subjectProgressLoaded = false;

  // Attendance doughnut chart
  attendanceChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['', '', '', '', ''],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#22c55e', // green - present
          '#ef4444', // red - absent
          '#2563eb', // blue - excused
          '#f97316', // orange - late
          '#eab308'  // yellow - sick
        ],
        borderWidth: 1
      }
    ]
  };

  attendanceChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // Behavior bar chart
  behaviorChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [''],
    datasets: [
      {
        label: '',
        data: [0],
        backgroundColor: '#22c55e'
      },
      {
        label: '',
        data: [0],
        backgroundColor: '#ef4444'
      }
    ]
  };

  behaviorChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        beginAtZero: true
      }
    }
  };

  // Grade distribution bar chart
  gradeDistributionChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['<10', '10-12', '12-14', '14-16', '>16'],
    datasets: [
      {
        label: '',
        data: [0, 0, 0, 0, 0],
        backgroundColor: '#2563eb'
      }
    ]
  };

  gradeDistributionChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  constructor(
    private api: ApiService,
    @Inject('LanguageService') public languageService: LanguageService,
    public notificationService: NotificationService
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    this.updateTodayLabel();
    this.updateChartLabels();
    
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(() => {
      this.updateTodayLabel();
      this.updateChartLabels();
    });

    this.loadDashboardData();
    this.loadSubjectProgramProgress();
    this.loadLabStatus();
    this.generateNotifications();
  }

  private updateTodayLabel(): void {
    const today = new Date();
    const lang = this.languageService.getCurrentLanguage();
    const localeMap: { [key: string]: string } = {
      'AR': 'ar-EG',
      'FR': 'fr-FR',
      'EN': 'en-US',
      'ES': 'es-ES',
      'IT': 'it-IT',
      'DE': 'de-DE',
      'TR': 'tr-TR'
    };
    const locale = localeMap[lang] || 'ar-EG';
    this.todayLabel = today.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private updateChartLabels(): void {
    // Update attendance chart labels
    this.attendanceChartData.labels = [
      this.translate('dashboard.present'),
      this.translate('dashboard.absent'),
      this.translate('dashboard.excused'),
      this.translate('dashboard.late'),
      this.translate('dashboard.sick')
    ];
    
    // Update behavior chart labels
    this.behaviorChartData.labels = [this.translate('dashboard.behavior')];
    this.behaviorChartData.datasets[0].label = this.translate('dashboard.behaviorPositive');
    this.behaviorChartData.datasets[1].label = this.translate('dashboard.behaviorNegative');
    
    // Update grade distribution chart label
    this.gradeDistributionChartData.datasets[0].label = this.translate('dashboard.numberOfStudents');
  }

  /** المعدل العام على 20 بدل النسبة المئوية */
  get generalAverageOn20(): number {
    return (this.averageGrade / 100) * 20;
  }

  /** إجمالي الأقسام المحملة من الـ API */
  get totalClasses(): number {
    return this.classes.length;
  }

  /**
   * تحميل البيانات الحقيقية من الـ API
   */
  loadDashboardData(): void {
    // 1) جلب الأقسام
    this.api.get<Class[]>('/classes').subscribe({
      next: classes => {
        this.classes = classes || [];
        // إذا لم يكن هناك أقسام نخرج
        if (this.classes.length === 0) {
          this.resetData();
          return;
        }
        // أبقِ الاختيار الحالي كما هو (قسم معيّن أو جميع الأقسام)
        this.onClassChange();
      },
      error: err => {
        console.error('Error loading classes for dashboard:', err);
        this.resetData();
      }
    });
  }

  /**
   * استدعاء عند تغيير اختيار القسم من القائمة
   */
  onClassChange(): void {
    // إعادة تهيئة القيم قبل التحميل
    this.resetData();

    // تحديث نسبة تقدّم البرنامج للقسم المختار (إن وُجدت بيانات مسبقاً)
    this.updateSelectedClassProgramProgress();

    // 0 => Global dashboard (جميع الأقسام)
    if (this.selectedClassId === 0) {
      this.selectedClass = null;

      // تلاميذ وجميع السجلات بدون فلترة القسم
      this.api.get<Student[]>('/students').subscribe({
        next: students => {
          this.students = students || [];
          this.totalStudents = this.students.length;
          this.loadAttendance(); // بدون classId => كل الأقسام
          this.loadBehavior();
          this.loadGrades();
        },
        error: err => {
          console.error('Error loading global students for dashboard:', err);
        }
      });
    } else {
      // Dashboard خاص بقسم واحد
      this.selectedClass =
        this.classes.find(c => c.id === this.selectedClassId) || null;

      if (!this.selectedClass) {
        return;
      }

      const classId = this.selectedClass.id;

      this.api.get<Student[]>(`/classes/${classId}/students`).subscribe({
        next: students => {
          this.students = students || [];
          this.totalStudents = this.students.length;
          this.loadAttendance(classId);
          this.loadBehavior(classId);
          this.loadGrades(classId);
        },
        error: err => {
          console.error('Error loading students for dashboard, falling back to /students:', err);
          // نفس منطق Gradebook: في حال عدم وجود المسار نستخدم /students ثم نفلتر حسب classId
          this.api.get<Student[]>('/students').subscribe({
            next: allStudents => {
              this.students = (allStudents || []).filter(s => s.classId === classId);
              this.totalStudents = this.students.length;
              this.loadAttendance(classId);
              this.loadBehavior(classId);
              this.loadGrades(classId);
            },
            error: err2 => {
              console.error('Error loading students fallback for dashboard:', err2);
              this.students = [];
              this.totalStudents = 0;
            }
          });
        }
      });
    }
  }

  /**
   * تحميل بيانات حالة المخبر من الـ API
   */
  private loadLabStatus(): void {
    // 1. Equipment (Devices)
    this.api.get<LabEquipmentItem[]>('/lab-equipment').subscribe({
      next: (items) => {
        if (!items) return;
        let total = 0;
        let working = 0;
        items.forEach(item => {
          total += item.totalCount || 0;
          working += item.workingCount || 0;
        });
        this.labStatus.workingDevices = { current: working, total: total };
      },
      error: (err) => console.error('Error loading lab equipment', err)
    });

    // 2. Furniture
    this.api.get<LabFurnitureItem[]>('/lab-furniture').subscribe({
      next: (items) => {
        if (!items || items.length === 0) return;
        let total = 0;
        let working = 0;
        items.forEach(item => {
          total += item.totalCount || 0;
          working += item.workingCount || 0;
        });
        
        if (total > 0) {
          this.labStatus.furnitureCondition = (working / total) * 100;
        }
      },
      error: (err) => console.error('Error loading lab furniture', err)
    });

    // 3. Cleaning
    this.api.get<LabCleaningRecord[]>('/lab-cleaning').subscribe({
      next: (records) => {
        if (!records || records.length === 0) return;
        // Get the latest record (assuming ID order usually correlates with time, or we could sort by date)
        const latest = records[records.length - 1];
        
        const scoreMap: Record<string, number> = {
          'good': 100,
          'average': 50,
          'bad': 0,
          'excellent': 100,
          'poor': 0,
          'complete': 100,
          'incomplete': 0
        };

        const s1 = scoreMap[latest.deviceCleanliness] !== undefined ? scoreMap[latest.deviceCleanliness] : 50;
        const s2 = scoreMap[latest.desktopCleanliness] !== undefined ? scoreMap[latest.desktopCleanliness] : 50;
        const s3 = scoreMap[latest.roomCleanliness] !== undefined ? scoreMap[latest.roomCleanliness] : 50;

        this.labStatus.labCleanliness = (s1 + s2 + s3) / 3;
      },
      error: (err) => console.error('Error loading lab cleaning', err)
    });
  }

  /**
   * إعادة تهيئة القيم عند تغيير القسم
   */
  private resetData(): void {
    this.totalStudents = 0;
    this.averageAttendance = 0;
    this.averageGrade = 0;
    this.attendanceSummary = { present: 0, absent: 0, excused: 0, late: 0, sick: 0 };
    this.behaviorSummary = { positive: 0, negative: 0 };
    this.gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    this.gradebookStats = {
      studentsWithAverage10OrAbove: 0,
      studentsWithAverageBelow10: 0,
      highestGrade: 0,
      lowestGrade: 20
    };
    this.students = [];
    this.attendanceRecords = [];
    this.behaviorEvents = [];
    this.grades = [];

    this.attendanceChartData = {
      ...this.attendanceChartData,
      datasets: [{ ...this.attendanceChartData.datasets[0], data: [0, 0, 0, 0, 0] }]
    };
    this.behaviorChartData = {
      ...this.behaviorChartData,
      datasets: [
        { ...this.behaviorChartData.datasets[0], data: [0] },
        { ...this.behaviorChartData.datasets[1], data: [0] }
      ]
    };
    this.gradeDistributionChartData = {
      ...this.gradeDistributionChartData,
      datasets: [{ ...this.gradeDistributionChartData.datasets[0], data: [0, 0, 0, 0, 0] }]
    };
  }

  /**
   * تحميل بيانات تقدّم إنجاز البرنامج لمادة معيّنة
   * حالياً نستخدم subjectId = 1 مثل شاشة متابعة التقدّم
   */
  private loadSubjectProgramProgress(): void {
    this.subjectProgressLoaded = false;
    this.api
      .get<SubjectProgressResponse>('/progress-tracking/subject/1')
      .subscribe({
        next: (res) => {
          this.subjectProgressOverview = res;

          const items = res.items || [];
          if (items.length > 0) {
            const sum = items.reduce(
              (acc, it) => acc + (it.lessonProgressPercentage || 0),
              0
            );
            this.averageProgramProgressAllClasses = sum / items.length;
          } else {
            this.averageProgramProgressAllClasses = 0;
          }

          this.updateSelectedClassProgramProgress();
          this.subjectProgressLoaded = true;
        },
        error: (err) => {
          console.error('Error loading subject program progress for dashboard:', err);
          this.subjectProgressOverview = undefined;
          this.averageProgramProgressAllClasses = 0;
          this.selectedClassProgramProgress = null;
          this.subjectProgressLoaded = true;
        },
      });
  }

  /**
   * تحديث نسبة التقدّم للقسم المختار اعتماداً على البيانات المحمّلة
   */
  private updateSelectedClassProgramProgress(): void {
    if (!this.subjectProgressOverview) {
      this.selectedClassProgramProgress = null;
      return;
    }

    if (this.selectedClassId === 0) {
      this.selectedClassProgramProgress = null;
      return;
    }

    const items = this.subjectProgressOverview.items || [];
    const found = items.find((it) => it.classId === this.selectedClassId);
    this.selectedClassProgramProgress = found
      ? found.lessonProgressPercentage
      : null;
  }

  private loadAttendance(classId?: number): void {
    const endpoint = classId ? `/attendance?classId=${classId}` : '/attendance';
    this.api.get<AttendanceRecord[]>(endpoint).subscribe({
      next: data => {
        this.attendanceRecords = data || [];
        this.computeAttendanceSummary();
      },
      error: err => {
        console.error('Error loading attendance for dashboard:', err);
        this.attendanceRecords = [];
        this.computeAttendanceSummary();
      }
    });
  }

  private loadBehavior(classId?: number): void {
    const endpoint = classId ? `/behavior-events?classId=${classId}` : '/behavior-events';
    this.api.get<BehaviorEvent[]>(endpoint).subscribe({
      next: data => {
        this.behaviorEvents = data || [];
        this.computeBehaviorSummary();
      },
      error: err => {
        console.error('Error loading behavior for dashboard:', err);
        this.behaviorEvents = [];
        this.computeBehaviorSummary();
      }
    });
  }

  private loadGrades(classId?: number): void {
    const endpoint = classId ? `/grades?classId=${classId}` : '/grades';
    this.api.get<Grade[]>(endpoint).subscribe({
      next: data => {
        this.grades = data || [];
        this.computeGradeSummary();
      },
      error: err => {
        console.error('Error loading grades for dashboard:', err);
        this.grades = [];
        this.computeGradeSummary();
      }
    });
  }

  /**
   * الحضور: احتساب عدد كل حالة ومتوسط نسبة الحضور
   */
  private computeAttendanceSummary(): void {
    const summary = {
      present: 0,
      absent: 0,
      excused: 0,
      late: 0,
      sick: 0
    };

    this.attendanceRecords.forEach(r => {
      switch (r.status) {
        case 'present':
          summary.present++;
          break;
        case 'absent':
          summary.absent++;
          break;
        case 'excused':
          summary.excused++;
          break;
        case 'late':
          summary.late++;
          break;
        case 'sick':
          summary.sick++;
          break;
      }
    });

    this.attendanceSummary = summary;

    const totalRecords =
      summary.present + summary.absent + summary.excused + summary.late + summary.sick;
    this.averageAttendance =
      totalRecords > 0 ? (summary.present / totalRecords) * 100 : 0;

    // Update attendance chart data
    this.attendanceChartData = {
      ...this.attendanceChartData,
      datasets: [
        {
          ...this.attendanceChartData.datasets[0],
          data: [
            summary.present,
            summary.absent,
            summary.excused,
            summary.late,
            summary.sick
          ]
        }
      ]
    };
    // Ensure labels are translated
    this.updateChartLabels();
  }

  /**
   * السلوك: عدد السلوكيات الإيجابية والسلبية
   * حسب نفس منطق gradebook: المعرفات 1-5 إيجابية والباقي سلبية
   */
  private computeBehaviorSummary(): void {
    let positive = 0;
    let negative = 0;

    this.behaviorEvents.forEach(e => {
      if (e.behaviorId >= 1 && e.behaviorId <= 5) {
        positive++;
      } else {
        negative++;
      }
    });

    this.behaviorSummary = { positive, negative };

    this.behaviorChartData = {
      ...this.behaviorChartData,
      datasets: [
        {
          ...this.behaviorChartData.datasets[0],
          data: [positive]
        },
        {
          ...this.behaviorChartData.datasets[1],
          data: [negative]
        }
      ]
    };
    // Ensure labels are translated
    this.updateChartLabels();
  }

  /**
   * الدرجات: حساب A/B/C/D/F ومتوسط الدرجات وتوزيعها على النطاقات
   * نعتمد على جميع الدرجات، ونحوّل كل درجة إلى مقياس من 20 ثم إلى %
   */
  private computeGradeSummary(): void {
    if (!this.students || this.students.length === 0) {
      this.averageGrade = 0;
      this.gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      this.gradeDistributionChartData = {
        ...this.gradeDistributionChartData,
        datasets: [{ ...this.gradeDistributionChartData.datasets[0], data: [0, 0, 0, 0, 0] }]
      };
      this.updateChartLabels();
      return;
    }

    // حساب معدل لكل تلميذ على 20
    const byStudent: Record<
      number,
      { sum: number; count: number }
    > = {};

    this.grades.forEach(g => {
      if (!byStudent[g.studentId]) {
        byStudent[g.studentId] = { sum: 0, count: 0 };
      }
      const normalized =
        g.maxScore && g.maxScore > 0 ? (g.score / g.maxScore) * 20 : g.score;
      byStudent[g.studentId].sum += normalized;
      byStudent[g.studentId].count += 1;
    });

    const averages: number[] = [];

    this.students.forEach(s => {
      const agg = byStudent[s.id];
      if (agg && agg.count > 0) {
        averages.push(agg.sum / agg.count);
      }
    });

    if (averages.length === 0) {
      this.averageGrade = 0;
      this.gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      this.gradeDistributionChartData = {
        ...this.gradeDistributionChartData,
        datasets: [{ ...this.gradeDistributionChartData.datasets[0], data: [0, 0, 0, 0, 0] }]
      };
      this.updateChartLabels();
      return;
    }

    // متوسط الدرجات كنسبة مئوية
    const sumAll = averages.reduce((acc, v) => acc + v, 0);
    this.averageGrade = (sumAll / (averages.length * 20)) * 100;

    // تحويل إلى حروف (A/B/C/D/F) وتوزيع على النطاقات
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const ranges = {
      lt10: 0,
      between10_12: 0,
      between12_14: 0,
      between14_16: 0,
      gt16: 0
    };

    averages.forEach(avg => {
      // حروف
      if (avg >= 16) gradeCounts.A++;
      else if (avg >= 14) gradeCounts.B++;
      else if (avg >= 12) gradeCounts.C++;
      else if (avg >= 10) gradeCounts.D++;
      else gradeCounts.F++;

      // نطاقات
      if (avg < 10) ranges.lt10++;
      else if (avg < 12) ranges.between10_12++;
      else if (avg < 14) ranges.between12_14++;
      else if (avg < 16) ranges.between14_16++;
      else ranges.gt16++;
    });

    this.gradeCounts = gradeCounts;

    // حساب إحصائيات سجل الدرجات
    let studentsWithAverage10OrAbove = 0;
    let studentsWithAverageBelow10 = 0;
    let highestGrade = 0;
    let lowestGrade = 20;

    averages.forEach(avg => {
      if (avg >= 10) {
        studentsWithAverage10OrAbove++;
      } else {
        studentsWithAverageBelow10++;
      }

      if (avg > highestGrade) {
        highestGrade = avg;
      }

      if (avg < lowestGrade) {
        lowestGrade = avg;
      }
    });

    this.gradebookStats = {
      studentsWithAverage10OrAbove,
      studentsWithAverageBelow10,
      highestGrade: averages.length > 0 ? highestGrade : 0,
      lowestGrade: averages.length > 0 ? lowestGrade : 0
    };

    this.gradeDistributionChartData = {
      ...this.gradeDistributionChartData,
      datasets: [
        {
          ...this.gradeDistributionChartData.datasets[0],
          data: [
            ranges.lt10,
            ranges.between10_12,
            ranges.between12_14,
            ranges.between14_16,
            ranges.gt16
          ]
        }
      ]
    };
    // Ensure labels are translated
    this.updateChartLabels();
  }

  /**
   * إنشاء الإشعارات تلقائياً
   */
  private generateNotifications(): void {
    this.notificationService.generateNotifications().subscribe({
      next: () => {
        // الإشعارات سيتم تحميلها تلقائياً في مكون الهيدر
      },
      error: err => {
        console.error('Error generating notifications:', err);
      }
    });
  }


  /**
   * إرجاع النسبة المئوية لحالة المخبر لاستخدامها في عرض شريط التقدّم
   */
  getLabPercentage(type: 'devices' | 'furniture' | 'cleanliness'): number {
    switch (type) {
      case 'devices':
        if (!this.labStatus.workingDevices.total) return 0;
        return (this.labStatus.workingDevices.current / this.labStatus.workingDevices.total) * 100;
      case 'furniture':
        return this.labStatus.furnitureCondition;
      case 'cleanliness':
        return this.labStatus.labCleanliness;
      default:
        return 0;
    }
  }
}



