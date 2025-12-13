import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import {
  GradingSettingsService,
  GradingSettings,
  CustomAssessmentColumn,
  BaseColumnConfig,
  BaseColumnKey,
  DEFAULT_BASE_COLUMN_SETTINGS,
  RatingRangeConfig,
  GuidanceRangeConfig,
} from '../../services/grading-settings.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';

export type AssessmentType = 
  | 'notebook_correction'
  | 'duty'
  | 'attendance'
  | 'behavior'
  | 'continuous_assessment'
  | 'oral_expression'
  | 'practical_work'
  | 'assignment'
  | 'test';

export interface Assessment {
  id: number;
  type: AssessmentType;
  name: string;
  nameAr: string;
  weight: number; // Weight in calculation
  maxScore: number;
  isAutomatic: boolean;
  formula?: string;
}

export interface Grade {
  id: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    gender?: 'male' | 'female';
  };
  assessmentId: number;
  assessment?: Assessment;
  classId: number;
  class?: {
    id: number;
    name: string;
  };
  term: number; // 1, 2, or 3
  score: number;
  maxScore: number;
  date: string; // Format: YYYY-MM-DD
  notes?: string;
  mark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGradeDto {
  studentId: number;
  assessmentId: number;
  classId: number;
  term: number; // 1, 2, or 3
  score: number;
  maxScore: number;
  date: string;
  notes?: string;
  mark?: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  idNumber?: string; // رقم الهوية أو الكود
  dateOfBirth?: Date | string; // تاريخ الميلاد
  gender?: 'male' | 'female';
  photo?: string; // صورة التلميذ
  isRepeater?: boolean; // هل التلميذ معيد
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
  grades?: Grade[];
  calculatedGrades?: {
    notebookCorrection?: number;
    duty?: number;
    attendance?: number;
    behavior?: number;
    continuousAssessment?: number;
    oralExpression?: number;
    practicalWork?: number;
    assignment?: number;
    test?: number;
  };
  averages?: {
    testAverage?: number;
    termAverage?: number; // Average for current term
    term1Average?: number; // Average for term 1
    term2Average?: number; // Average for term 2
    term3Average?: number; // Average for term 3
    annualAverage?: number; // Annual average (average of 3 terms)
    classAverage?: number;
  };
  ranking?: number;
  progress?: number;
}

export interface Class {
  id: number;
  name: string;
  level?: string;
  subject?: string;
}

export interface GradeStatistics {
  lessThan4: number;
  between4and6: number;
  between6and8: number;
  between8and10: number;
  between10and12: number;
  between12and14: number;
  between14and16: number;
  greaterThan16: number;
  total: number;
}

export interface GenderDistribution {
  male: GradeStatistics;
  female: GradeStatistics;
}

export interface GradeRangeDistribution {
  congratulations: number; // >16
  encouragement: number; // 14-16
  honorRoll: number; // 12-14
  none: number; // 10-12
  remarks: number; // <10
}

// Council Semester Record Interface
export interface CouncilSemesterRecord {
  id?: number;
  studentId: number;
  student?: Student;
  classId: number;
  class?: Class;
  term: number; // 1, 2, 3
  teacherAverage?: number; // معدل الأستاذ (محسوب تلقائياً)
  semesterAverage?: number; // معدل الفصل (يدوي)
  behaviorRating?: number; // 1-5 نجوم
  absencesLevel?: 'disciplined' | 'average' | 'frequent'; // منضبط - متوسط - كثير
  award?: 'excellence' | 'congratulation' | 'encouragement' | 'honor_roll' | 'none'; // الإجازات
  councilNotes?: string; // ملاحظات مجلس القسم
  createdAt?: Date;
  updatedAt?: Date;
}

// Final Council Decision Interface
export interface FinalCouncilDecision {
  id?: number;
  studentId: number;
  student?: Student;
  classId: number;
  class?: Class;
  term1Average?: number;
  term2Average?: number;
  term3Average?: number;
  annualAverage?: number; // محسوب تلقائياً
  finalDecision?: 'pass' | 'repeat' | 'remedial' | 'redirect' | 'vocational_redirect';
  isManualDecision?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-gradebook',
  templateUrl: './gradebook.component.html',
  styleUrls: ['./gradebook.component.css']
})
export class GradebookComponent implements OnInit, AfterViewInit {
  students: Student[] = [];
  classes: Class[] = [];
  assessments: Assessment[] = [];
  grades: Grade[] = [];
  attendanceRecords: any[] = [];
  behaviorEvents: any[] = [];
  selectedClass: Class | null = null;
  selectedAssessment: Assessment | null = null;
  selectedDate: Date = new Date();
  selectedTerm: number = 1; // 1, 2, or 3
  showGradeModal = false;
  showReportModal = false;
  showImportModal = false;
  showEnhancedImportModal = false;
  showGradeMonitoringModal = false;
  
  // Enhanced import variables
  selectedLevel: 'primary' | 'middle' | 'secondary' = 'primary';
  selectedLanguage: 'AR' | 'FR' | 'EN' = 'AR';
  // التحكم في توليد الملاحظات (obs) والإرشادات (cons) تلقائياً عند الاستيراد المحسّن
  autoGenerateObsCons: boolean = true;
  processedExcelData: any[] = [];
  processedSheetsData: { sheetName: string; data: any[] }[] = [];
  // نتائج أخطاء النقاط المستخدمة في تقرير مراقبة النقاط
  gradeMonitoringErrors: any[] = [];
  isProcessing = false;
  
  // Import options
  importMode: 'single' | 'multiple' = 'single'; // استيراد نوع واحد أو جميع الأنواع
  importIdentifier: 'name' | 'idNumber' = 'name'; // البحث بالاسم أو رقم الهوية
  
  // Excel Analysis Charts
  excelAnalysisCharts: { sheetName: string; charts: any }[] = [];
  
  // Sorting
  sortBy: 'firstName' | 'lastName' | 'idNumber' | 'termAverage' | 'term1Average' | 'term2Average' | 'term3Average' | 'annualAverage' | 'ranking' | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Grade form
  formData: CreateGradeDto = {
    studentId: 0,
    assessmentId: 0,
    classId: 0,
    term: 1,
    score: 0,
    maxScore: 20,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    mark: ''
  };

  // Assessment types
  assessmentTypes: Assessment[] = [
    { id: 1, type: 'notebook_correction', name: 'Notebook Correction', nameAr: 'تصحيح الدفتر', weight: 1, maxScore: 5, isAutomatic: false },
    { id: 2, type: 'duty', name: 'Duty', nameAr: 'الواجب', weight: 1, maxScore: 5, isAutomatic: false },
    { id: 3, type: 'attendance', name: 'Attendance', nameAr: 'الحضور', weight: 1, maxScore: 5, isAutomatic: true },
    { id: 4, type: 'behavior', name: 'Behavior', nameAr: 'السلوك', weight: 1, maxScore: 5, isAutomatic: true },
    { id: 5, type: 'continuous_assessment', name: 'Continuous Assessment', nameAr: 'التقييم المستمر', weight: 2, maxScore: 20, isAutomatic: true, formula: 'notebook + duty + attendance + behavior' },
    { id: 6, type: 'oral_expression', name: 'Oral Expression/Practical Work', nameAr: 'التعبير الشفهي/العمل العملي', weight: 1, maxScore: 20, isAutomatic: false },
    { id: 8, type: 'assignment', name: 'Assignment', nameAr: 'الفرض', weight: 1, maxScore: 20, isAutomatic: false },
    { id: 9, type: 'test', name: 'Test', nameAr: 'الاختبار', weight: 3, maxScore: 20, isAutomatic: false }
  ];

  readonly baseColumnDefinitions: { key: BaseColumnKey; translationKey: string }[] = [
    { key: 'notebook_correction', translationKey: 'gradebook.notebookCorrection' },
    { key: 'duty', translationKey: 'gradebook.homework' },
    { key: 'attendance', translationKey: 'gradebook.attendance5' },
    { key: 'behavior', translationKey: 'gradebook.behavior5' },
  ];

  // View mode
  viewMode: 'entry' | 'grades' | 'reports' | 'analysis' | 'excelImport' | 'excelAnalysis' | 'settings' | 'council' | 'finalDecision' = 'entry';
  
  // Council variables
  councilRecords: CouncilSemesterRecord[] = [];
  finalDecisions: FinalCouncilDecision[] = [];
  councilSelectedClass: Class | null = null;
  councilSelectedTerm: number = 1;
  councilActiveTab: 'semester' | 'final' = 'semester';
  councilStudentsWithRecords: (Student & { councilRecord?: CouncilSemesterRecord })[] = [];
  finalStudentsWithDecisions: (Student & { finalDecision?: FinalCouncilDecision })[] = [];
  editingCouncilRecord: { [key: string]: boolean } = {};
  editingFinalDecision: { [key: string]: boolean } = {};
  // Cache Arabic font to avoid repeated fetches and to register bold style safely
  private amiriFontBase64?: string;
  
  // Settings variables
  settingsSelectedClass: Class | null = null;
  selectedClassesForBulk: number[] = [];
  applyToAllClasses: boolean = false;
  selectedRatingsLanguage: string = '';
  selectedGuidanceLanguage: string = '';
  autoFillOralExpressionSynced = false;
  autoFillOralExpressionLoading = false;
  gradingSettings: GradingSettings = {
    classId: 0,
    notebookCorrectionMaxScore: 5,
    dutyMaxScore: 5,
    attendanceMaxScore: 5,
    attendanceAutoApply: true,
    behaviorMaxScore: 5,
    behaviorAutoApply: true,
    customAssessmentColumns: [],
    baseColumnSettings: DEFAULT_BASE_COLUMN_SETTINGS.map(column => ({ ...column })),
    includeOralExpression: true,
    autoFillOralExpressionFromSeating: false,
  };
  
  // Current class grading settings (loaded when class is selected)
  currentClassGradingSettings: GradingSettings | null = null;

  // Chart configurations
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        rtl: true
      },
      title: {
        display: false
      },
      tooltip: {
        rtl: true
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    }
  };

  // Grade Distribution Chart (Bar Chart)
  public gradeDistributionChartType: ChartType = 'bar';
  public gradeDistributionChartData: ChartData<'bar'> = {
    labels: ['<4', '4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '>16'],
    datasets: [{
      label: 'عدد التلاميذ',
      data: [],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  // Grade Range Distribution Chart (Pie Chart)
  public gradeRangeChartType: ChartType = 'pie';
  public gradeRangeChartData: ChartData<'pie'> = {
    labels: ['تهنئة (>16)', 'تشجيع (14-16)', 'قائمة الشرف (12-14)', 'عادي (10-12)', 'ملاحظات (<10)'],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(34, 197, 94, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(147, 51, 234, 0.7)',
        'rgba(107, 114, 128, 0.7)',
        'rgba(239, 68, 68, 0.7)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(147, 51, 234, 1)',
        'rgba(107, 114, 128, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Gender Comparison Chart (Bar Chart)
  public genderChartType: ChartType = 'bar';
  public genderChartData: ChartData<'bar'> = {
    labels: ['معدل ≥ 10', 'معدل < 10'],
    datasets: [
      {
        label: 'ذكور',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'إناث',
        data: [],
        backgroundColor: 'rgba(236, 72, 153, 0.7)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 1
      }
    ]
  };

  // Term Comparison Chart (Line Chart)
  public termComparisonChartType: ChartType = 'line';
  public termComparisonChartData: ChartData<'line'> = {
    labels: ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'],
    datasets: [{
      label: 'معدل القسم',
      data: [],
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Assessment Performance Chart (Bar Chart)
  public assessmentChartType: ChartType = 'bar';
  public assessmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'متوسط الدرجات',
      data: [],
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1
    }]
  };

  constructor(
    private apiService: ApiService,
    private gradingSettingsService: GradingSettingsService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    public languageService: LanguageService
  ) {}

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  ngOnInit(): void {
    this.loadClasses();
    this.loadAssessments();

    // دعم الفتح من صفحة التقارير مع فتح تقرير مراقبة النقاط
    this.route.queryParams.subscribe((params) => {
      const openGradeMonitoring = params['openGradeMonitoring'] === '1';
      const openCouncil = params['openCouncil'] === '1';
      const councilTab = params['councilTab'] === 'final' ? 'final' : 'semester';

      if (openGradeMonitoring) {
        // انتظر قليلاً لتحميل البيانات ثم افتح الـ modal
        setTimeout(() => {
          this.openGradeMonitoringModal();
        }, 500);
      }

      if (openCouncil) {
        this.viewMode = 'council';
        this.councilActiveTab = councilTab;
      }
    });
  }

  loadClasses(): void {
    this.apiService.get<Class[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
        if (data.length > 0 && !this.selectedClass) {
          this.selectedClass = data[0];
          this.loadStudentsForClass(data[0].id);
          this.loadCurrentClassGradingSettings();
        }
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.classes = [];
      }
    });
  }

  loadAssessments(): void {
    this.apiService.get<Assessment[]>('/assessments').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.assessments = data;
        } else {
          this.assessments = this.assessmentTypes;
        }
        this.maybeAutoFillOralExpressionFromSeating();
      },
      error: (error) => {
        console.error('Error loading assessments:', error);
        this.assessments = this.assessmentTypes;
      }
    });
  }

  loadStudentsForClass(classId: number): void {
    this.apiService.get<Student[]>(`/classes/${classId}/students`).subscribe({
      next: (data) => {
        this.students = data;
        this.loadGradesForClass(classId);
      },
      error: (error) => {
        console.error('Error loading students:', error);
        // Fallback
        this.apiService.get<Student[]>('/students').subscribe({
          next: (allStudents) => {
            this.students = allStudents.filter(s => s.classId === classId);
            this.loadGradesForClass(classId);
          },
          error: (error2) => {
            console.error('Error loading students:', error2);
            this.students = [];
          }
        });
      }
    });
  }

  loadGradesForClass(classId: number): void {
    this.apiService.get<Grade[]>(`/grades?classId=${classId}`).subscribe({
      next: (data) => {
        // Ensure all grades have term property set (default to selectedTerm if not set)
        this.grades = data.map(grade => ({
          ...grade,
          term: grade.term || this.selectedTerm
        }));
        // Initialize grades for each student
        this.students.forEach(student => {
          student.grades = this.grades.filter(g => g.studentId === student.id);
        });
        this.autoFillOralExpressionSynced = false;
        this.maybeAutoFillOralExpressionFromSeating();
        // Load attendance and behavior data
        // سيتم استدعاء calculateAllGrades() من loadAttendanceForClass و loadBehaviorForClass
        this.loadAttendanceForClass(classId);
        this.loadBehaviorForClass(classId);
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        this.grades = [];
        this.students.forEach(student => {
          student.grades = [];
        });
        // إعادة حساب الدرجات حتى في حالة الخطأ
        this.calculateAllGrades();
      }
    });
  }

  loadAttendanceForClass(classId: number): void {
    this.apiService.get<any[]>(`/attendance?classId=${classId}`).subscribe({
      next: (data) => {
        this.attendanceRecords = data;
        // إعادة حساب الدرجات بعد تحميل سجلات الحضور
        this.calculateAllGrades();
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.attendanceRecords = [];
        // إعادة حساب الدرجات حتى في حالة الخطأ
        this.calculateAllGrades();
      }
    });
  }

  loadBehaviorForClass(classId: number): void {
    this.apiService.get<any[]>(`/behavior-events?classId=${classId}`).subscribe({
      next: (data) => {
        this.behaviorEvents = data;
        // إعادة حساب الدرجات بعد تحميل أحداث السلوك
        this.calculateAllGrades();
      },
      error: (error) => {
        console.error('Error loading behavior:', error);
        this.behaviorEvents = [];
        // إعادة حساب الدرجات حتى في حالة الخطأ
        this.calculateAllGrades();
      }
    });
  }

  private maybeAutoFillOralExpressionFromSeating(): void {
    if (this.autoFillOralExpressionLoading || this.autoFillOralExpressionSynced) {
      return;
    }
    if (!this.selectedClass) return;
    if (!this.currentClassGradingSettings?.autoFillOralExpressionFromSeating) return;
    if (!this.shouldShowOralExpressionColumn()) return;
    if (!this.students || this.students.length === 0) return;

    const oralAssessmentId = this.getAssessmentIdByType('oral_expression');
    if (!oralAssessmentId) return;

    this.autoFillOralExpressionLoading = true;

    this.apiService.get<any>(`/workstations/layout?classId=${this.selectedClass.id}`).subscribe({
      next: (layout) => {
        const assignments = (layout?.workstations || []).flatMap((ws: any) => ws.assignments || []);
        const quickGradeMap = new Map<number, number>();

        assignments.forEach((assignment: any) => {
          const studentId = assignment?.studentId;
          const quickGrade = assignment?.quickGrade;
          if (studentId && quickGrade !== null && quickGrade !== undefined && !isNaN(Number(quickGrade))) {
            quickGradeMap.set(studentId, Number(quickGrade));
          }
        });

        quickGradeMap.forEach((quickGrade, studentId) => {
          const existing = this.grades.find(g =>
            g.studentId === studentId &&
            g.assessmentId === oralAssessmentId &&
            g.classId === this.selectedClass!.id &&
            g.term === this.selectedTerm
          );

          if (!existing || existing.score !== quickGrade) {
            this.saveGrade(studentId, oralAssessmentId, quickGrade);
          }
        });

        this.autoFillOralExpressionSynced = true;
      },
      error: (error) => {
        console.error('Error auto-filling oral/practical grades from seating chart:', error);
      },
      complete: () => {
        this.autoFillOralExpressionLoading = false;
      }
    });
  }

  isBehaviorPositive(behaviorId: number): boolean {
    // السلوكيات الإيجابية: IDs 1-5
    // السلوكيات السلبية: IDs 6-10
    return behaviorId >= 1 && behaviorId <= 5;
  }

  onClassChange(): void {
    this.autoFillOralExpressionSynced = false;
    this.autoFillOralExpressionLoading = false;
    this.currentClassGradingSettings = null;
    if (this.selectedClass) {
      this.loadStudentsForClass(this.selectedClass.id);
      this.loadCurrentClassGradingSettings();
    } else {
      this.students = [];
      this.grades = [];
      this.currentClassGradingSettings = null;
    }
  }
  
  loadCurrentClassGradingSettings(): void {
    if (!this.selectedClass) return;
    
    this.gradingSettingsService.getByClassId(this.selectedClass.id).subscribe({
      next: (settings) => {
        if (settings) {
          this.currentClassGradingSettings = settings;
        } else {
          // Use defaults if no settings exist
          this.currentClassGradingSettings = {
            classId: this.selectedClass!.id,
            notebookCorrectionMaxScore: 5,
            dutyMaxScore: 5,
            attendanceMaxScore: 5,
            attendanceAutoApply: true,
            behaviorMaxScore: 5,
            behaviorAutoApply: true,
            customAssessmentColumns: [],
            baseColumnSettings: DEFAULT_BASE_COLUMN_SETTINGS.map(column => ({ ...column })),
          includeOralExpression: true,
          autoFillOralExpressionFromSeating: false,
          };
        }
        if (this.currentClassGradingSettings) {
        this.currentClassGradingSettings.autoFillOralExpressionFromSeating =
          this.currentClassGradingSettings.autoFillOralExpressionFromSeating ?? false;
          this.currentClassGradingSettings.baseColumnSettings = this.normalizeBaseColumnSettings(this.currentClassGradingSettings.baseColumnSettings);
        }
      this.autoFillOralExpressionSynced = false;
      this.maybeAutoFillOralExpressionFromSeating();
        // Recalculate grades with new settings
        this.calculateAllGrades();
      },
      error: (error) => {
        console.error('Error loading grading settings:', error);
        // Use defaults on error
        this.currentClassGradingSettings = {
          classId: this.selectedClass!.id,
          notebookCorrectionMaxScore: 5,
          dutyMaxScore: 5,
          attendanceMaxScore: 5,
          attendanceAutoApply: true,
          behaviorMaxScore: 5,
          behaviorAutoApply: true,
          customAssessmentColumns: [],
          baseColumnSettings: DEFAULT_BASE_COLUMN_SETTINGS.map(column => ({ ...column })),
        includeOralExpression: true,
        autoFillOralExpressionFromSeating: false,
        };
        this.currentClassGradingSettings.baseColumnSettings = this.normalizeBaseColumnSettings(this.currentClassGradingSettings.baseColumnSettings);
      }
    });
  }

  onTermChange(): void {
    if (this.selectedClass) {
      this.autoFillOralExpressionSynced = false;
      // إعادة حساب الدرجات للفصل الدراسي الجديد
      // استخدام setTimeout لضمان تحديث this.selectedTerm قبل الحساب
      setTimeout(() => {
        this.calculateAllGrades();
      }, 0);
      // إعادة تحميل الدرجات من الخادم (سيتم استدعاء calculateAllGrades من loadAttendanceForClass و loadBehaviorForClass)
      this.loadGradesForClass(this.selectedClass.id);
    }
  }

  onAnalysisTabClick(): void {
    this.viewMode = 'analysis';
    // Update charts when switching to analysis tab
    setTimeout(() => {
      this.updateAllCharts();
      this.cdr.detectChanges();
    }, 100);
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.selectedDate = new Date(input.value);
    }
  }

  openGradeModal(student: Student, assessment: Assessment): void {
    this.selectedAssessment = assessment;
    const existingGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === assessment.id &&
      g.classId === this.selectedClass!.id &&
      g.term === this.selectedTerm
    );

    this.formData = {
      studentId: student.id,
      assessmentId: assessment.id,
      classId: this.selectedClass!.id,
      term: this.selectedTerm,
      score: existingGrade ? existingGrade.score : 0,
      maxScore: assessment.maxScore,
      date: this.formatDateForAPI(this.selectedDate),
      notes: existingGrade?.notes || '',
      mark: existingGrade?.mark || ''
    };
    this.showGradeModal = true;
  }

  closeGradeModal(): void {
    this.showGradeModal = false;
    this.selectedAssessment = null;
  }

  onGradeInputBlur(event: Event, studentId: number, assessmentId: number): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value !== null && input.value !== undefined && input.value !== '') {
      const score = parseFloat(input.value);
      if (!isNaN(score) && score >= 0) {
        // Get the assessment to set maxScore correctly
        const assessment = this.assessments.find(a => a.id === assessmentId);
        if (assessment) {
          this.selectedAssessment = assessment;
        }
        this.saveGrade(studentId, assessmentId, score);
      }
    } else if (input && input.value === '') {
      // If input is cleared, we might want to delete the grade or set it to 0
      // For now, we'll just skip saving empty values
      return;
    }
  }

  saveGrade(studentId?: number, assessmentId?: number, score?: number): void {
    if (studentId && assessmentId !== undefined && score !== undefined) {
      // Quick save from input field
      const assessment = this.assessments.find(a => a.id === assessmentId);
      if (!assessment) {
        console.error('Assessment not found');
        return;
      }
      
      // Validate score against max allowed
      const maxScore = this.getAssessmentMaxScore(assessment.type);
      if (score > maxScore) {
        alert(`الدرجة القصوى المسموحة هي ${maxScore} نقاط`);
        return;
      }
      
      // Find existing grade to preserve notes and mark (للفصل الحالي فقط)
      let existingGrade = this.grades.find(g => 
        g.studentId === studentId && 
        g.assessmentId === assessmentId &&
        g.classId === this.selectedClass!.id &&
        g.term === this.selectedTerm
      );

      // Backward compatibility: في حال كانت الدرجات القديمة بدون فصل
      if (!existingGrade) {
        existingGrade = this.grades.find(g => 
          g.studentId === studentId && 
          g.assessmentId === assessmentId &&
          g.classId === this.selectedClass!.id &&
          (g.term === undefined || g.term === null)
        );
      }
      
      this.formData.studentId = studentId;
      this.formData.assessmentId = assessmentId;
      this.formData.score = Math.min(score, maxScore); // Ensure score doesn't exceed max
      this.formData.classId = this.selectedClass!.id;
      this.formData.term = this.selectedTerm;
      this.formData.maxScore = maxScore; // Use the validated max score
      this.formData.date = this.formatDateForAPI(this.selectedDate);
      // Preserve existing notes and mark if they exist
      this.formData.notes = existingGrade?.notes || '';
      this.formData.mark = existingGrade?.mark || '';
    }

    // Validate required fields
    if (!this.formData.studentId || this.formData.studentId === 0) {
      console.error('Student ID is required');
      return;
    }
    if (!this.formData.assessmentId || this.formData.assessmentId === 0) {
      console.error('Assessment ID is required');
      return;
    }
    if (!this.selectedClass || !this.selectedClass.id) {
      console.error('Class must be selected');
      return;
    }

    // First try to find grade with matching term
    let existingGrade = this.grades.find(g => 
      g.studentId === this.formData.studentId && 
      g.assessmentId === this.formData.assessmentId &&
      g.classId === this.formData.classId &&
      g.term === this.formData.term
    );
    
    // If not found, try to find grade without term (for backward compatibility)
    if (!existingGrade && this.formData.term) {
      existingGrade = this.grades.find(g => 
        g.studentId === this.formData.studentId && 
        g.assessmentId === this.formData.assessmentId &&
        g.classId === this.formData.classId &&
        !g.term
      );
    }

    // Create payload with term property
    const submitData: any = {
      studentId: this.formData.studentId,
      assessmentId: this.formData.assessmentId,
      classId: this.formData.classId,
      term: this.formData.term,
      score: this.formData.score,
      maxScore: this.formData.maxScore,
      date: this.formData.date,
      notes: this.formData.notes || undefined,
      mark: this.formData.mark || undefined
    };

    // --- تحديث متفائل (لحظي) محلي قبل استجابة الخادم ---
    // نستخدم معرفًا مؤقتًا إذا كانت الدرجة جديدة حتى يتم استبدالها بالقيمة القادمة من الخادم
    const tempId = existingGrade ? existingGrade.id : -Date.now();
    const optimisticGrade: Grade = {
      id: tempId,
      studentId: submitData.studentId,
      assessmentId: submitData.assessmentId,
      classId: submitData.classId,
      term: submitData.term,
      score: submitData.score,
      maxScore: submitData.maxScore,
      date: submitData.date,
      notes: submitData.notes || '',
      mark: submitData.mark || '',
      createdAt: existingGrade?.createdAt || new Date(),
      updatedAt: new Date(),
      student: existingGrade?.student,
      assessment: existingGrade?.assessment,
      class: existingGrade?.class
    };

    // تحديث مصفوفة الدرجات العامة
    const gradeIndexLocal = this.grades.findIndex(g => 
      g.studentId === optimisticGrade.studentId &&
      g.assessmentId === optimisticGrade.assessmentId &&
      g.classId === optimisticGrade.classId &&
      g.term === optimisticGrade.term
    );
    if (gradeIndexLocal !== -1) {
      this.grades = [
        ...this.grades.slice(0, gradeIndexLocal),
        optimisticGrade,
        ...this.grades.slice(gradeIndexLocal + 1)
      ];
    } else {
      this.grades = [...this.grades, optimisticGrade];
    }

    // تحديث درجات التلميذ
    const optimisticStudent = this.students.find(s => s.id === optimisticGrade.studentId);
    if (optimisticStudent) {
      if (!optimisticStudent.grades) {
        optimisticStudent.grades = [];
      }
      const studentGradeIndexLocal = optimisticStudent.grades.findIndex(g => 
        g.assessmentId === optimisticGrade.assessmentId &&
        g.classId === optimisticGrade.classId &&
        g.term === optimisticGrade.term
      );
      if (studentGradeIndexLocal !== -1) {
        optimisticStudent.grades[studentGradeIndexLocal] = optimisticGrade;
      } else {
        optimisticStudent.grades.push(optimisticGrade);
      }
    }

    // إعادة الحساب مباشرة حتى تظهر قيمة التقييم المستمر، والمعدل، والرتبة فورًا
    this.calculateAllGrades();
    this.cdr.detectChanges();

    if (existingGrade) {
      const existingGradeId = existingGrade.id;
      this.apiService.patch<Grade>(`/grades/${existingGradeId}`, submitData).subscribe({
        next: (updatedGrade) => {
          // Update local grade immediately for instant calculation
          const gradeIndex = this.grades.findIndex(g => g.id === existingGradeId);
          // Ensure term is set correctly
          const gradeWithTerm = { 
            ...updatedGrade, 
            term: updatedGrade.term !== undefined && updatedGrade.term !== null 
              ? updatedGrade.term 
              : this.selectedTerm 
          };
          if (gradeIndex !== -1) {
            // Replace the grade in the array to trigger change detection
            this.grades = [
              ...this.grades.slice(0, gradeIndex),
              gradeWithTerm,
              ...this.grades.slice(gradeIndex + 1)
            ];
          } else {
            this.grades = [...this.grades, gradeWithTerm];
          }
          // Update student's grades array
          const student = this.students.find(s => s.id === this.formData.studentId);
          if (student) {
            if (!student.grades) {
              student.grades = [];
            }
            const studentGradeIndex = student.grades.findIndex(g => g.id === existingGradeId);
            if (studentGradeIndex !== -1) {
              student.grades[studentGradeIndex] = gradeWithTerm;
            } else {
              student.grades.push(gradeWithTerm);
            }
          }
          // تمت إعادة الحساب مسبقًا بشكل متفائل، لذا لا حاجة لإعادة إضافية هنا
          this.calculateAllGrades();
          this.cdr.detectChanges();
          if (!studentId) this.closeGradeModal();
        },
        error: (error) => {
          console.error('Error updating grade:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء تحديث الدرجة';
          alert(errorMessage);
        }
      });
    } else {
      this.apiService.post<Grade>('/grades', submitData).subscribe({
        next: (newGrade) => {
          // Ensure term is set correctly
          const gradeWithTerm = { 
            ...newGrade, 
            term: newGrade.term !== undefined && newGrade.term !== null 
              ? newGrade.term 
              : this.selectedTerm 
          };
          // استبدال الدرجة المؤقتة (إن وُجدت) بالدرجة الحقيقية القادمة من الخادم
          const tempIndex = this.grades.findIndex(g => g.id === tempId);
          if (tempIndex !== -1) {
            this.grades = [
              ...this.grades.slice(0, tempIndex),
              gradeWithTerm,
              ...this.grades.slice(tempIndex + 1)
            ];
          } else {
            this.grades = [...this.grades, gradeWithTerm];
          }

          // Update student's grades array
          const student = this.students.find(s => s.id === this.formData.studentId);
          if (student) {
            if (!student.grades) {
              student.grades = [];
            }
            const tempStudentIndex = student.grades.findIndex(g => g.id === tempId);
            if (tempStudentIndex !== -1) {
              student.grades[tempStudentIndex] = gradeWithTerm;
            } else {
              student.grades.push(gradeWithTerm);
            }
          }

          // الحساب المتفائل سبق تنفيذه؛ يتم هنا فقط ضمان التزامن مع بيانات الخادم
          this.calculateAllGrades();
          this.cdr.detectChanges();
          if (!studentId) this.closeGradeModal();
        },
        error: (error) => {
          console.error('Error creating grade:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء حفظ الدرجة';
          alert(errorMessage);
        }
      });
    }
  }

  getGradeForStudent(studentId: number, assessmentId: number): Grade | undefined {
    if (!this.selectedClass) {
      return undefined;
    }

    // أولوية مطلقة: الدرجة الخاصة بالفصل الحالي فقط
    let grade = this.grades.find(g =>
      g.studentId === studentId &&
      g.assessmentId === assessmentId &&
      g.classId === this.selectedClass!.id &&
      g.term === this.selectedTerm
    );

    // توافق مع الدرجات القديمة بدون فصل: نستخدمها فقط إذا لم توجد درجة للفصل الحالي
    if (!grade) {
      grade = this.grades.find(g =>
        g.studentId === studentId &&
        g.assessmentId === assessmentId &&
        g.classId === this.selectedClass!.id &&
        (g.term === undefined || g.term === null)
      );
    }

    return grade;
  }

  getAssessmentIdByType(type: AssessmentType): number {
    const assessment = this.assessments.find(a => a.type === type);
    return assessment?.id || 0;
  }

  getAssessmentMaxScore(type: AssessmentType): number {
    const assessment = this.assessments.find(a => a.type === type);
    return assessment?.maxScore || 20;
  }

  calculateAllGrades(): void {
    // إعادة حساب درجات جميع التلاميذ للفصل الدراسي المحدد
    this.students.forEach(student => {
      this.calculateStudentGrades(student);
    });
    this.calculateRankings();
    
    // Update charts if in analysis mode
    if (this.viewMode === 'analysis') {
      this.updateAllCharts();
    }
    
    // If currently sorted by ranking, termAverage, term1Average, term2Average, term3Average, or annualAverage, reapply the sort
    if (this.sortBy === 'ranking' || this.sortBy === 'termAverage' || this.sortBy === 'term1Average' || this.sortBy === 'term2Average' || this.sortBy === 'term3Average' || this.sortBy === 'annualAverage') {
      // Save current sort state
      const currentSortBy = this.sortBy;
      const currentSortDirection = this.sortDirection;
      // Temporarily reset to allow re-sorting
      const tempSortBy = this.sortBy;
      const tempSortDirection = this.sortDirection;
      this.sortBy = null as any;
      this.sortDirection = 'asc';
      // Reapply sort with saved direction
      this.sortBy = tempSortBy;
      this.sortDirection = tempSortDirection;
      // Re-sort with the same field and direction
      this.sortStudents(currentSortBy as any);
    }
  }

  // Helper function to convert snake_case to camelCase for calculatedGrades properties
  private getCalculatedGradeKey(assessmentType: string): string {
    const mapping: { [key: string]: string } = {
      'notebook_correction': 'notebookCorrection',
      'duty': 'duty',
      'attendance': 'attendance',
      'behavior': 'behavior',
      'continuous_assessment': 'continuousAssessment',
      'oral_expression': 'oralExpression',
      'practical_work': 'practicalWork',
      'assignment': 'assignment',
      'test': 'test'
    };
    return mapping[assessmentType] || assessmentType;
  }

  calculateStudentGrades(student: Student): void {
    if (!student.grades) {
      student.grades = this.grades.filter(g => g.studentId === student.id);
    }

    const calculated: any = {};
    
    // Get grades for each assessment type
    this.assessments.forEach(assessment => {
      const key = this.getCalculatedGradeKey(assessment.type);
      
      if (assessment.type === 'attendance' || assessment.type === 'behavior') {
        // Automatic from attendance/behavior management
        calculated[key] = this.calculateAutomaticGrade(student, assessment, this.selectedTerm);
      } else if (assessment.type === 'continuous_assessment') {
        // Calculated automatically from notebook + duty + attendance + behavior
        calculated[key] = this.calculateAutomaticGrade(student, assessment, this.selectedTerm);
        } else {
          // Manual entry
          const grade = this.grades.find(g => 
            g.studentId === student.id && 
            g.assessmentId === assessment.id &&
            g.classId === this.selectedClass?.id &&
            g.term === this.selectedTerm
          );
          calculated[key] = grade ? grade.score : undefined;
        }
    });

    student.calculatedGrades = calculated;
    
    // Calculate averages
    // Calculate averages for current term and all terms
    const term1Avg = this.calculateTermAverage(student, 1);
    const term2Avg = this.calculateTermAverage(student, 2);
    const term3Avg = this.calculateTermAverage(student, 3);
    const annualAvg = this.calculateAnnualAverage(student);
    
    student.averages = {
      testAverage: this.calculateTestAverage(student),
      termAverage: this.calculateTermAverage(student),
      term1Average: term1Avg,
      term2Average: term2Avg,
      term3Average: term3Avg,
      annualAverage: annualAvg,
      classAverage: this.calculateClassAverage()
    };
  }

  calculateAutomaticGrade(student: Student, assessment: Assessment, term?: number): number {
    switch (assessment.type) {
      case 'attendance':
        return this.calculateAttendanceGrade(student, term);
      case 'behavior':
        return this.calculateBehaviorGrade(student, term);
      case 'continuous_assessment':
        return this.calculateContinuousAssessment(student, term);
      case 'practical_work':
        return this.calculatePracticalWorkGrade(student);
      default:
        return 0;
    }
  }

  getTermDateRange(term: number): { start: Date; end: Date } {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (جانفي = 0, ديسمبر = 11)
    let start: Date, end: Date;
    
    // تحديد سنة بداية العام الدراسي (تبدأ في سبتمبر)
    // إذا كنا في سبتمبر أو بعد ذلك، العام الدراسي يبدأ في نفس العام
    // وإلا، العام الدراسي يبدأ في العام السابق
    const academicYear = (currentMonth >= 8) ? currentYear : currentYear - 1;
    
    switch (term) {
      case 1:
        // الفصل الأول: سبتمبر إلى ديسمبر من نفس العام الدراسي
        start = new Date(academicYear, 8, 1); // سبتمبر (الشهر 8 في JavaScript)
        end = new Date(academicYear, 11, 31); // ديسمبر (الشهر 11)
        break;
      case 2:
        // الفصل الثاني: جانفي إلى مارس من السنة التالية للعام الدراسي
        // (لأن العام الدراسي يبدأ في سبتمبر)
        start = new Date(academicYear + 1, 0, 1); // جانفي (الشهر 0)
        end = new Date(academicYear + 1, 2, 31); // مارس (الشهر 2)
        break;
      case 3:
        // الفصل الثالث: أفريل إلى جوان من السنة التالية للعام الدراسي
        start = new Date(academicYear + 1, 3, 1); // أفريل (الشهر 3)
        end = new Date(academicYear + 1, 5, 30); // جوان (الشهر 5)
        break;
      default:
        start = new Date(academicYear, 8, 1);
        end = new Date(academicYear + 1, 5, 30);
    }
    
    return { start, end };
  }

  isDateInTerm(date: Date | string, term: number): boolean {
    const recordDate = typeof date === 'string' ? new Date(date) : date;
    const { start, end } = this.getTermDateRange(term);
    
    // Set time to start/end of day for proper comparison
    const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    return recordDateOnly >= startDateOnly && recordDateOnly <= endDateOnly;
  }

  calculateAttendanceGrade(student: Student, term?: number): number {
    // حساب نقاط الحضور تلقائياً من سجلات الحضور
    // يتم حساب النقاط بناءً على الفترة الزمنية للفصل الدراسي المحدد
    // الفصل الأول: سبتمبر إلى ديسمبر
    // الفصل الثاني: جانفي إلى مارس
    // الفصل الثالث: أفريل إلى جوان
    const maxScore = this.getAttendanceMaxFromSettings();
    const startScore = this.isAttendanceAutoApplyEnabled() ? maxScore / 2 : 0;
    // كل حضور أو معذور: +0.5
    // كل غياب أو مغادرة مبكرة: -0.5
    // كل متأخر: -0.25
    if (!this.selectedClass) return startScore;
    
    const termFilter = term || this.selectedTerm;
    // تصفية سجلات الحضور للتلميذ والقسم المحدد
    let studentRecords = this.attendanceRecords.filter(r => r.studentId === student.id && r.classId === this.selectedClass?.id);
    
    // تصفية السجلات حسب الفترة الزمنية للفصل الدراسي
    studentRecords = studentRecords.filter(r => {
      if (!r.date) return false;
      return this.isDateInTerm(r.date, termFilter);
    });
    
    if (studentRecords.length === 0) return startScore;
    
    let score = startScore;
    
    // كل حضور: +0.5
    const presentDays = studentRecords.filter(r => r.status === 'present').length;
    score += presentDays * 0.5;
    
    // كل معذور: +0.5
    const excusedDays = studentRecords.filter(r => r.status === 'excused').length;
    score += excusedDays * 0.5;
    
    // كل غياب: -0.5
    const absentDays = studentRecords.filter(r => r.status === 'absent').length;
    score -= absentDays * 0.5;
    
    // كل مغادرة مبكرة: -0.5
    const leftEarlyDays = studentRecords.filter(r => r.status === 'left_early').length;
    score -= leftEarlyDays * 0.5;
    
    // كل متأخر: -0.25
    const lateDays = studentRecords.filter(r => r.status === 'late').length;
    score -= lateDays * 0.25;
    
    return Math.max(0, Math.min(maxScore, score));
  }

  calculateBehaviorGrade(student: Student, term?: number): number {
    // حساب نقاط السلوك تلقائياً من أحداث السلوك
    // يتم حساب النقاط بناءً على الفترة الزمنية للفصل الدراسي المحدد
    // الفصل الأول: سبتمبر إلى ديسمبر
    // الفصل الثاني: جانفي إلى مارس
    // الفصل الثالث: أفريل إلى جوان
    const maxScore = this.getBehaviorMaxFromSettings();
    const startScore = this.isBehaviorAutoApplyEnabled() ? maxScore / 2 : 0;
    if (!this.selectedClass) return startScore;
    
    const termFilter = term || this.selectedTerm;
    // تصفية أحداث السلوك للتلميذ والقسم المحدد
    let studentEvents = this.behaviorEvents.filter(e => e.studentId === student.id && e.classId === this.selectedClass?.id);
    
    // تصفية الأحداث حسب الفترة الزمنية للفصل الدراسي
    studentEvents = studentEvents.filter(e => {
      if (!e.date) return false;
      return this.isDateInTerm(e.date, termFilter);
    });
    
    if (studentEvents.length === 0) return startScore;
    
    let score = startScore;
    
    // حساب النقاط بناءً على نوع السلوك
    studentEvents.forEach(event => {
      if (this.isBehaviorPositive(event.behaviorId)) {
        // سلوك إيجابي: +0.5
        score += 0.5;
      } else {
        // سلوك سلبي: -0.5
        score -= 0.5;
      }
    });
    
    return Math.max(0, Math.min(maxScore, score));
  }

  calculateContinuousAssessment(student: Student, term?: number): number {
    // Get calculated grades (attendance and behavior are automatic)
    const termFilter = term || this.selectedTerm;
    const behavior = this.calculateBehaviorGrade(student, termFilter);
    const attendance = this.calculateAttendanceGrade(student, termFilter);
    
    // Get manual grades (both on 5 points scale)
    const dutyGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'duty')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    );
    const notebookGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'notebook_correction')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    );
    
    const duty = dutyGrade?.score || 0;
    const notebook = notebookGrade?.score || 0;
    
    // التقييم المستمر = تصحيح الدفتر + الواجب + الحضور + السلوك
    // تصحيح الدفتر: 5 نقاط
    // الواجب: 5 نقاط
    // الحضور: 5 نقاط (تلقائي)
    // السلوك: 5 نقاط (تلقائي)
    // المجموع الكلي = 5 + 5 + 5 + 5 = 20 نقطة (الحد الأقصى)
    const customColumnsScore = this.getCustomColumns().reduce((sum, column) => {
      const columnScore = this.getCustomColumnGrade(student.id, column.id);
      return sum + (columnScore || 0);
    }, 0);
    const total = (notebook || 0) + (duty || 0) + (attendance || 0) + (behavior || 0) + customColumnsScore;
    
    // التأكد من أن النتيجة لا تتعدى 20 نقطة
    return Math.min(Math.max(total, 0), 20);
  }

  calculatePracticalWorkGrade(student: Student): number {
    // Get practical work grade from grades array
    if (!this.selectedClass) return 0;
    
    const practicalWorkGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'practical_work')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === this.selectedTerm
    );
    
    return practicalWorkGrade?.score || 0;
  }

  // Note: practical_work is now combined with oral_expression in one column

  calculateTestAverage(student: Student, term?: number): number {
    const termFilter = term || this.selectedTerm;
    const testGrades = this.grades.filter(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'test')?.id &&
      g.term === termFilter
    );
    
    if (testGrades.length === 0) return 0;
    const sum = testGrades.reduce((acc, g) => acc + g.score, 0);
    return sum / testGrades.length;
  }

  calculateTermAverage(student: Student, term?: number): number {
    const termFilter = term || this.selectedTerm;
    
    // Calculate grades for the specific term
    const behavior = this.calculateBehaviorGrade(student, termFilter);
    const attendance = this.calculateAttendanceGrade(student, termFilter);
    
    const dutyGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'duty')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    );
    const notebookGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'notebook_correction')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    );
    
    const duty = dutyGrade?.score || 0;
    const notebook = notebookGrade?.score || 0;
    const continuous = (notebook || 0) + (duty || 0) + (attendance || 0) + (behavior || 0);
    const continuousAssessment = Math.min(Math.max(continuous, 0), 20);
    
    // Check if oral expression column is included based on grading settings
    const includeOralExpression = this.currentClassGradingSettings?.includeOralExpression !== false;
    
    const oralExpressionGrade = includeOralExpression ? this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'oral_expression')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    ) : null;
    
    const assignmentGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'assignment')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    );
    const testGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'test')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    );
    
    const oralExpression = oralExpressionGrade?.score || 0;
    const assignment = assignmentGrade?.score || 0;
    const test = testGrade?.score || 0;
    
    // حساب المعدل حسب إعدادات التقييم
    if (includeOralExpression) {
      // المعدل العادي: ((التقييم المستمر + التعبير الشفهي/العمل العملي + الفرض) + (الاختبار × 2)) ÷ 5
      const part1 = continuousAssessment + oralExpression + assignment;
      const part2 = test * 2;
      const average = (part1 + part2) / 5;
      return average;
    } else {
      // المعدل عند إزالة عمود التعبير الشفهي: ((التقييم المستمر) + (الفرض) + (الاختبار × 2)) ÷ 4
      const part1 = continuousAssessment + assignment;
      const part2 = test * 2;
      const average = (part1 + part2) / 4;
      return average;
    }
  }

  calculateAnnualAverage(student: Student): number {
    // Calculate average for each term
    const term1Avg = this.calculateTermAverage(student, 1);
    const term2Avg = this.calculateTermAverage(student, 2);
    const term3Avg = this.calculateTermAverage(student, 3);

    // Annual average = average of 3 terms
    const terms = [term1Avg, term2Avg, term3Avg].filter(avg => avg > 0);
    if (terms.length === 0) return 0;
    
    const sum = terms.reduce((acc, avg) => acc + avg, 0);
    return sum / terms.length;
  }

  calculateClassAverage(): number {
    // Check if we have processed Excel data from enhanced import
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      return this.calculateClassAverageFromExcelData();
    }

    // Fall back to regular student data
    if (this.students.length === 0) return 0;

    // معدل القسم يجب أن يعتمد على الفصل الدراسي المحدد فقط
    const studentsWithTermAverage = this.students.filter(s => (s.averages?.termAverage || 0) > 0);
    if (studentsWithTermAverage.length === 0) return 0;

    const sum = studentsWithTermAverage.reduce((acc, s) => {
      const avg = s.averages?.termAverage || 0;
      return acc + avg;
    }, 0);

    return sum / studentsWithTermAverage.length;
  }

  calculateClassAverageFromExcelData(): number {
    if (!this.processedExcelData || this.processedExcelData.length === 0) return 0;

    const validData = this.processedExcelData.filter(row => (row.average || 0) > 0);
    if (validData.length === 0) return 0;

    const sum = validData.reduce((acc, row) => acc + (row.average || 0), 0);
    return sum / validData.length;
  }

  calculateRankings(): void {
    // ترتيب التلاميذ حسب معدل الفصل المحدد فقط (termAverage)
    const studentsWithAverages = this.students
      .filter(s => {
        const avg = s.averages?.termAverage || 0;
        return avg > 0;
      })
      .map(s => ({ ...s })) // Create a copy to avoid mutating
      .sort((a, b) => {
        const avgA = a.averages?.termAverage || 0;
        const avgB = b.averages?.termAverage || 0;
        // Sort descending (highest average first)
        return avgB - avgA;
      });
    
    // Assign rankings
    studentsWithAverages.forEach((student, index) => {
      const originalStudent = this.students.find(s => s.id === student.id);
      if (originalStudent) {
        originalStudent.ranking = index + 1;
      }
    });
    
    // Students without averages get no ranking
    this.students.forEach(student => {
      const avg = student.averages?.termAverage || 0;
      if (avg === 0) {
        student.ranking = undefined;
      }
    });
  }

  sortStudents(field: 'firstName' | 'lastName' | 'idNumber' | 'termAverage' | 'term1Average' | 'term2Average' | 'term3Average' | 'annualAverage' | 'ranking'): void {
    // If clicking the same field, toggle direction; otherwise, set to ascending
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }

    // Always recalculate rankings before sorting to ensure they're up to date
    this.calculateRankings();

    // Create a copy of the array to avoid mutating the original
    const studentsCopy = [...this.students];
    
    studentsCopy.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (field) {
        case 'firstName':
          valueA = (a.firstName || '').toLowerCase();
          valueB = (b.firstName || '').toLowerCase();
          break;
        case 'lastName':
          valueA = (a.lastName || '').toLowerCase();
          valueB = (b.lastName || '').toLowerCase();
          break;
        case 'idNumber':
          valueA = (a.idNumber || '').toString().toLowerCase();
          valueB = (b.idNumber || '').toString().toLowerCase();
          break;
        case 'termAverage':
          valueA = a.averages?.termAverage || 0;
          valueB = b.averages?.termAverage || 0;
          break;
        case 'term1Average':
          valueA = a.averages?.term1Average || 0;
          valueB = b.averages?.term1Average || 0;
          break;
        case 'term2Average':
          valueA = a.averages?.term2Average || 0;
          valueB = b.averages?.term2Average || 0;
          break;
        case 'term3Average':
          valueA = a.averages?.term3Average || 0;
          valueB = b.averages?.term3Average || 0;
          break;
        case 'annualAverage':
          valueA = a.averages?.annualAverage || 0;
          valueB = b.averages?.annualAverage || 0;
          break;
        case 'ranking':
          // For ranking, lower number is better (rank 1 is best)
          valueA = a.ranking || 999;
          valueB = b.ranking || 999;
          break;
        default:
          return 0;
      }

      // String comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB, 'ar', { sensitivity: 'base' });
        return this.sortDirection === 'asc' ? comparison : -comparison;
      }

      // Number comparison
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        // For ranking, ascending means rank 1 first (lower is better)
        // For averages, ascending means lower average first
        if (field === 'ranking') {
          return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        } else {
          // For averages, descending is usually better (higher average first)
          return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }
      }

      return 0;
    });

    // Update the students array
    this.students = studentsCopy;
  }

  getSortIcon(field: 'firstName' | 'lastName' | 'idNumber' | 'termAverage' | 'term1Average' | 'term2Average' | 'term3Average' | 'annualAverage' | 'ranking'): string {
    if (this.sortBy !== field) {
      return '↕️'; // Neutral icon when not sorted by this field
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  // Excel Import
  onExcelFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      this.processExcelData(jsonData);
    };

    reader.readAsArrayBuffer(file);
  }

  processExcelData(data: any[]): void {
    if (!this.selectedClass) {
      alert('يرجى اختيار القسم أولاً');
      return;
    }

    // Find header row
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some((cell: any) => 
        String(cell).toLowerCase().includes('name') || 
        String(cell).toLowerCase().includes('اسم') ||
        String(cell).toLowerCase().includes('id') ||
        String(cell).toLowerCase().includes('رقم') ||
        String(cell).toLowerCase().includes('code') ||
        String(cell).toLowerCase().includes('كود') ||
        String(cell).toLowerCase().includes('score') ||
        String(cell).toLowerCase().includes('درجة')
      )) {
        headerRow = i;
        break;
      }
    }

    const headers = data[headerRow] || [];
    
    // Find identifier column (name or idNumber)
    let identifierColIndex = -1;
    if (this.importIdentifier === 'idNumber') {
      identifierColIndex = headers.findIndex((h: any) => 
        String(h).toLowerCase().includes('id') || 
        String(h).toLowerCase().includes('رقم') ||
        String(h).toLowerCase().includes('code') ||
        String(h).toLowerCase().includes('كود') ||
        String(h).toLowerCase().includes('رقم التعريف') ||
        String(h).toLowerCase().includes('رقم الهوية')
      );
    } else {
      identifierColIndex = headers.findIndex((h: any) => 
        String(h).toLowerCase().includes('name') || 
        String(h).toLowerCase().includes('اسم')
      );
    }

    if (identifierColIndex === -1) {
      alert(this.importIdentifier === 'idNumber' 
        ? 'لم يتم العثور على عمود رقم الهوية/الكود في ملف Excel'
        : 'لم يتم العثور على عمود الاسم في ملف Excel');
      return;
    }

    // Determine which assessments to import
    let assessmentsToImport: Assessment[] = [];
    if (this.importMode === 'multiple') {
      // استيراد جميع أنواع التقييم: التقييم المستمر، التعبير الشفهي، الفرض، الاختبار
      const assessmentTypes: AssessmentType[] = ['continuous_assessment', 'oral_expression', 'assignment', 'test'];
      assessmentsToImport = this.assessments.filter(a => assessmentTypes.includes(a.type));
    } else {
      if (!this.selectedAssessment) {
        alert('يرجى اختيار نوع التقييم أولاً');
        return;
      }
      assessmentsToImport = [this.selectedAssessment];
    }

    if (assessmentsToImport.length === 0) {
      alert('لم يتم العثور على أنواع التقييم المطلوبة');
      return;
    }

    // Find score columns for each assessment
    const assessmentColumns: { assessment: Assessment; colIndex: number }[] = [];
    
    if (this.importMode === 'multiple') {
      // البحث عن أعمدة الدرجات لكل نوع تقييم
      for (const assessment of assessmentsToImport) {
        const colIndex = headers.findIndex((h: any) => {
          const headerStr = String(h).toLowerCase().trim();
          const assessmentNameAr = assessment.nameAr.toLowerCase().trim();
          
          // البحث المطابق الدقيق للاسم العربي
          if (headerStr === assessmentNameAr || 
              headerStr.includes(assessmentNameAr) || 
              assessmentNameAr.includes(headerStr)) {
            return true;
          }
          
          // البحث حسب نوع التقييم - كلمات مفتاحية متعددة
          switch (assessment.type) {
            case 'continuous_assessment':
              return headerStr.includes('continuous') || 
                     headerStr.includes('مستمر') || 
                     headerStr.includes('تقييم مستمر') ||
                     headerStr.includes('évaluation continue') ||
                     headerStr.includes('تقييم') && headerStr.includes('مستمر');
            case 'oral_expression':
              return (headerStr.includes('oral') && headerStr.includes('expression')) ||
                     (headerStr.includes('شفهي') && headerStr.includes('تعبير')) ||
                     headerStr.includes('تعبير شفهي') ||
                     headerStr.includes('expression orale') ||
                     headerStr.includes('شفهي') ||
                     headerStr.includes('تعبير') ||
                     headerStr.includes('oral') ||
                     headerStr.includes('expression') ||
                     (headerStr.includes('عمل') && headerStr.includes('عملي'));
            case 'assignment':
              return headerStr.includes('assignment') || 
                     headerStr.includes('فرض') ||
                     headerStr.includes('معدل الفروض') ||
                     headerStr.includes('معدل فرض') ||
                     headerStr.includes('devoir') ||
                     headerStr === 'فرض' ||
                     headerStr === 'معدل الفروض';
            case 'test':
              return headerStr.includes('test') || 
                     headerStr.includes('exam') ||
                     headerStr.includes('اختبار') ||
                     headerStr.includes('examen') ||
                     headerStr === 'اختبار';
            default:
              return false;
          }
        });
        
        if (colIndex !== -1) {
          assessmentColumns.push({ assessment, colIndex });
        } else {
          // إذا لم نجد عمود محدد، نضيفه كـ null للتحذير لاحقاً
          console.warn(`Column not found for assessment: ${assessment.nameAr} (${assessment.type})`);
        }
      }
      
      // إذا لم نجد أعمدة محددة، نبحث عن أعمدة "درجة" أو "score" عامة
      // ونحاول مطابقتها مع أنواع التقييم حسب الترتيب
      if (assessmentColumns.length === 0) {
        const scoreColumns = headers
          .map((h: any, index: number) => {
            const headerStr = String(h).toLowerCase().trim();
            // تجنب الأعمدة التي هي معرفات (اسم، رقم، إلخ)
            if ((headerStr.includes('score') || 
                 headerStr.includes('درجة') ||
                 headerStr.includes('mark') ||
                 headerStr.includes('note')) &&
                !headerStr.includes('name') &&
                !headerStr.includes('اسم') &&
                !headerStr.includes('id') &&
                !headerStr.includes('رقم') &&
                !headerStr.includes('code') &&
                !headerStr.includes('كود')) {
              return index;
            }
            return -1;
          })
          .filter((idx: number) => idx !== -1);
        
        // مطابقة الأعمدة مع أنواع التقييم حسب الترتيب
        if (scoreColumns.length >= assessmentsToImport.length) {
          for (let i = 0; i < assessmentsToImport.length; i++) {
            assessmentColumns.push({ 
              assessment: assessmentsToImport[i], 
              colIndex: scoreColumns[i] 
            });
          }
        } else {
          // إذا كان عدد الأعمدة أقل، نستخدم ما هو متاح
          for (let i = 0; i < scoreColumns.length; i++) {
            assessmentColumns.push({ 
              assessment: assessmentsToImport[i], 
              colIndex: scoreColumns[i] 
            });
          }
        }
      }
      
      // عرض معلومات عن الأعمدة التي تم العثور عليها
      if (assessmentColumns.length > 0) {
        console.log('Found assessment columns:', assessmentColumns.map(ac => ({
          assessment: ac.assessment.nameAr,
          column: headers[ac.colIndex]
        })));
      }
    } else {
      // استيراد نوع واحد - البحث عن عمود الدرجة
      const scoreColIndex = headers.findIndex((h: any) => 
        String(h).toLowerCase().includes('score') || 
        String(h).toLowerCase().includes('درجة') ||
        String(h).toLowerCase().includes('mark')
      );
      if (scoreColIndex === -1) {
        alert('لم يتم العثور على عمود الدرجة في ملف Excel');
        return;
      }
      assessmentColumns.push({ assessment: this.selectedAssessment!, colIndex: scoreColIndex });
    }

    if (assessmentColumns.length === 0) {
      const expectedColumns = this.importMode === 'multiple' 
        ? assessmentsToImport.map(a => a.nameAr).join('، ')
        : this.selectedAssessment?.nameAr || 'الدرجة';
      alert(`لم يتم العثور على أعمدة الدرجات في ملف Excel.\n\nالمتوقع: ${expectedColumns}\n\nتأكد من أن أسماء الأعمدة في ملف Excel تحتوي على:\n${this.importMode === 'multiple' 
        ? '- التقييم المستمر\n- التعبير الشفهي أو التعبير الشفهي/العمل العملي\n- الفرض أو معدل الفروض\n- الاختبار'
        : '- الدرجة أو Score'}`);
      return;
    }
    
    // تحذير إذا لم يتم العثور على جميع الأعمدة في وضع الاستيراد المتعدد
    if (this.importMode === 'multiple' && assessmentColumns.length < assessmentsToImport.length) {
      const found = assessmentColumns.map(ac => ac.assessment.nameAr).join('، ');
      const missing = assessmentsToImport
        .filter(a => !assessmentColumns.some(ac => ac.assessment.id === a.id))
        .map(a => a.nameAr)
        .join('، ');
      const confirmContinue = confirm(
        `تم العثور على أعمدة: ${found}\n\nلم يتم العثور على: ${missing}\n\nهل تريد المتابعة باستيراد الأعمدة الموجودة فقط؟`
      );
      if (!confirmContinue) {
        return;
      }
    }

    // Process rows
    let totalImported = 0;
    let processedCount = 0;
    let failedCount = 0;
    const totalRows = data.length - headerRow - 1;
    const importStats: { [assessmentId: number]: { name: string; count: number } } = {};
    
    // تهيئة الإحصائيات
    assessmentColumns.forEach(({ assessment }) => {
      importStats[assessment.id] = { name: assessment.nameAr, count: 0 };
    });

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const identifier = String(row[identifierColIndex] || '').trim();
      if (!identifier) continue;

      // Find student by identifier
      let student: Student | undefined;
      if (this.importIdentifier === 'idNumber') {
        // البحث الدقيق أولاً
        student = this.students.find(s => 
          s.idNumber && String(s.idNumber).trim() === String(identifier).trim()
        );
        // إذا لم نجد، نبحث بدون مسافات
        if (!student) {
          student = this.students.find(s => 
            s.idNumber && String(s.idNumber).replace(/\s/g, '') === String(identifier).replace(/\s/g, '')
          );
        }
      } else {
        student = this.students.find(s => {
          const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
          const reverseName = `${s.lastName} ${s.firstName}`.toLowerCase();
          const searchName = identifier.toLowerCase();
          return fullName === searchName ||
                 reverseName === searchName ||
                 fullName.includes(searchName) ||
                 reverseName.includes(searchName) ||
                 s.firstName.toLowerCase().includes(searchName) ||
                 s.lastName.toLowerCase().includes(searchName);
        });
      }

      if (!student) {
        console.warn(`Student not found: ${identifier}`);
        failedCount++;
        continue;
      }

      // Import grades for each assessment
      for (const { assessment, colIndex } of assessmentColumns) {
        const scoreValue = row[colIndex];
        if (scoreValue === null || scoreValue === undefined || scoreValue === '') continue;
        
        const score = parseFloat(String(scoreValue).replace(',', '.'));
        if (isNaN(score)) continue;

        const gradeData: CreateGradeDto = {
          studentId: student.id,
          assessmentId: assessment.id,
          classId: this.selectedClass.id,
          term: this.selectedTerm,
          score: score,
          maxScore: assessment.maxScore,
          date: this.formatDateForAPI(this.selectedDate)
        };

        this.apiService.post<Grade>('/grades', gradeData).subscribe({
          next: () => {
            totalImported++;
            importStats[assessment.id].count++;
            processedCount++;
            if (processedCount === totalRows * assessmentColumns.length || totalImported === 1) {
              this.loadGradesForClass(this.selectedClass!.id);
            }
          },
          error: (error) => {
            console.error(`Error importing grade for ${identifier} (${assessment.nameAr}):`, error);
            failedCount++;
            processedCount++;
          }
        });
      }
    }

    // Wait a bit before showing the alert to allow requests to complete
    setTimeout(() => {
      let message = `تم استيراد ${totalImported} درجة بنجاح`;
      
      if (this.importMode === 'multiple' && assessmentColumns.length > 1) {
        message += '\n\nالتفاصيل:\n';
        Object.values(importStats).forEach(stat => {
          if (stat.count > 0) {
            message += `- ${stat.name}: ${stat.count} درجة\n`;
          }
        });
      }
      
      if (failedCount > 0) {
        message += `\n\nملاحظة: فشل استيراد ${failedCount} صف`;
      }
      
      alert(message);
      this.closeImportModal();
    }, 1000);
  }

  openImportModal(): void {
    if (!this.selectedClass) {
      alert('يرجى اختيار القسم أولاً');
      return;
    }
    this.showImportModal = true;
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  // Reports
  openReportModal(): void {
    this.showReportModal = true;
    // تأكد من تحديث الرسوم البيانية قبل العرض أو التصدير
    setTimeout(() => {
      this.updateAllCharts();
      this.cdr.detectChanges();
    }, 0);
  }

  closeReportModal(): void {
    this.showReportModal = false;
  }

  getGradeStatistics(): GradeStatistics {
    // Check if we have processed Excel data from enhanced import
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      return this.getGradeStatisticsFromExcelData();
    }

    // Fall back to regular student data
    const stats: GradeStatistics = {
      lessThan4: 0,
      between4and6: 0,
      between6and8: 0,
      between8and10: 0,
      between10and12: 0,
      between12and14: 0,
      between14and16: 0,
      greaterThan16: 0,
      total: this.students.length
    };

    this.students.forEach(student => {
      const average = student.averages?.termAverage || 0;
      if (average < 4) stats.lessThan4++;
      else if (average < 6) stats.between4and6++;
      else if (average < 8) stats.between6and8++;
      else if (average < 10) stats.between8and10++;
      else if (average < 12) stats.between10and12++;
      else if (average < 14) stats.between12and14++;
      else if (average < 16) stats.between14and16++;
      else stats.greaterThan16++;
    });

    return stats;
  }

  getGradeStatisticsFromExcelData(): GradeStatistics {
    const stats: GradeStatistics = {
      lessThan4: 0,
      between4and6: 0,
      between6and8: 0,
      between8and10: 0,
      between10and12: 0,
      between12and14: 0,
      between14and16: 0,
      greaterThan16: 0,
      total: this.processedExcelData.length
    };

    this.processedExcelData.forEach(row => {
      const average = row.average || 0;
      if (average < 4) stats.lessThan4++;
      else if (average < 6) stats.between4and6++;
      else if (average < 8) stats.between6and8++;
      else if (average < 10) stats.between8and10++;
      else if (average < 12) stats.between10and12++;
      else if (average < 14) stats.between12and14++;
      else if (average < 16) stats.between14and16++;
      else stats.greaterThan16++;
    });

    return stats;
  }

  getGenderDistribution(): GenderDistribution {
    const maleStats: GradeStatistics = {
      lessThan4: 0, between4and6: 0, between6and8: 0, between8and10: 0,
      between10and12: 0, between12and14: 0, between14and16: 0, greaterThan16: 0, total: 0
    };
    const femaleStats: GradeStatistics = {
      lessThan4: 0, between4and6: 0, between6and8: 0, between8and10: 0,
      between10and12: 0, between12and14: 0, between14and16: 0, greaterThan16: 0, total: 0
    };

    this.students.forEach(student => {
      const average = student.averages?.termAverage || 0;
      const stats = student.gender === 'female' ? femaleStats : maleStats;
      stats.total++;
      
      if (average < 4) stats.lessThan4++;
      else if (average < 6) stats.between4and6++;
      else if (average < 8) stats.between6and8++;
      else if (average < 10) stats.between8and10++;
      else if (average < 12) stats.between10and12++;
      else if (average < 14) stats.between12and14++;
      else if (average < 16) stats.between14and16++;
      else stats.greaterThan16++;
    });

    return { male: maleStats, female: femaleStats };
  }

  getGradeRangeDistribution(): GradeRangeDistribution {
    // Check if we have processed Excel data from enhanced import
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      return this.getGradeRangeDistributionFromExcelData();
    }

    // Fall back to regular student data
    const dist: GradeRangeDistribution = {
      congratulations: 0, // >16
      encouragement: 0, // 14-16
      honorRoll: 0, // 12-14
      none: 0, // 10-12
      remarks: 0 // <10
    };

    this.students.forEach(student => {
      const average = student.averages?.termAverage || 0;
      if (average > 16) dist.congratulations++;
      else if (average >= 14) dist.encouragement++;
      else if (average >= 12) dist.honorRoll++;
      else if (average >= 10) dist.none++;
      else dist.remarks++;
    });

    return dist;
  }

  getGradeRangeDistributionFromExcelData(): GradeRangeDistribution {
    const dist: GradeRangeDistribution = {
      congratulations: 0, // >16
      encouragement: 0, // 14-16
      honorRoll: 0, // 12-14
      none: 0, // 10-12
      remarks: 0 // <10
    };

    this.processedExcelData.forEach(row => {
      const average = row.average || 0;
      if (average > 16) dist.congratulations++;
      else if (average >= 14) dist.encouragement++;
      else if (average >= 12) dist.honorRoll++;
      else if (average >= 10) dist.none++;
      else dist.remarks++;
    });

    return dist;
  }

  getStudentsAbove10(): number {
    // Check if we have processed Excel data from enhanced import
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      return this.getStudentsAbove10FromExcelData();
    }

    // Fall back to regular student data
    // عدد التلاميذ بمعدل ≥ 10 في الفصل الدراسي المحدد فقط
    return this.students.filter(s => {
      const termAvg = s.averages?.termAverage || 0;
      return termAvg >= 10;
    }).length;
  }

  getStudentsAbove10FromExcelData(): number {
    if (!this.processedExcelData) return 0;
    return this.processedExcelData.filter(row => (row.average || 0) >= 10).length;
  }

  getStudentsBelow10(): number {
    // Check if we have processed Excel data from enhanced import
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      return this.getStudentsBelow10FromExcelData();
    }

    // Fall back to regular student data
    // عدد التلاميذ بمعدل < 10 في الفصل الدراسي المحدد فقط
    return this.students.filter(s => {
      const termAvg = s.averages?.termAverage || 0;
      return termAvg > 0 && termAvg < 10;
    }).length;
  }

  getStudentsBelow10FromExcelData(): number {
    if (!this.processedExcelData) return 0;
    return this.processedExcelData.filter(row => (row.average || 0) > 0 && (row.average || 0) < 10).length;
  }

  getHighestGrade(): { student: Student; grade: number } | null {
    // Check if we have processed Excel data from enhanced import
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      const result = this.getHighestGradeFromExcelData();
      if (result) {
        // Create a mock student object for display purposes
        const mockStudent: Student = {
          id: 0,
          firstName: result.firstName || '',
          lastName: result.lastName || '',
          idNumber: '',
          averages: { termAverage: result.grade }
        } as Student;
        return { student: mockStudent, grade: result.grade };
      }
    }

    // Fall back to regular student data
    const studentsWithGrades = this.students
      .filter(s => s.averages?.termAverage !== undefined)
      .sort((a, b) => (b.averages?.termAverage || 0) - (a.averages?.termAverage || 0));

    if (studentsWithGrades.length === 0) return null;

    return {
      student: studentsWithGrades[0],
      grade: studentsWithGrades[0].averages?.termAverage || 0
    };
  }

  getHighestGradeFromExcelData(): { firstName: string; lastName: string; grade: number } | null {
    if (!this.processedExcelData || this.processedExcelData.length === 0) return null;

    const validData = this.processedExcelData.filter(row => (row.average || 0) > 0);
    if (validData.length === 0) return null;

    const sorted = validData.sort((a, b) => (b.average || 0) - (a.average || 0));
    const highest = sorted[0];

    return {
      firstName: highest.firstName || '',
      lastName: highest.lastName || '',
      grade: highest.average || 0
    };
  }

  getLowestGrade(): { student: Student; grade: number } | null {
    // Check if we have processed Excel data from enhanced import
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      const result = this.getLowestGradeFromExcelData();
      if (result) {
        // Create a mock student object for display purposes
        const mockStudent: Student = {
          id: 0,
          firstName: result.firstName || '',
          lastName: result.lastName || '',
          idNumber: '',
          averages: { termAverage: result.grade }
        } as Student;
        return { student: mockStudent, grade: result.grade };
      }
    }

    // Fall back to regular student data
    const studentsWithGrades = this.students
      .filter(s => s.averages?.termAverage !== undefined)
      .sort((a, b) => (a.averages?.termAverage || 0) - (b.averages?.termAverage || 0));

    if (studentsWithGrades.length === 0) return null;

    return {
      student: studentsWithGrades[0],
      grade: studentsWithGrades[0].averages?.termAverage || 0
    };
  }

  getLowestGradeFromExcelData(): { firstName: string; lastName: string; grade: number } | null {
    if (!this.processedExcelData || this.processedExcelData.length === 0) return null;

    const validData = this.processedExcelData.filter(row => (row.average || 0) > 0);
    if (validData.length === 0) return null;

    const sorted = validData.sort((a, b) => (a.average || 0) - (b.average || 0));
    const lowest = sorted[0];

    return {
      firstName: lowest.firstName || '',
      lastName: lowest.lastName || '',
      grade: lowest.average || 0
    };
  }

  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Chart data update methods
  updateGradeDistributionChart(): void {
    const stats = this.getGradeStatistics();
    this.gradeDistributionChartData = {
      ...this.gradeDistributionChartData,
      datasets: [{
        ...this.gradeDistributionChartData.datasets[0],
        data: [
          stats.lessThan4,
          stats.between4and6,
          stats.between6and8,
          stats.between8and10,
          stats.between10and12,
          stats.between12and14,
          stats.between14and16,
          stats.greaterThan16
        ]
      }]
    };
  }

  updateGradeRangeChart(): void {
    const dist = this.getGradeRangeDistribution();
    this.gradeRangeChartData = {
      ...this.gradeRangeChartData,
      datasets: [{
        ...this.gradeRangeChartData.datasets[0],
        data: [
          dist.congratulations,
          dist.encouragement,
          dist.honorRoll,
          dist.none,
          dist.remarks
        ]
      }]
    };
  }

  updateGenderChart(): void {
    const genderDist = this.getGenderDistribution();
    const maleAbove10 = genderDist.male.total - (genderDist.male.lessThan4 + genderDist.male.between4and6 + genderDist.male.between6and8 + genderDist.male.between8and10);
    const maleBelow10 = genderDist.male.lessThan4 + genderDist.male.between4and6 + genderDist.male.between6and8 + genderDist.male.between8and10;
    const femaleAbove10 = genderDist.female.total - (genderDist.female.lessThan4 + genderDist.female.between4and6 + genderDist.female.between6and8 + genderDist.female.between8and10);
    const femaleBelow10 = genderDist.female.lessThan4 + genderDist.female.between4and6 + genderDist.female.between6and8 + genderDist.female.between8and10;

    this.genderChartData = {
      ...this.genderChartData,
      datasets: [
        {
          ...this.genderChartData.datasets[0],
          data: [maleAbove10, maleBelow10]
        },
        {
          ...this.genderChartData.datasets[1],
          data: [femaleAbove10, femaleBelow10]
        }
      ]
    };
  }

  updateTermComparisonChart(): void {
    const term1Avg = this.calculateTermClassAverage(1);
    const term2Avg = this.calculateTermClassAverage(2);
    const term3Avg = this.calculateTermClassAverage(3);

    this.termComparisonChartData = {
      ...this.termComparisonChartData,
      datasets: [{
        ...this.termComparisonChartData.datasets[0],
        data: [term1Avg, term2Avg, term3Avg]
      }]
    };
  }

  updateAssessmentChart(): void {
    const labels: string[] = [];
    const data: number[] = [];

    this.assessments.forEach(assessment => {
      if (assessment.type !== 'continuous_assessment') {
        labels.push(assessment.nameAr);
        const avg = this.calculateAssessmentAverage(assessment.id);
        data.push(avg);
      }
    });

    this.assessmentChartData = {
      ...this.assessmentChartData,
      labels: labels,
      datasets: [{
        ...this.assessmentChartData.datasets[0],
        data: data
      }]
    };
  }

  calculateTermClassAverage(term: number): number {
    if (this.students.length === 0) return 0;
    
    const sum = this.students.reduce((acc, s) => {
      let avg = 0;
      if (term === 1) avg = s.averages?.term1Average || 0;
      else if (term === 2) avg = s.averages?.term2Average || 0;
      else if (term === 3) avg = s.averages?.term3Average || 0;
      return acc + avg;
    }, 0);
    
    return sum / this.students.length;
  }

  calculateAssessmentAverage(assessmentId: number): number {
    if (this.students.length === 0) return 0;
    
    const assessment = this.assessments.find(a => a.id === assessmentId);
    if (!assessment) return 0;

    const key = this.getCalculatedGradeKey(assessment.type);
    const sum = this.students.reduce((acc, s) => {
      const grade = s.calculatedGrades?.[key as keyof typeof s.calculatedGrades] as number || 0;
      return acc + grade;
    }, 0);
    
    return sum / this.students.length;
  }

  updateAllCharts(): void {
    this.updateGradeDistributionChart();
    this.updateGradeRangeChart();
    this.updateGenderChart();
    this.updateTermComparisonChart();
    this.updateAssessmentChart();
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      numberingSystem: 'latn'
    });
  }

  exportToExcel(): void {
    if (!this.selectedClass || this.students.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Prepare data for Excel
    const excelData: any[] = [];
    
     // Headers
     excelData.push([
       '#',
       this.translate('gradebook.idNumberOrCode'),
       this.translate('gradebook.firstName'),
       this.translate('gradebook.lastName'),
       this.translate('gradebook.birthDate'),
       `${this.translate('gradebook.notebookCorrection')} (5)`,
       `${this.translate('gradebook.homework')} (5)`,
       `${this.translate('gradebook.attendance5')}`,
       `${this.translate('gradebook.behavior5')}`,
       this.translate('gradebook.continuousAssessment'),
       this.translate('gradebook.oralExpression'),
       this.translate('gradebook.assignment'),
       this.translate('gradebook.test'),
       this.translate('gradebook.termAverage'),
       this.translate('gradebook.ratings'),
       this.translate('gradebook.guidance'),
       this.translate('gradebook.ranking')
     ]);

     // Data rows
     this.students.forEach((student, index) => {
       excelData.push([
         index + 1,
         student.idNumber || '-',
         student.firstName,
         student.lastName,
         this.formatDateOfBirth(student.dateOfBirth),
         student.calculatedGrades?.notebookCorrection?.toFixed(2) || '-',
         student.calculatedGrades?.duty?.toFixed(2) || '-',
         student.calculatedGrades?.attendance?.toFixed(2) || '-',
         student.calculatedGrades?.behavior?.toFixed(2) || '-',
         student.calculatedGrades?.continuousAssessment?.toFixed(2) || '-',
         student.calculatedGrades?.oralExpression?.toFixed(2) || '-',
         student.calculatedGrades?.assignment?.toFixed(2) || '-',
         student.calculatedGrades?.test?.toFixed(2) || '-',
         student.averages?.termAverage?.toFixed(2) || '-',
         this.getGradeRating(student),
         this.getGuidance(student),
         student.ranking || '-'
       ]);
     });

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الدرجات');

    // Generate filename
    const fileName = `سجل_الدرجات_${this.selectedClass.name}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  }

  async exportReportToPDF(): Promise<void> {
    if (!this.selectedClass) {
      alert('يرجى اختيار قسم أولاً');
      return;
    }

    // تأكد من أن الرسوم البيانية محدثة قبل الالتقاط
    this.updateAllCharts();
    await this.waitForReportCharts();

    try {
      const modalContent = document.querySelector('.reports-modal-content') as HTMLElement;
      if (!modalContent) {
        alert('لم يتم العثور على محتوى التقارير للتصدير');
        return;
      }

      // حفظ إعدادات الارتفاع الأصلية
      const originalMaxHeight = modalContent.style.maxHeight;
      const originalOverflow = modalContent.style.overflow;
      const originalHeight = modalContent.style.height;

      // إزالة القيود حتى تصبح كل الأقسام مرئية لـ html2canvas
      modalContent.style.maxHeight = 'none';
      modalContent.style.overflow = 'visible';
      modalContent.style.height = 'auto';
      modalContent.scrollTop = 0;

      await new Promise(resolve => setTimeout(resolve, 200));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;
      const globalScaleFactor = 0.9; // تصغير عام بسيط حتى تتسع الأقسام في صفحتين قدر الإمكان

      let currentY = margin;

      // إنشاء رأس التقرير كصورة حتى تظهر العربية بشكل صحيح داخل PDF
      const headerContainer = document.createElement('div');
      headerContainer.style.position = 'absolute';
      headerContainer.style.left = '-9999px';
      headerContainer.style.top = '0';
      headerContainer.style.width = '600px';
      headerContainer.style.backgroundColor = '#ffffff';
      headerContainer.style.padding = '16px';
      headerContainer.style.direction = 'rtl';
      headerContainer.style.textAlign = 'right';
      headerContainer.style.fontFamily = getComputedStyle(document.body).fontFamily || 'Arial, sans-serif';

      const headerTitle = document.createElement('h2');
      headerTitle.textContent = 'تقارير الدرجات';
      headerTitle.style.margin = '0 0 8px 0';
      headerTitle.style.fontSize = '22px';
      headerTitle.style.fontWeight = 'bold';
      headerTitle.style.color = '#111827';

      const headerInfo = document.createElement('p');
      const classInfo = this.selectedClass ? `القسم: ${this.selectedClass.name}` : '';
      const dateInfo = `التاريخ: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      headerInfo.textContent = `${classInfo}  |  ${dateInfo}`;
      headerInfo.style.margin = '0';
      headerInfo.style.fontSize = '13px';
      headerInfo.style.color = '#4b5563';

      headerContainer.appendChild(headerTitle);
      headerContainer.appendChild(headerInfo);
      document.body.appendChild(headerContainer);

      const headerCanvas = await html2canvas(headerContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(headerContainer);

      let headerWidth = availableWidth;
      let headerHeight = (headerCanvas.height * headerWidth) / headerCanvas.width;
      if (headerHeight > availableHeight) {
        const ratio = availableHeight / headerHeight;
        headerWidth = headerWidth * ratio;
        headerHeight = headerHeight * ratio;
      }

      headerWidth = headerWidth * globalScaleFactor;
      headerHeight = headerHeight * globalScaleFactor;

      const headerImg = headerCanvas.toDataURL('image/png');
      pdf.addImage(headerImg, 'PNG', pageWidth - margin - headerWidth, currentY, headerWidth, headerHeight);
      currentY += headerHeight + 6;

      // نلتقط كل قسم على حدة حتى لا يُقطع الجزء السفلي من التقرير
      const sectionElements = Array.from(
        modalContent.querySelectorAll('.grade-report-section')
      ) as HTMLElement[];

      // نعطي أولوية للأقسام المطلوبة لتكون في الصفحة الأولى قدر الإمكان
      const prioritySections: HTMLElement[] = [];
      const otherSections: HTMLElement[] = [];

      sectionElements.forEach((section) => {
        if (
          section.classList.contains('grade-report-summary-range') || // توزيع التلاميذ حسب الفئات
          section.classList.contains('grade-report-summary-highlow') || // أعلى / أقل درجة
          section.classList.contains('grade-report-summary-main') // معدل القسم + عدد التلاميذ ≥ / ≤ 10
        ) {
          prioritySections.push(section);
        } else {
          otherSections.push(section);
        }
      });

      // يبدأ التقرير بالإحصائيات، ثم الأقسام ذات الأولوية، ثم باقي الأقسام
      const orderedTargets: HTMLElement[] = [];
      const statsSection = sectionElements.find(s => s.classList.contains('grade-report-stats'));
      if (statsSection) {
        orderedTargets.push(statsSection);
      }

      prioritySections.forEach(sec => {
        if (!orderedTargets.includes(sec)) {
          orderedTargets.push(sec);
        }
      });

      otherSections.forEach(sec => {
        if (!orderedTargets.includes(sec)) {
          orderedTargets.push(sec);
        }
      });

      const targets = orderedTargets.length > 0 ? orderedTargets : [modalContent];

      for (const section of targets) {
        // نتأكد أن القسم مرئي بالكامل قبل الالتقاط
        section.scrollIntoView({ block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 150));

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        let imgWidth = availableWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        // إذا كان القسم طويلاً جداً، نقوم بتصغيره ليلائم ارتفاع الصفحة
        if (imgHeight > availableHeight) {
          const ratio = availableHeight / imgHeight;
          imgWidth = imgWidth * ratio;
          imgHeight = imgHeight * ratio;
        }

        // تطبيق عامل تصغير عام لزيادة احتمال تجمع التقرير في صفحتين
        imgWidth = imgWidth * globalScaleFactor;
        imgHeight = imgHeight * globalScaleFactor;

        // إذا لم يتبقَّ مكان كافٍ في الصفحة الحالية ننتقل إلى صفحة جديدة
        if (currentY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', pageWidth - margin - imgWidth, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 6;
      }

      // استعادة إعدادات الـ modal الأصلية
      modalContent.style.maxHeight = originalMaxHeight;
      modalContent.style.overflow = originalOverflow;
      modalContent.style.height = originalHeight;
      modalContent.scrollTop = 0;

      const fileName = `تقارير_الدرجات_${this.selectedClass.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  }

  // Small wait to let charts render after updateAllCharts before capture
  private waitForReportCharts(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  async exportGradesToPDF(): Promise<void> {
    if (!this.selectedClass) {
      alert('يرجى اختيار قسم أولاً');
      return;
    }

    try {
      // Create a temporary container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '297mm'; // Landscape A4 width
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';

      // Add title
      const title = document.createElement('h2');
      title.textContent = 'نتائج الفصل';
      title.style.textAlign = 'right';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      
      // Add class name and date
      const info = document.createElement('div');
      info.style.textAlign = 'right';
      info.style.marginBottom = '20px';
      info.style.fontSize = '14px';
      info.style.color = '#6b7280';
      
      const classLabel = this.translate('gradebook.class');
      const termLabel = this.translate('gradebook.term');
      const dateLabel = this.translate('gradebook.date');
      const termText =
        this.selectedTerm === 1
          ? this.translate('gradebook.term1')
          : this.selectedTerm === 2
            ? this.translate('gradebook.term2')
            : this.translate('gradebook.term3');

      const classInfo = this.selectedClass ? `${classLabel}: ${this.selectedClass.name}` : '';
      const dateLocale = document.documentElement.lang || 'ar';
      const dateInfo = `${dateLabel}: ${new Date().toLocaleDateString(dateLocale)}`;
      const termInfo = `${termLabel}: ${termText}`;
      info.innerHTML = `${classInfo} | ${termInfo}<br>${dateInfo}`;
      
      exportContainer.appendChild(title);
      exportContainer.appendChild(info);

      // Create table programmatically with all columns
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.border = '1px solid #000';
      table.style.fontSize = '10px';

      // Create header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#2563eb';
      headerRow.style.color = '#ffffff';
      
      const headers = [
        '#',
        this.translate('gradebook.idNumberOrCode'),
        this.translate('gradebook.firstName'),
        this.translate('gradebook.lastName'),
        this.translate('gradebook.birthDate'),
        this.translate('gradebook.notebookCorrection'),
        this.translate('gradebook.homework'),
        this.translate('gradebook.attendance5'),
        this.translate('gradebook.behavior5'),
        this.translate('gradebook.continuousAssessment'),
        this.translate('gradebook.oralExpression'),
        this.translate('gradebook.assignment'),
        this.translate('gradebook.test'),
        this.translate('gradebook.termAverage'),
        this.translate('gradebook.ratings'),
        this.translate('gradebook.guidance'),
        this.translate('gradebook.ranking')
      ];
      
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.border = '1px solid #000';
        th.style.padding = '6px';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create body rows
      const tbody = document.createElement('tbody');
      this.students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ccc';
        
        if ((student.averages?.termAverage || 0) < 10) {
          row.style.backgroundColor = '#fee2e2';
        }

        const cells = [
          (index + 1).toString(),
          student.idNumber || '-',
          student.firstName,
          student.lastName,
          this.formatDateOfBirth(student.dateOfBirth),
          student.calculatedGrades?.notebookCorrection?.toFixed(2) || '-',
          student.calculatedGrades?.duty?.toFixed(2) || '-',
          student.calculatedGrades?.attendance?.toFixed(2) || '-',
          student.calculatedGrades?.behavior?.toFixed(2) || '-',
          student.calculatedGrades?.continuousAssessment?.toFixed(2) || '-',
          student.calculatedGrades?.oralExpression?.toFixed(2) || '-',
          student.calculatedGrades?.assignment?.toFixed(2) || '-',
          student.calculatedGrades?.test?.toFixed(2) || '-',
          (student.averages?.termAverage || 0).toFixed(2),
          this.getGradeRating(student),
          this.getGuidance(student),
          student.ranking?.toString() || '-'
        ];

        cells.forEach((cellText, cellIndex) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.border = '1px solid #ccc';
          td.style.padding = '6px';
          td.style.textAlign = cellIndex === 0 || cellIndex === cells.length - 1 ? 'center' : 'right';
          
          // Color for term average
          if (cellIndex === 13) {
            const avg = student.averages?.termAverage || 0;
            if (avg < 10) {
              td.style.color = '#dc2626';
              td.style.fontWeight = 'bold';
            } else {
              td.style.color = '#16a34a';
              td.style.fontWeight = 'bold';
            }
          }
          
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });

      // Add footer rows
      const footerRow1 = document.createElement('tr');
      footerRow1.style.backgroundColor = '#f3f4f6';
      footerRow1.style.fontWeight = 'bold';
      const footerCell1 = document.createElement('td');
      footerCell1.textContent = this.translate('gradebook.classAverage');
      footerCell1.colSpan = 16;
      footerCell1.style.textAlign = 'right';
      footerCell1.style.padding = '6px';
      footerCell1.style.border = '1px solid #ccc';
      const footerCell1Value = document.createElement('td');
      footerCell1Value.textContent = this.calculateClassAverage().toFixed(2);
      footerCell1Value.style.textAlign = 'center';
      footerCell1Value.style.padding = '6px';
      footerCell1Value.style.border = '1px solid #ccc';
      footerRow1.appendChild(footerCell1);
      footerRow1.appendChild(footerCell1Value);
      tbody.appendChild(footerRow1);

      const footerRow2 = document.createElement('tr');
      footerRow2.style.backgroundColor = '#dbeafe';
      const footerCell2 = document.createElement('td');
      footerCell2.textContent = this.translate('gradebook.studentsWithAverage10InTerm');
      footerCell2.colSpan = 16;
      footerCell2.style.textAlign = 'right';
      footerCell2.style.padding = '6px';
      footerCell2.style.border = '1px solid #ccc';
      const footerCell2Value = document.createElement('td');
      footerCell2Value.textContent = this.getStudentsAbove10().toString();
      footerCell2Value.style.textAlign = 'center';
      footerCell2Value.style.color = '#16a34a';
      footerCell2Value.style.fontWeight = 'bold';
      footerCell2Value.style.padding = '6px';
      footerCell2Value.style.border = '1px solid #ccc';
      footerRow2.appendChild(footerCell2);
      footerRow2.appendChild(footerCell2Value);
      tbody.appendChild(footerRow2);

      const footerRow3 = document.createElement('tr');
      footerRow3.style.backgroundColor = '#fee2e2';
      const footerCell3 = document.createElement('td');
      footerCell3.textContent = this.translate('gradebook.studentsWithAverageBelow10InTerm');
      footerCell3.colSpan = 16;
      footerCell3.style.textAlign = 'right';
      footerCell3.style.padding = '6px';
      footerCell3.style.border = '1px solid #ccc';
      const footerCell3Value = document.createElement('td');
      footerCell3Value.textContent = this.getStudentsBelow10().toString();
      footerCell3Value.style.textAlign = 'center';
      footerCell3Value.style.color = '#dc2626';
      footerCell3Value.style.fontWeight = 'bold';
      footerCell3Value.style.padding = '6px';
      footerCell3Value.style.border = '1px solid #ccc';
      footerRow3.appendChild(footerCell3);
      footerRow3.appendChild(footerCell3Value);
      tbody.appendChild(footerRow3);

      table.appendChild(tbody);
      exportContainer.appendChild(table);
      
      document.body.appendChild(exportContainer);

      // Use html2canvas to capture the content
      const canvas = await html2canvas(exportContainer, {
        scale: 1.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.offsetHeight,
        windowWidth: exportContainer.scrollWidth,
        windowHeight: exportContainer.scrollHeight
      });

      // Clean up
      document.body.removeChild(exportContainer);

      // Calculate PDF dimensions (landscape A4 for wider table)
      const imgWidth = 297; // A4 width in mm (landscape)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      
      // Calculate scale to fit on page(s)
      const pageHeight = 210; // A4 height in mm (landscape)
      const pageWidth = 297; // A4 width in mm (landscape)
      const margin = 10; // Margin on all sides
      const availableHeight = pageHeight - (2 * margin);
      const availableWidth = pageWidth - (2 * margin);
      
      // Scale to fit width first
      let finalWidth = Math.min(imgWidth, availableWidth);
      let finalHeight = (canvas.height * finalWidth) / canvas.width;
      
      // Position content from top
      const xOffset = (pageWidth - finalWidth) / 2; // Center horizontally
      const yOffset = margin; // Start from top with margin

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Add additional pages if content is taller than one page
      let heightLeft = finalHeight - availableHeight;
      let position = -availableHeight;

      while (heightLeft > 0) {
        position = position - availableHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, position, finalWidth, finalHeight);
        heightLeft -= availableHeight;
      }

      const fileName = `${this.translate('gradebook.pdfFilePrefix')}_${this.selectedClass.name}_${this.selectedTerm}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting grades to PDF:', error);
      alert(this.translate('gradebook.exportPdfError'));
    }
  }

  // Calculate grade rating based on term average
  getGradeRating(student: Student): string {
    const average = student.averages?.termAverage || 0;
    const language = this.languageService.getCurrentLanguage() as 'AR' | 'FR' | 'EN';
    
    // استخدام القيم المخصصة إذا كانت موجودة
    if (this.currentClassGradingSettings?.customRatings && this.currentClassGradingSettings.customRatings.length > 0) {
      // البحث عن النطاق المناسب
      for (const range of this.currentClassGradingSettings.customRatings) {
        if (average >= range.min && (range.max === undefined || average < range.max)) {
          return range.ratings[language] || range.ratings.AR || range.ratings.FR || range.ratings.EN || '';
        }
      }
    }
    
    // استخدام القيم الافتراضية
    if (average >= 18) {
      return language === 'AR' ? 'ممتاز' : language === 'FR' ? 'Excellent' : 'Excellent';
    } else if (average >= 16) {
      return language === 'AR' ? 'عمل جيد جدا' : language === 'FR' ? 'Très bon travail' : 'Very good work';
    } else if (average >= 14) {
      return language === 'AR' ? 'عمل جيد' : language === 'FR' ? 'Bon travail' : 'Good work';
    } else if (average >= 12) {
      return language === 'AR' ? 'عمل حسن' : language === 'FR' ? 'Travail correct' : 'Fair work';
    } else if (average >= 10) {
      return language === 'AR' ? 'عمل متوسط' : language === 'FR' ? 'Travail moyen' : 'Average work';
    } else if (average >= 8) {
      return language === 'AR' ? 'دون الوسط' : language === 'FR' ? 'En dessous de la moyenne' : 'Below average';
    } else if (average >= 4) {
      return language === 'AR' ? 'عمل ناقص' : language === 'FR' ? 'Travail insuffisant' : 'Insufficient work';
    } else {
      return language === 'AR' ? 'عمل ناقص جدا' : language === 'FR' ? 'Travail très insuffisant' : 'Very insufficient work';
    }
  }

  // Calculate guidance based on term average
  getGuidance(student: Student): string {
    const average = student.averages?.termAverage || 0;
    const language = this.languageService.getCurrentLanguage() as 'AR' | 'FR' | 'EN';
    
    // استخدام القيم المخصصة إذا كانت موجودة
    if (this.currentClassGradingSettings?.customGuidance && this.currentClassGradingSettings.customGuidance.length > 0) {
      // البحث عن النطاق المناسب
      for (const range of this.currentClassGradingSettings.customGuidance) {
        if (average >= range.min && (range.max === undefined || average < range.max)) {
          return range.guidance[language] || range.guidance.AR || range.guidance.FR || range.guidance.EN || '';
        }
      }
    }
    
    // استخدام القيم الافتراضية
    if (average >= 18) {
      return language === 'AR' ? 'تلميذ نجيب يتمتع بقدرات عالية وجدية متميزة، أتمنى لك التوفيق' :
             language === 'FR' ? 'Élève assidu avec des capacités élevées et un sérieux remarquable, je vous souhaite succès' :
             'Diligent student with high abilities and remarkable seriousness, I wish you success';
    } else if (average >= 16) {
      return language === 'AR' ? 'عمل يستحق الشكر والتشجيع، واصل' :
             language === 'FR' ? 'Travail méritant des félicitations et des encouragements, continuez' :
             'Work deserving of congratulations and encouragement, continue';
    } else if (average >= 14) {
      return language === 'AR' ? 'نتائج مرضية وفي تحسن مستمر، لديك إمكانيات لمواصلة ذلك' :
             language === 'FR' ? 'Résultats satisfaisants et en amélioration continue, vous avez le potentiel de continuer' :
             'Satisfactory results and continuous improvement, you have the potential to continue';
    } else if (average >= 12) {
      return language === 'AR' ? 'نتائج حسنة، لديك امكانيات لمواصلة ذلك' :
             language === 'FR' ? 'Résultats corrects, vous avez le potentiel de continuer à vous améliorer' :
             'Good results, you have the potential to continue improving';
    } else if (average >= 10) {
      return language === 'AR' ? 'كان بالإمكان أن تكون النتائج أفضل' :
             language === 'FR' ? 'Les résultats auraient pu être meilleurs' :
             'Results could have been better';
    } else if (average >= 8) {
      return language === 'AR' ? 'عليك بمضاعفة مجهوداتك' :
             language === 'FR' ? 'Vous devez multiplier vos efforts' :
             'You need to multiply your efforts';
    } else if (average >= 6) {
      return language === 'AR' ? 'عليك ببذل المزيد من الجهد لتحسين نتائجك' :
             language === 'FR' ? 'Vous devez faire plus d\'efforts pour améliorer vos résultats' :
             'You need to make more effort to improve your results';
    } else {
      return language === 'AR' ? 'عمل ناقص عليك بمضاعفة مجهودك' :
             language === 'FR' ? 'Travail insuffisant, vous devez multiplier vos efforts' :
             'Insufficient work, you need to multiply your efforts';
    }
  }

  // Format date of birth for display
  formatDateOfBirth(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (this.languageService.getCurrentLanguage() === 'AR') {
      return `${year}/${month}/${day}`;
    }
    return `${day}/${month}/${year}`;
  }

  // Enhanced Excel Import Functions
  openEnhancedImportModal(): void {
    this.showEnhancedImportModal = true;
    this.processedExcelData = [];
    this.processedSheetsData = [];
    this.selectedLevel = 'primary';
    this.selectedLanguage = 'AR';
    this.autoGenerateObsCons = true;
  }

  closeEnhancedImportModal(): void {
    this.showEnhancedImportModal = false;
    this.isProcessing = false;
  }

  onEnhancedExcelFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    this.isProcessing = true;
    this.processedSheetsData = [];

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetNames = workbook.SheetNames;
        
        // Process all sheets
        let totalProcessed = 0;
        const allProcessedData: any[] = [];
        
        for (let sheetIndex = 0; sheetIndex < sheetNames.length; sheetIndex++) {
          const sheetName = sheetNames[sheetIndex];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          if (jsonData && jsonData.length > 0) {
            const sheetProcessedData = this.processEnhancedExcelData(jsonData, sheetName);
            if (sheetProcessedData && sheetProcessedData.length > 0) {
              this.processedSheetsData.push({
                sheetName: sheetName,
                data: sheetProcessedData
              });
              allProcessedData.push(...sheetProcessedData);
              totalProcessed += sheetProcessedData.length;
            }
          }
        }

        this.processedExcelData = allProcessedData;
        this.isProcessing = false;
        this.closeEnhancedImportModal();
        
        if (totalProcessed === 0) {
          alert('لم يتم العثور على بيانات صحيحة في أي صفحة من صفحات الملف');
        } else {
          alert(`تم معالجة ${totalProcessed} سجل بنجاح من ${this.processedSheetsData.length} صفحة في ملف Excel`);
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('حدث خطأ أثناء قراءة ملف Excel');
        this.isProcessing = false;
      }
    };

    reader.readAsArrayBuffer(file);
  }

  processEnhancedExcelData(data: any[], sheetName?: string): any[] {
    if (!data || data.length === 0) {
      alert('الملف فارغ أو غير صحيح');
      return [];
    }

    // Find header row
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some((cell: any) => {
        const cellStr = String(cell || '').toLowerCase();
        return cellStr.includes('name') || 
               cellStr.includes('اسم') || 
               cellStr.includes('nom') ||
               cellStr.includes('score') ||
               cellStr.includes('درجة') ||
               cellStr.includes('note') ||
               cellStr.includes('mark');
      })) {
        headerRow = i;
        break;
      }
    }

    const headers = data[headerRow] || [];
    
    // Find column indices
    const findColumnIndex = (keywords: string[]): number => {
      for (let i = 0; i < headers.length; i++) {
        const headerStr = String(headers[i] || '').trim();
        const headerStrLower = headerStr.toLowerCase();
        // Try exact match first, then partial match
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          // Exact match (case-insensitive)
          if (headerStrLower === keywordLower) {
            return i;
          }
          // Contains match (case-insensitive)
          if (headerStrLower.includes(keywordLower) || headerStr.includes(keyword)) {
            return i;
          }
        }
      }
      return -1;
    };

    const firstNameColIndex = findColumnIndex(['firstname', 'الاسم', 'prénom', 'prenom', 'first', 'nom']);
    const lastNameColIndex = findColumnIndex(['lastname', 'اللقب', 'nom', 'last', 'family']);
    const nameColIndex = findColumnIndex(['name', 'اسم', 'nom', 'الاسم الكامل']);
    const idColIndex = findColumnIndex(['id', 'رقم', 'code', 'numéro', 'number']);
    
    // Find observation and guidance columns (if they exist in Excel)
    // نحاول دعم أكثر ما يمكن من الصيغ مثل: الملاحظات (obs)، ملاحظات، obs ...
    const observationColIndex = findColumnIndex([
      'obs',
      'observation',
      'observations',
      'obv',
      'obs.',
      'ملاحظات',
      'الملاحظات',
      'ملاحظة',
      'الملاحظة',
      'ملاحظات (obs)',
      'الملاحظات (obs)',
      '(obs)',
      'obs)',
      'ملاحظات obs',
      'الملاحظات obs'
    ]);
    const guidanceColIndex = findColumnIndex([
      'cons',
      'guidance',
      'conseils',
      'conseil',
      'cons.',
      'إرشادات',
      'الإرشادات',
      'إرشاد',
      'الإرشاد',
      'إرشادات (cons)',
      'الإرشادات (cons)',
      '(cons)',
      'cons)',
      'إرشادات cons',
      'الإرشادات cons'
    ]);
    
    // Debug: Log found column indices and all headers
    if (!this.autoGenerateObsCons) {
      console.log('=== Excel Import Debug ===');
      console.log('Auto-generate Obs/Cons:', this.autoGenerateObsCons);
      console.log('Observation column index:', observationColIndex, observationColIndex !== -1 ? `(Header: "${headers[observationColIndex]}")` : '(Not found)');
      console.log('Guidance column index:', guidanceColIndex, guidanceColIndex !== -1 ? `(Header: "${headers[guidanceColIndex]}")` : '(Not found)');
      console.log('All headers in Excel file:', headers.map((h: any, idx: number) => `${idx}: "${h}"`));
      console.log('========================');
    }

    // Find all grade columns (exclude name, id, and average columns)
    const gradeColumnIndices: number[] = [];
    const excludedKeywords = ['name', 'اسم', 'nom', 'id', 'رقم', 'code', 'obs', 'cons', 'ملاحظات', 'إرشادات', 'observation', 'guidance', 'observations', 'conseils', 'date', 'تاريخ', 'classe', 'قسم', 'class', 'ترتيب', 'ranking', 'رتبة', 'obv', 'obs.', 'cons.'];
    
    // Grade column keywords (common Arabic names for grade columns)
    const gradeKeywords = [
      'تقييم', 'تقييم مستمر', 'continuous', 'assessment', 'مستمر',
      'فرض', 'assignment', 'devoir', 'contrôle', 'contrôle continu',
      'اختبار', 'test', 'examen', 'exam', 'évaluation',
      'شفوي', 'oral', 'expression', 'تعبير', 'expression orale',
      'عملي', 'practical', 'pratique', 'travail', 'travaux pratiques',
      'دفتر', 'notebook', 'cahier', 'cahier de classe',
      'واجب', 'duty', 'devoir maison', 'devoirs',
      'حضور', 'attendance', 'présence',
      'سلوك', 'behavior', 'comportement', 'conduite',
      'درجة', 'score', 'note', 'mark', 'point', 'points',
      'معدل', 'average', 'moyenne', 'moy', 'moyennes',
      'رياضيات', 'math', 'maths', 'mathematics', 'géométrie',
      'عربية', 'arabe', 'arabic', 'langue',
      'فرنسية', 'français', 'french',
      'إنجليزية', 'anglais', 'english',
      'علوم', 'sciences', 'science',
      'تاريخ', 'histoire', 'history',
      'جغرافيا', 'géographie', 'geography',
      'تربية', 'éducation', 'éducation physique'
    ];
    
    // Also exclude name and id column indices we already found
    const excludedIndices = [firstNameColIndex, lastNameColIndex, nameColIndex, idColIndex].filter(idx => idx !== -1);
    
    for (let i = 0; i < headers.length; i++) {
      // Skip excluded indices
      if (excludedIndices.includes(i)) continue;
      
      const headerStr = String(headers[i] || '').trim();
      if (headerStr === '' || headerStr === '#') continue;
      
      const headerStrLower = headerStr.toLowerCase();
      
      // Check if header is just a number (like 01, 02, 3, 9) - these could be grade columns
      const isNumericHeader = /^0?\d+$/.test(headerStr.trim());
      
      // Check if this column header contains grade-related keywords
      // Search both in lower case and original case (for Arabic)
      const isGradeColumnByKeyword = gradeKeywords.some(keyword => {
        const keywordLower = keyword.toLowerCase();
        // Check in both directions for Arabic text
        return headerStrLower.includes(keywordLower) || 
               headerStr.includes(keyword) ||
               headerStr.includes(keyword.toLowerCase()) ||
               headerStr.includes(keyword.toUpperCase());
      });
      
      // Skip if it's a name, id, or other excluded column
      const isExcluded = excludedKeywords.some(keyword => headerStrLower.includes(keyword));
      
      // Check if this column contains numeric data (likely a grade column)
      let numericValueCount = 0;
      let totalChecked = 0;
      
      for (let j = headerRow + 1; j < Math.min(headerRow + 11, data.length); j++) {
        const row = data[j];
        if (row && row[i] !== undefined && row[i] !== null && row[i] !== '') {
          totalChecked++;
          const value = parseFloat(String(row[i]));
          // Accept values between 0 and 20 (standard grading scale)
          // Also accept percentage values (0-100) but we'll normalize them
          if (!isNaN(value) && value >= 0 && (value <= 20 || value <= 100)) {
            numericValueCount++;
          }
        }
      }
      
      // More lenient: if column has numeric data and is not excluded, include it
      // But exclude if header looks like it's a name, ID, or other metadata
      const looksLikeMetadata = headerStrLower.includes('nom') || 
                                 headerStrLower.includes('prenom') ||
                                 headerStrLower.includes('prénom') ||
                                 headerStrLower.includes('date') ||
                                 headerStrLower.includes('classe') ||
                                 headerStrLower.includes('قسم') ||
                                 headerStrLower.includes('ترتيب') ||
                                 headerStrLower.includes('ranking') ||
                                 headerStrLower === 'obs' ||
                                 headerStrLower === 'cons' ||
                                 headerStrLower.includes('obs ') ||
                                 headerStrLower.includes('cons ') ||
                                 headerStrLower.startsWith('obs') ||
                                 headerStrLower.startsWith('cons');
      
      // Include column if:
      // 1. It has grade-related keywords in header, OR
      // 2. At least 30% of checked values are numeric grades between 0-20 (more lenient), OR
      // 3. It has at least 2 numeric grade values (very lenient for small datasets)
      const hasValidNumericData = totalChecked > 0 && (numericValueCount / totalChecked) >= 0.3;
      const hasMinNumericData = numericValueCount >= 2;
      
      // Include column if:
      // 1. It's a numeric header (like 01, 02, 3, 9) AND has grade data, OR
      // 2. It has grade-related keywords in header, OR
      // 3. It has valid numeric grade data
      // But exclude obs, cons, and metadata columns
      if (!isExcluded && !looksLikeMetadata) {
        // For numeric headers, check if they have grade data
        if (isNumericHeader && (hasValidNumericData || hasMinNumericData)) {
          gradeColumnIndices.push(i);
        } else if (!isNumericHeader && (isGradeColumnByKeyword || hasValidNumericData || hasMinNumericData)) {
          gradeColumnIndices.push(i);
        }
      }
    }

    if (gradeColumnIndices.length === 0) {
      // Show found headers for debugging
      const foundHeaders = headers.filter((h: any, idx: number) => 
        !excludedIndices.includes(idx) && 
        String(h || '').trim() !== '' && 
        String(h || '').trim() !== '#'
      ).slice(0, 10);
      
      const headersList = foundHeaders.length > 0 
        ? `\nالأعمدة الموجودة في الملف:\n${foundHeaders.join(', ')}`
        : '';
      
      alert(`لم يتم العثور على أعمدة الدرجات في ملف Excel.\n\nيرجى التأكد من أن الملف يحتوي على أعمدة للدرجات مثل:\n- التقييم المستمر\n- معدل الفرض\n- الاختبار\n- التعبير الشفهي\n- العمل العملي\n- تصحيح الدفتر\n- الواجب\n- الحضور\n- السلوك\n\n${headersList}\n\nملاحظة: يجب أن تحتوي أعمدة الدرجات على قيم رقمية بين 0 و 20`);
      return [];
    }

    // Process rows
    const processedData: any[] = [];
    
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      let firstName = '';
      let lastName = '';
      let average = 0;

      // Extract name
      if (firstNameColIndex !== -1 && lastNameColIndex !== -1) {
        firstName = String(row[firstNameColIndex] || '').trim();
        lastName = String(row[lastNameColIndex] || '').trim();
      } else if (nameColIndex !== -1) {
        const fullName = String(row[nameColIndex] || '').trim();
        const nameParts = fullName.split(/\s+/);
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else {
          firstName = fullName;
          lastName = '';
        }
      } else {
        // Skip rows without name
        continue;
      }

      // Calculate average from grade columns
      let sum = 0;
      let count = 0;
      
      for (const gradeColIndex of gradeColumnIndices) {
        const gradeValue = row[gradeColIndex];
        if (gradeValue !== undefined && gradeValue !== null && gradeValue !== '') {
          let grade = parseFloat(String(gradeValue));
          if (!isNaN(grade) && grade >= 0) {
            // If grade is in percentage format (0-100), convert to 0-20 scale
            if (grade > 20 && grade <= 100) {
              grade = (grade / 100) * 20;
            }
            // Only accept grades in 0-20 range
            if (grade <= 20) {
              sum += grade;
              count++;
            }
          }
        }
      }

      if (count === 0) {
        continue; // Skip rows without valid grades
      }

      average = sum / count;

      // Generate or read observation and guidance
      let observation = '';
      let guidance = '';
      
      if (this.autoGenerateObsCons) {
        // Generate automatically based on average
        observation = this.generateObservation(average, this.selectedLevel, this.selectedLanguage);
        guidance = this.generateGuidance(average, this.selectedLevel, this.selectedLanguage);
      } else {
        // Read from Excel file if columns exist
        if (observationColIndex !== -1) {
          const obsValue = row[observationColIndex];
          // Check if value exists and is not empty
          if (obsValue !== undefined && obsValue !== null) {
            const obsStr = String(obsValue).trim();
            if (obsStr !== '' && obsStr !== '-' && obsStr.toLowerCase() !== 'null' && obsStr.toLowerCase() !== 'undefined') {
              observation = obsStr;
              // Debug log for first row
              if (processedData.length === 0) {
                console.log('✓ Reading observation from Excel:', observation, 'from column index:', observationColIndex, 'Raw value:', obsValue);
              }
            } else if (processedData.length === 0) {
              console.log('✗ Observation column found but value is empty. Column index:', observationColIndex, 'Raw value:', obsValue);
            }
          } else if (processedData.length === 0) {
            console.log('✗ Observation column found but value is null/undefined. Column index:', observationColIndex);
          }
        } else if (processedData.length === 0) {
          console.log('✗ Observation column not found in Excel file');
        }
        
        if (guidanceColIndex !== -1) {
          const consValue = row[guidanceColIndex];
          // Check if value exists and is not empty
          if (consValue !== undefined && consValue !== null) {
            const consStr = String(consValue).trim();
            if (consStr !== '' && consStr !== '-' && consStr.toLowerCase() !== 'null' && consStr.toLowerCase() !== 'undefined') {
              guidance = consStr;
              // Debug log for first row
              if (processedData.length === 0) {
                console.log('✓ Reading guidance from Excel:', guidance, 'from column index:', guidanceColIndex, 'Raw value:', consValue);
              }
            } else if (processedData.length === 0) {
              console.log('✗ Guidance column found but value is empty. Column index:', guidanceColIndex, 'Raw value:', consValue);
            }
          } else if (processedData.length === 0) {
            console.log('✗ Guidance column found but value is null/undefined. Column index:', guidanceColIndex);
          }
        } else if (processedData.length === 0) {
          console.log('✗ Guidance column not found in Excel file');
        }
      }

      processedData.push({
        id: idColIndex !== -1 ? (row[idColIndex] || processedData.length + 1) : processedData.length + 1,
        firstName,
        lastName,
        average,
        observation,
        guidance,
        originalRow: row, // Keep original row data for export
        gradeColumns: gradeColumnIndices.map(idx => ({
          index: idx,
          header: headers[idx],
          value: row[idx]
        }))
      });
    }

    // Add sheet name to each processed row for reference
    processedData.forEach(row => {
      row.sheetName = sheetName || 'Sheet1';
    });

    return processedData;
  }

  generateObservation(average: number, level: 'primary' | 'middle' | 'secondary', language: 'AR' | 'FR' | 'EN'): string {
    if (language === 'AR') {
      if (average >= 18) {
        return level === 'primary' ? 'تلميذ ممتاز، متفوق في جميع المواد' : 
               level === 'middle' ? 'تلميذ ممتاز، متفوق في جميع المواد' : 
               'طالب ممتاز، متفوق في جميع المواد';
      } else if (average >= 16) {
        return level === 'primary' ? 'تلميذ مجتهد، نتائج جيدة جداً' : 
               level === 'middle' ? 'تلميذ مجتهد، نتائج جيدة جداً' : 
               'طالب مجتهد، نتائج جيدة جداً';
      } else if (average >= 14) {
        return level === 'primary' ? 'تلميذ مجتهد، نتائج جيدة' : 
               level === 'middle' ? 'تلميذ مجتهد، نتائج جيدة' : 
               'طالب مجتهد، نتائج جيدة';
      } else if (average >= 12) {
        return level === 'primary' ? 'تلميذ يحتاج إلى مزيد من الجهد' : 
               level === 'middle' ? 'تلميذ يحتاج إلى مزيد من الجهد' : 
               'طالب يحتاج إلى مزيد من الجهد';
      } else if (average >= 10) {
        return level === 'primary' ? 'تلميذ يحتاج إلى تحسين الأداء' : 
               level === 'middle' ? 'تلميذ يحتاج إلى تحسين الأداء' : 
               'طالب يحتاج إلى تحسين الأداء';
      } else if (average >= 8) {
        return level === 'primary' ? 'تلميذ يحتاج إلى متابعة خاصة' : 
               level === 'middle' ? 'تلميذ يحتاج إلى متابعة خاصة' : 
               'طالب يحتاج إلى متابعة خاصة';
      } else {
        return level === 'primary' ? 'تلميذ يحتاج إلى دعم إضافي' : 
               level === 'middle' ? 'تلميذ يحتاج إلى دعم إضافي' : 
               'طالب يحتاج إلى دعم إضافي';
      }
    } else if (language === 'FR') {
      if (average >= 18) {
        return level === 'primary' ? 'Élève excellent, excellent dans toutes les matières' : 
               level === 'middle' ? 'Élève excellent, excellent dans toutes les matières' : 
               'Étudiant excellent, excellent dans toutes les matières';
      } else if (average >= 16) {
        return level === 'primary' ? 'Élève assidu, très bons résultats' : 
               level === 'middle' ? 'Élève assidu, très bons résultats' : 
               'Étudiant assidu, très bons résultats';
      } else if (average >= 14) {
        return level === 'primary' ? 'Élève assidu, bons résultats' : 
               level === 'middle' ? 'Élève assidu, bons résultats' : 
               'Étudiant assidu, bons résultats';
      } else if (average >= 12) {
        return level === 'primary' ? 'Élève nécessite plus d\'efforts' : 
               level === 'middle' ? 'Élève nécessite plus d\'efforts' : 
               'Étudiant nécessite plus d\'efforts';
      } else if (average >= 10) {
        return level === 'primary' ? 'Élève nécessite une amélioration des performances' : 
               level === 'middle' ? 'Élève nécessite une amélioration des performances' : 
               'Étudiant nécessite une amélioration des performances';
      } else if (average >= 8) {
        return level === 'primary' ? 'Élève nécessite un suivi spécial' : 
               level === 'middle' ? 'Élève nécessite un suivi spécial' : 
               'Étudiant nécessite un suivi spécial';
      } else {
        return level === 'primary' ? 'Élève nécessite un soutien supplémentaire' : 
               level === 'middle' ? 'Élève nécessite un soutien supplémentaire' : 
               'Étudiant nécessite un soutien supplémentaire';
      }
    } else { // EN
      if (average >= 18) {
        return level === 'primary' ? 'Excellent student, outstanding in all subjects' : 
               level === 'middle' ? 'Excellent student, outstanding in all subjects' : 
               'Excellent student, outstanding in all subjects';
      } else if (average >= 16) {
        return level === 'primary' ? 'Diligent student, very good results' : 
               level === 'middle' ? 'Diligent student, very good results' : 
               'Diligent student, very good results';
      } else if (average >= 14) {
        return level === 'primary' ? 'Diligent student, good results' : 
               level === 'middle' ? 'Diligent student, good results' : 
               'Diligent student, good results';
      } else if (average >= 12) {
        return level === 'primary' ? 'Student needs more effort' : 
               level === 'middle' ? 'Student needs more effort' : 
               'Student needs more effort';
      } else if (average >= 10) {
        return level === 'primary' ? 'Student needs performance improvement' : 
               level === 'middle' ? 'Student needs performance improvement' : 
               'Student needs performance improvement';
      } else if (average >= 8) {
        return level === 'primary' ? 'Student needs special follow-up' : 
               level === 'middle' ? 'Student needs special follow-up' : 
               'Student needs special follow-up';
      } else {
        return level === 'primary' ? 'Student needs additional support' : 
               level === 'middle' ? 'Student needs additional support' : 
               'Student needs additional support';
      }
    }
  }

  generateGuidance(average: number, level: 'primary' | 'middle' | 'secondary', language: 'AR' | 'FR' | 'EN'): string {
    if (language === 'AR') {
      if (average >= 18) {
        return 'تلميذ نجيب يتمتع بقدرات عالية وجدية متميزة، أتمنى لك التوفيق والاستمرار في هذا المستوى المتميز';
      } else if (average >= 16) {
        return 'عمل يستحق الشكر والتشجيع، واصل في نفس الوتيرة للحفاظ على هذا المستوى الجيد';
      } else if (average >= 14) {
        return 'نتائج مرضية وفي تحسن مستمر، لديك إمكانيات لمواصلة التقدم والتحسن';
      } else if (average >= 12) {
        return 'نتائج حسنة، لديك إمكانيات لمواصلة التحسن، حاول بذل المزيد من الجهد';
      } else if (average >= 10) {
        return 'كان بالإمكان أن تكون النتائج أفضل، عليك ببذل المزيد من الجهد والتركيز في الدراسة';
      } else if (average >= 8) {
        return 'عليك بمضاعفة مجهوداتك والتركيز أكثر في الحصص الدراسية';
      } else if (average >= 6) {
        return 'عليك ببذل المزيد من الجهد لتحسين نتائجك، راجع دروسك بانتظام';
      } else {
        return 'عمل ناقص جداً، عليك بمضاعفة مجهودك والالتزام بالدراسة بشكل جدي';
      }
    } else if (language === 'FR') {
      if (average >= 18) {
        return 'Élève assidu avec des capacités élevées et un sérieux remarquable, je vous souhaite succès et continuation à ce niveau excellent';
      } else if (average >= 16) {
        return 'Travail méritant des félicitations et des encouragements, continuez à ce rythme pour maintenir ce bon niveau';
      } else if (average >= 14) {
        return 'Résultats satisfaisants et en amélioration continue, vous avez le potentiel de continuer à progresser';
      } else if (average >= 12) {
        return 'Résultats corrects, vous avez le potentiel de continuer à vous améliorer, essayez de faire plus d\'efforts';
      } else if (average >= 10) {
        return 'Les résultats auraient pu être meilleurs, vous devez faire plus d\'efforts et vous concentrer sur vos études';
      } else if (average >= 8) {
        return 'Vous devez multiplier vos efforts et vous concentrer davantage en classe';
      } else if (average >= 6) {
        return 'Vous devez faire plus d\'efforts pour améliorer vos résultats, révisez régulièrement vos leçons';
      } else {
        return 'Travail très insuffisant, vous devez multiplier vos efforts et vous engager sérieusement dans vos études';
      }
    } else { // EN
      if (average >= 18) {
        return 'Diligent student with high abilities and remarkable seriousness, I wish you success and continuation at this excellent level';
      } else if (average >= 16) {
        return 'Work deserving of congratulations and encouragement, continue at this pace to maintain this good level';
      } else if (average >= 14) {
        return 'Satisfactory results and continuous improvement, you have the potential to continue progressing';
      } else if (average >= 12) {
        return 'Good results, you have the potential to continue improving, try to make more effort';
      } else if (average >= 10) {
        return 'Results could have been better, you need to make more effort and focus on your studies';
      } else if (average >= 8) {
        return 'You need to multiply your efforts and focus more in class';
      } else if (average >= 6) {
        return 'You need to make more effort to improve your results, review your lessons regularly';
      } else {
        return 'Very insufficient work, you need to multiply your efforts and commit seriously to your studies';
      }
    }
  }

  downloadProcessedExcel(): void {
    if (!this.processedExcelData || this.processedExcelData.length === 0) {
      alert('لا توجد بيانات للتحميل');
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 0: تقرير أخطاء النقاط (للاطلاع مباشرة بعد الاستيراد)
    const gradeErrors = this.getStudentsWithGradeErrors();
    if (gradeErrors && gradeErrors.length > 0) {
      const errorSheetData: any[] = [
        ['#', 'الاسم', 'الصفحة', 'العمود', 'القيمة', 'الخطأ']
      ];

      gradeErrors.forEach((student: any, studentIndex: number) => {
        student.errors.forEach((error: any) => {
          errorSheetData.push([
            studentIndex + 1,
            `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-',
            student.sheetName || '-',
            error.columnHeader || '-',
            error.value !== null && error.value !== undefined && error.value !== '' ? error.value : '-',
            error.error || '-'
          ]);
        });
      });

      const errorsWs = XLSX.utils.aoa_to_sheet(errorSheetData);
      XLSX.utils.book_append_sheet(wb, errorsWs, 'GradeErrors');
    }

    // Process each sheet (الصفحات الأصلية مع الدرجات الملوّنة)
    if (this.processedSheetsData && this.processedSheetsData.length > 0) {
      // If we have multiple sheets, create a sheet for each
      this.processedSheetsData.forEach((sheetInfo, sheetIndex) => {
        const sheetData = sheetInfo.data;
        if (!sheetData || sheetData.length === 0) return;

        // Get all unique column headers from this sheet's data
        const allColumnHeaders = new Set<string>();
        
        // Collect all grade column headers
        sheetData.forEach((row: any) => {
          if (row.gradeColumns) {
            row.gradeColumns.forEach((col: any) => {
              if (col.header && !allColumnHeaders.has(String(col.header))) {
                allColumnHeaders.add(String(col.header));
              }
            });
          }
        });

        // Build headers array
        const headers: any[] = ['#', 'رقم الهوية', 'الاسم', 'اللقب'];
        
        // Add grade column headers (these are the ONLY columns where we apply coloring)
        // Map numeric headers to translated names based on selected language
        const mapHeaderToTranslated = (header: string): string => {
          const headerStr = String(header).trim();
          const lang = this.selectedLanguage || 'AR';
          
          if (headerStr === '01' || headerStr === '1') {
            if (lang === 'FR') return 'Évaluation continue';
            if (lang === 'EN') return 'Continuous Assessment';
            return 'التقييم المستمر';
          } else if (headerStr === '02' || headerStr === '2') {
            if (lang === 'FR') return 'Travaux pratiques ou Expression orale';
            if (lang === 'EN') return 'Practical Work or Oral Expression';
            return 'أعمال تطبيقية أو تعبير شفوي';
          } else if (headerStr === '03' || headerStr === '3') {
            if (lang === 'FR') return 'Moyenne des devoirs';
            if (lang === 'EN') return 'Assignment Average';
            return 'معدل الفروض';
          } else if (headerStr === '09' || headerStr === '9') {
            if (lang === 'FR') return 'Examen';
            if (lang === 'EN') return 'Test';
            return 'الاختبار';
          }
          return headerStr; // Return original if no mapping found
        };
        
        const gradeHeaders = Array.from(allColumnHeaders).map(mapHeaderToTranslated);
        headers.push(...gradeHeaders);
        
        // Add calculated columns
        headers.push(
          this.translate('gradebook.termAverage'),
          this.translate('gradebook.notes'),
          this.translate('gradebook.guidanceCons')
        );
        
        const excelData: any[] = [headers];

        // Data rows
        sheetData.forEach((row: any, index: number) => {
          const rowData: any[] = [
            index + 1,
            row.id || '-',
            row.firstName || '-',
            row.lastName || '-'
          ];

          // Add grade values in the same order as headers
          // Need to map back from translated headers to original headers for lookup
          const mapTranslatedToOriginal = (translatedHeader: string): string => {
            const lang = this.selectedLanguage || 'AR';
            // Check all language variations
            if (translatedHeader === 'التقييم المستمر' || translatedHeader === 'Évaluation continue' || translatedHeader === 'Continuous Assessment') {
              return '01';
            }
            if (translatedHeader === 'أعمال تطبيقية أو تعبير شفوي' || translatedHeader === 'Travaux pratiques ou Expression orale' || translatedHeader === 'Practical Work or Oral Expression') {
              return '02';
            }
            if (translatedHeader === 'معدل الفروض' || translatedHeader === 'Moyenne des devoirs' || translatedHeader === 'Assignment Average') {
              return '03';
            }
            if (translatedHeader === 'الاختبار' || translatedHeader === 'Examen' || translatedHeader === 'Test') {
              return '09';
            }
            return translatedHeader; // Return original if no mapping found
          };
          
          gradeHeaders.forEach(translatedHeader => {
            const originalHeader = mapTranslatedToOriginal(translatedHeader);
            const gradeCol = row.gradeColumns?.find((col: any) => {
              const colHeader = String(col.header).trim();
              return colHeader === originalHeader || colHeader === translatedHeader;
            });
            const value = gradeCol?.value;
            if (value !== undefined && value !== null && value !== '') {
              const numValue = parseFloat(String(value));
              rowData.push(isNaN(numValue) ? value : numValue);
            } else {
              rowData.push('-');
            }
          });

          // Add calculated values
          rowData.push(
            row.average?.toFixed(2) || '-',
            row.observation || '-',
            row.guidance || '-'
          );

          excelData.push(rowData);
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Apply color coding ONLY to grade columns (not name / id / obs / cons)
        const firstGradeColIndex = 4; // 0:#,1:id,2:firstName,3:lastName,4:first grade column
        const lastGradeColIndex = firstGradeColIndex + gradeHeaders.length - 1;

        // Helper to convert column index (0-based) to Excel column letter (A, B, ..., AA, AB, ...)
        const getColLetter = (colIndex: number): string => {
          let dividend = colIndex + 1;
          let colLetter = '';
          while (dividend > 0) {
            const modulo = (dividend - 1) % 26;
            colLetter = String.fromCharCode(65 + modulo) + colLetter;
            dividend = Math.floor((dividend - modulo) / 26);
          }
          return colLetter;
        };

        // Rows: 0 = header, so start from 1
        for (let rowIndex = 1; rowIndex < excelData.length; rowIndex++) {
          for (let colIndex = firstGradeColIndex; colIndex <= lastGradeColIndex; colIndex++) {
            const cellAddress = `${getColLetter(colIndex)}${rowIndex + 1}`;
            const cell = ws[cellAddress];
            if (!cell) continue;

            const rawValue = cell.v;
            const strValue = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';
            const numValue = parseFloat(strValue);

            // Skip empty cells
            if (strValue === '' || strValue === '-') {
              continue;
            }

            // Determine color:
            // - Green: numeric between 0.25 and 20
            // - Orange: contains "غ م" OR exactly 0
            // - Red: everything else
            let fgColor = 'FFC7CE'; // default red

            if (!isNaN(numValue) && numValue >= 0.25 && numValue <= 20) {
              fgColor = 'C6EFCE'; // green
            } else if (strValue.includes('غ م') || (!isNaN(numValue) && numValue === 0)) {
              fgColor = 'FFEB9C'; // orange
            }

            cell.s = {
              ...(cell.s || {}),
              fill: {
                ...(cell.s?.fill || {}),
                fgColor: { rgb: fgColor }
              }
            };
          }
        }
        
        // Clean sheet name (Excel sheet names have limitations)
        let cleanSheetName = sheetInfo.sheetName || `Sheet${sheetIndex + 1}`;
        cleanSheetName = cleanSheetName.substring(0, 31); // Excel sheet name max length
        cleanSheetName = cleanSheetName.replace(/[\\\/\?\*\[\]]/g, '_'); // Remove invalid characters
        
        XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
      });
    } else {
      // Fallback: create a single sheet with all data
      const allColumnHeaders = new Set<string>();
      
      this.processedExcelData.forEach(row => {
        if (row.gradeColumns) {
          row.gradeColumns.forEach((col: any) => {
            if (col.header && !allColumnHeaders.has(String(col.header))) {
              allColumnHeaders.add(String(col.header));
            }
          });
        }
      });

      const headers: any[] = ['#', 'رقم الهوية', 'الاسم', 'اللقب'];
      
      // Map numeric headers to translated names based on selected language
      const mapHeaderToTranslated = (header: string): string => {
        const headerStr = String(header).trim();
        const lang = this.selectedLanguage || 'AR';
        
        if (headerStr === '01' || headerStr === '1') {
          if (lang === 'FR') return 'Évaluation continue';
          if (lang === 'EN') return 'Continuous Assessment';
          return 'التقييم المستمر';
        } else if (headerStr === '02' || headerStr === '2') {
          if (lang === 'FR') return 'Travaux pratiques ou Expression orale';
          if (lang === 'EN') return 'Practical Work or Oral Expression';
          return 'أعمال تطبيقية أو تعبير شفوي';
        } else if (headerStr === '03' || headerStr === '3') {
          if (lang === 'FR') return 'Moyenne des devoirs';
          if (lang === 'EN') return 'Assignment Average';
          return 'معدل الفروض';
        } else if (headerStr === '09' || headerStr === '9') {
          if (lang === 'FR') return 'Examen';
          if (lang === 'EN') return 'Test';
          return 'الاختبار';
        }
        return headerStr; // Return original if no mapping found
      };
      
      const gradeHeaders = Array.from(allColumnHeaders).map(mapHeaderToTranslated);
      headers.push(...gradeHeaders);
      headers.push(
        this.translate('gradebook.termAverage'),
        this.translate('gradebook.notes'),
        this.translate('gradebook.guidanceCons')
      );
      
      const excelData: any[] = [headers];

      this.processedExcelData.forEach((row, index) => {
        const rowData: any[] = [
          index + 1,
          row.id || '-',
          row.firstName || '-',
          row.lastName || '-'
        ];

        // Need to map back from translated headers to original headers for lookup
        const mapTranslatedToOriginal = (translatedHeader: string): string => {
          // Check all language variations
          if (translatedHeader === 'التقييم المستمر' || translatedHeader === 'Évaluation continue' || translatedHeader === 'Continuous Assessment') {
            return '01';
          }
          if (translatedHeader === 'أعمال تطبيقية أو تعبير شفوي' || translatedHeader === 'Travaux pratiques ou Expression orale' || translatedHeader === 'Practical Work or Oral Expression') {
            return '02';
          }
          if (translatedHeader === 'معدل الفروض' || translatedHeader === 'Moyenne des devoirs' || translatedHeader === 'Assignment Average') {
            return '03';
          }
          if (translatedHeader === 'الاختبار' || translatedHeader === 'Examen' || translatedHeader === 'Test') {
            return '09';
          }
          return translatedHeader; // Return original if no mapping found
        };
        
        gradeHeaders.forEach(translatedHeader => {
          const originalHeader = mapTranslatedToOriginal(translatedHeader);
          const gradeCol = row.gradeColumns?.find((col: any) => {
            const colHeader = String(col.header).trim();
            return colHeader === originalHeader || colHeader === translatedHeader;
          });
          const value = gradeCol?.value;
          if (value !== undefined && value !== null && value !== '') {
            const numValue = parseFloat(String(value));
            rowData.push(isNaN(numValue) ? value : numValue);
          } else {
            rowData.push('-');
          }
        });

        rowData.push(
          row.average?.toFixed(2) || '-',
          row.observation || '-',
          row.guidance || '-'
        );

        excelData.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Apply color coding ONLY to grade columns (not name / id / obs / cons)
      const firstGradeColIndex = 4; // 0:#,1:id,2:firstName,3:lastName,4:first grade column
      const lastGradeColIndex = firstGradeColIndex + gradeHeaders.length - 1;

      const getColLetter = (colIndex: number): string => {
        let dividend = colIndex + 1;
        let colLetter = '';
        while (dividend > 0) {
          const modulo = (dividend - 1) % 26;
          colLetter = String.fromCharCode(65 + modulo) + colLetter;
          dividend = Math.floor((dividend - modulo) / 26);
        }
        return colLetter;
      };

      for (let rowIndex = 1; rowIndex < excelData.length; rowIndex++) {
        for (let colIndex = firstGradeColIndex; colIndex <= lastGradeColIndex; colIndex++) {
          const cellAddress = `${getColLetter(colIndex)}${rowIndex + 1}`;
          const cell = ws[cellAddress];
          if (!cell) continue;

          const rawValue = cell.v;
          const strValue = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';
          const numValue = parseFloat(strValue);

          if (strValue === '' || strValue === '-') {
            continue;
          }

          let fgColor = 'FFC7CE'; // red by default

          if (!isNaN(numValue) && numValue >= 0.25 && numValue <= 20) {
            fgColor = 'C6EFCE'; // green
          } else if (strValue.includes('غ م') || (!isNaN(numValue) && numValue === 0)) {
            fgColor = 'FFEB9C'; // orange
          }

          cell.s = {
            ...(cell.s || {}),
            fill: {
              ...(cell.s?.fill || {}),
              fgColor: { rgb: fgColor }
            }
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, ws, 'النتائج المعالجة');
    }

    // Generate filename
    const levelNames: { [key: string]: string } = {
      'primary': 'ابتدائي',
      'middle': 'متوسط',
      'secondary': 'ثانوي'
    };
    const levelName = levelNames[this.selectedLevel] || 'غير محدد';
    const fileName = `النتائج_المعالجة_${levelName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  }

  // Excel Analysis Functions
  onExcelAnalysisTabClick(): void {
    this.viewMode = 'excelAnalysis';
    // Update charts when switching to analysis tab
    setTimeout(() => {
      this.updateExcelAnalysisCharts();
      this.cdr.detectChanges();
    }, 100);
  }

  ngAfterViewInit(): void {
    // Charts will be initialized when needed
  }

  calculateSheetAverage(data: any[]): number {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, row) => acc + (row.average || 0), 0);
    return sum / data.length;
  }

  getStudentsAbove10Count(data: any[]): number {
    if (!data) return 0;
    return data.filter(row => (row.average || 0) >= 10).length;
  }

  getStudentsBelow10Count(data: any[]): number {
    if (!data) return 0;
    return data.filter(row => (row.average || 0) > 0 && (row.average || 0) < 10).length;
  }

  getGradeStatisticsForSheet(data: any[]): GradeStatistics {
    const stats: GradeStatistics = {
      lessThan4: 0,
      between4and6: 0,
      between6and8: 0,
      between8and10: 0,
      between10and12: 0,
      between12and14: 0,
      between14and16: 0,
      greaterThan16: 0,
      total: data.length
    };

    data.forEach(row => {
      const average = row.average || 0;
      if (average < 4) stats.lessThan4++;
      else if (average < 6) stats.between4and6++;
      else if (average < 8) stats.between6and8++;
      else if (average < 10) stats.between8and10++;
      else if (average < 12) stats.between10and12++;
      else if (average < 14) stats.between12and14++;
      else if (average < 16) stats.between14and16++;
      else stats.greaterThan16++;
    });

    return stats;
  }

  getGradeRangeDistributionForSheet(data: any[]): GradeRangeDistribution {
    const dist: GradeRangeDistribution = {
      congratulations: 0, // >16
      encouragement: 0, // 14-16
      honorRoll: 0, // 12-14
      none: 0, // 10-12
      remarks: 0 // <10
    };

    data.forEach(row => {
      const average = row.average || 0;
      if (average > 16) dist.congratulations++;
      else if (average >= 14) dist.encouragement++;
      else if (average >= 12) dist.honorRoll++;
      else if (average >= 10) dist.none++;
      else dist.remarks++;
    });

    return dist;
  }

  // Get color class for grade cell based on value
  getGradeCellColor(value: any): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    const valueStr = String(value).trim();
    
    // Check if it contains "غ م" (Arabic for "not available")
    if (valueStr.includes('غ م') || valueStr.toLowerCase().includes('n/a') || valueStr.toLowerCase().includes('na')) {
      return 'bg-orange-200 text-orange-800';
    }

    // Try to parse as number
    const numValue = parseFloat(valueStr);
    
    if (isNaN(numValue)) {
      // Not a number and not "غ م" - red
      return 'bg-red-200 text-red-800';
    }

    // Check if value is 0
    if (numValue === 0) {
      return 'bg-orange-200 text-orange-800';
    }

    // Check if value is between 0.25 and 20 - GREEN
    if (numValue >= 0.25 && numValue <= 20) {
      return 'bg-green-200 text-green-800';
    }

    // Otherwise - red
    return 'bg-red-200 text-red-800';
  }

  // Get background color style for grade cell
  getGradeCellBgColor(value: any): string {
    const colorClass = this.getGradeCellColor(value);
    if (colorClass.includes('green')) return '#dcfce7'; // green-200
    if (colorClass.includes('orange')) return '#fed7aa'; // orange-200
    if (colorClass.includes('red')) return '#fee2e2'; // red-200
    return '';
  }

  // Get text color style for grade cell
  getGradeCellTextColor(value: any): string {
    const colorClass = this.getGradeCellColor(value);
    if (colorClass.includes('green')) return '#166534'; // green-800
    if (colorClass.includes('orange')) return '#9a3412'; // orange-800
    if (colorClass.includes('red')) return '#991b1b'; // red-800
    return '';
  }

  // Get all unique grade column headers from processed data
  getAllGradeColumnHeaders(): string[] {
    if (!this.processedExcelData || this.processedExcelData.length === 0) {
      return [];
    }

    const headersSet = new Set<string>();
    
    this.processedExcelData.forEach((row: any) => {
      if (row.gradeColumns && Array.isArray(row.gradeColumns)) {
        row.gradeColumns.forEach((col: any) => {
          if (col.header) {
            headersSet.add(String(col.header));
          }
        });
      }
    });

    // Map numeric headers to translated names for display based on selected language
    const mapHeaderToTranslated = (header: string): string => {
      const headerStr = String(header).trim();
      const lang = this.selectedLanguage || 'AR';
      
      if (headerStr === '01' || headerStr === '1') {
        if (lang === 'FR') return 'Évaluation continue';
        if (lang === 'EN') return 'Continuous Assessment';
        return 'التقييم المستمر';
      } else if (headerStr === '02' || headerStr === '2') {
        if (lang === 'FR') return 'Travaux pratiques ou Expression orale';
        if (lang === 'EN') return 'Practical Work or Oral Expression';
        return 'أعمال تطبيقية أو تعبير شفوي';
      } else if (headerStr === '03' || headerStr === '3') {
        if (lang === 'FR') return 'Moyenne des devoirs';
        if (lang === 'EN') return 'Assignment Average';
        return 'معدل الفروض';
      } else if (headerStr === '09' || headerStr === '9') {
        if (lang === 'FR') return 'Examen';
        if (lang === 'EN') return 'Test';
        return 'الاختبار';
      }
      return headerStr; // Return original if no mapping found
    };

    return Array.from(headersSet).map(mapHeaderToTranslated);
  }

  // Get grade value for a specific column header in a row
  getGradeValueForColumn(row: any, columnHeader: string): any {
    if (!row.gradeColumns || !Array.isArray(row.gradeColumns)) {
      return null;
    }

    // Map translated header back to original numeric header for lookup
    const mapTranslatedToOriginal = (translatedHeader: string): string => {
      // Check all language variations
      if (translatedHeader === 'التقييم المستمر' || translatedHeader === 'Évaluation continue' || translatedHeader === 'Continuous Assessment') {
        return '01';
      }
      if (translatedHeader === 'أعمال تطبيقية أو تعبير شفوي' || translatedHeader === 'Travaux pratiques ou Expression orale' || translatedHeader === 'Practical Work or Oral Expression') {
        return '02';
      }
      if (translatedHeader === 'معدل الفروض' || translatedHeader === 'Moyenne des devoirs' || translatedHeader === 'Assignment Average') {
        return '03';
      }
      if (translatedHeader === 'الاختبار' || translatedHeader === 'Examen' || translatedHeader === 'Test') {
        return '09';
      }
      return translatedHeader; // Return original if no mapping found
    };

    const originalHeader = mapTranslatedToOriginal(columnHeader);
    
    // Try to find by original header first, then by translated header, and also try numeric variations
    let gradeCol = row.gradeColumns.find((col: any) => {
      const colHeader = String(col.header).trim();
      // Try exact match with original header
      if (colHeader === originalHeader) return true;
      // Try exact match with translated header
      if (colHeader === columnHeader) return true;
      // Try numeric variations (01, 1, 02, 2, etc.)
      if ((originalHeader === '01' && (colHeader === '1' || colHeader === '01')) ||
          (originalHeader === '02' && (colHeader === '2' || colHeader === '02')) ||
          (originalHeader === '03' && (colHeader === '3' || colHeader === '03')) ||
          (originalHeader === '09' && (colHeader === '9' || colHeader === '09'))) {
        return true;
      }
      return false;
    });
    
    return gradeCol?.value;
  }

  // Check if a grade value is valid (between 0 and 20, or "غ م")
  isValidGrade(value: any): boolean {
    if (value === undefined || value === null || value === '') {
      return false; // Empty is considered invalid
    }

    const valueStr = String(value).trim();
    
    // Check if it contains "غ م" (Arabic for "not available") - this is valid
    if (valueStr.includes('غ م') || valueStr.toLowerCase().includes('n/a') || valueStr.toLowerCase().includes('na')) {
      return true;
    }

    // Try to parse as number
    const numValue = parseFloat(valueStr);
    
    if (isNaN(numValue)) {
      // Not a number and not "غ م" - invalid
      return false;
    }

    // Valid if between 0 and 20 (inclusive)
    return numValue >= 0 && numValue <= 20;
  }

  // Get error description for invalid grade
  getGradeError(value: any): string {
    if (value === undefined || value === null || value === '') {
      return 'فراغ';
    }

    const valueStr = String(value).trim();
    const numValue = parseFloat(valueStr);
    
    if (isNaN(numValue)) {
      return `قيمة غير صحيحة: "${valueStr}"`;
    }

    if (numValue < 0) {
      return `قيمة سالبة: ${numValue}`;
    }

    if (numValue > 20) {
      return `قيمة أكبر من 20: ${numValue}`;
    }

    return '';
  }

  // Get all students with grade errors
  getStudentsWithGradeErrors(): any[] {
    // أولاً: حاول من البيانات المؤقتة (processedExcelData) إذا كانت متوفرة
    if (this.processedExcelData && this.processedExcelData.length > 0) {
      const errors: any[] = [];
      const gradeHeaders = this.getAllGradeColumnHeaders();

      this.processedExcelData.forEach((row: any) => {
        const studentErrors: any[] = [];

        gradeHeaders.forEach(header => {
          const value = this.getGradeValueForColumn(row, header);
          
          if (!this.isValidGrade(value)) {
            studentErrors.push({
              columnHeader: header,
              value: value,
              error: this.getGradeError(value)
            });
          }
        });

        if (studentErrors.length > 0) {
          errors.push({
            firstName: row.firstName || '-',
            lastName: row.lastName || '-',
            sheetName: row.sheetName || '-',
            errors: studentErrors
          });
        }
      });

      return errors;
    }

    // ثانياً: إذا لم تكن البيانات المؤقتة متوفرة، استخدم البيانات المحفوظة في قاعدة البيانات
    return this.getStudentsWithGradeErrorsFromDatabase();
  }

  // Get all students with grade errors from database
  getStudentsWithGradeErrorsFromDatabase(): any[] {
    console.log('=== getStudentsWithGradeErrorsFromDatabase ===');
    console.log('Students:', this.students?.length);
    console.log('Assessments:', this.assessments?.length);
    console.log('Grades:', this.grades?.length);
    console.log('Selected Term:', this.selectedTerm);

    if (!this.students || this.students.length === 0 || !this.assessments || this.assessments.length === 0) {
      console.log('No students or assessments found');
      return [];
    }

    const errors: any[] = [];

    this.students.forEach(student => {
      const studentErrors: any[] = [];

      // فحص جميع أنواع التقييمات
      this.assessments.forEach(assessment => {
        // البحث عن الدرجة المحفوظة لهذا التلميذ وهذا التقييم
        const grade = this.grades.find(g => 
          g.studentId === student.id && 
          g.assessmentId === assessment.id &&
          g.term === this.selectedTerm
        );

        if (grade) {
          const value = grade.score;
          const isValid = this.isValidGrade(value);
          
          console.log(`Student: ${student.firstName} ${student.lastName}, Assessment: ${assessment.nameAr}, Score: ${value}, Valid: ${isValid}`);
          
          // التحقق من صحة الدرجة
          if (!isValid) {
            const errorMsg = this.getGradeError(value);
            console.log(`  -> ERROR: ${errorMsg}`);
            studentErrors.push({
              columnHeader: this.getAssessmentDisplayName(assessment),
              value: value,
              error: errorMsg
            });
          }
        }
      });

      // إضافة التلميذ إلى قائمة الأخطاء إذا كانت لديه أخطاء
      if (studentErrors.length > 0) {
        console.log(`Adding student ${student.firstName} ${student.lastName} with ${studentErrors.length} errors`);
        errors.push({
          firstName: student.firstName || '-',
          lastName: student.lastName || '-',
          sheetName: this.selectedClass?.name || '-',
          errors: studentErrors
        });
      }
    });

    console.log('Total students with errors:', errors.length);
    return errors;
  }

  // Get display name for assessment
  getAssessmentDisplayName(assessment: Assessment): string {
    // استخدم الاسم العربي أولاً، ثم الاسم الافتراضي
    return assessment.nameAr || assessment.name;
  }

  // Open grade monitoring modal
  openGradeMonitoringModal(): void {
    // احسب الأخطاء مرة واحدة وخزنها في متغيّر حتى تُستعمل في الجدول و الـ PDF
    this.gradeMonitoringErrors = this.getStudentsWithGradeErrors();
    console.log('Grade Monitoring Errors:', this.gradeMonitoringErrors);
    console.log('Total errors:', this.gradeMonitoringErrors.length);
    console.log('Students:', this.students.length);
    console.log('Assessments:', this.assessments.length);
    console.log('Grades:', this.grades.length);
    console.log('ProcessedExcelData:', this.processedExcelData.length);
    this.showGradeMonitoringModal = true;
  }

  // Close grade monitoring modal
  closeGradeMonitoringModal(): void {
    this.showGradeMonitoringModal = false;
  }

  // Print grade monitoring report
  printGradeMonitoringReport(): void {
    window.print();
  }

  // Get formatted report date
  getReportDate(): string {
    return new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' });
  }

  // Export grade monitoring report to PDF
  async exportGradeMonitoringPDF(): Promise<void> {
    const errors = this.gradeMonitoringErrors && this.gradeMonitoringErrors.length > 0
      ? this.gradeMonitoringErrors
      : this.getStudentsWithGradeErrors();

    if (errors.length === 0) {
      alert('لا توجد أخطاء في النقاط. جميع النقاط صحيحة!');
      return;
    }

    try {
      const reportElement = document.getElementById('gradeMonitoringReport');

      if (!reportElement) {
        console.error('Grade monitoring report element not found');
        alert('تعذر العثور على محتوى التقرير في الصفحة');
        return;
      }

      // استخدم html2canvas لالتقاط نفس محتوى التقرير الظاهر على الشاشة مع دعم العربية بالكامل
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: reportElement.offsetWidth,
        height: reportElement.scrollHeight,
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/png');

      let remainingHeight = imgHeight;
      let yOffset = margin;

      while (remainingHeight > 0) {
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yOffset,
          imgWidth,
          imgHeight
        );

        remainingHeight -= (pageHeight - 2 * margin);
        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset = margin;
        }
      }

      const fileName = `تقرير_مراقبة_النقاط_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      alert(`تم تصدير التقرير بنجاح! تم العثور على ${errors.length} تلميذ لديهم أخطاء في النقاط.`);
    } catch (error) {
      console.error('Error exporting grade monitoring PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    }
  }

  updateExcelAnalysisCharts(): void {
    if (!this.processedSheetsData || this.processedSheetsData.length === 0) return;

    this.processedSheetsData.forEach((sheetInfo, sheetIndex) => {
      // Destroy existing charts if they exist
      const gradeDistChartId = `gradeDistChart_${sheetIndex}`;
      const gradeRangeChartId = `gradeRangeChart_${sheetIndex}`;
      
      // Get chart instances and destroy them
      const gradeDistCanvas = document.getElementById(gradeDistChartId) as HTMLCanvasElement;
      const gradeRangeCanvas = document.getElementById(gradeRangeChartId) as HTMLCanvasElement;

      if (gradeDistCanvas) {
        const existingChart = Chart.getChart(gradeDistCanvas);
        if (existingChart) {
          existingChart.destroy();
        }
      }

      if (gradeRangeCanvas) {
        const existingChart = Chart.getChart(gradeRangeCanvas);
        if (existingChart) {
          existingChart.destroy();
        }
      }

      // Get statistics
      const stats = this.getGradeStatisticsForSheet(sheetInfo.data);
      const rangeDist = this.getGradeRangeDistributionForSheet(sheetInfo.data);

      // Create Grade Distribution Chart
      if (gradeDistCanvas) {
        new Chart(gradeDistCanvas, {
          type: 'bar',
          data: {
            labels: ['<4', '4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '>16'],
            datasets: [{
              label: 'عدد التلاميذ',
              data: [
                stats.lessThan4,
                stats.between4and6,
                stats.between6and8,
                stats.between8and10,
                stats.between10and12,
                stats.between12and14,
                stats.between14and16,
                stats.greaterThan16
              ],
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }

      // Create Grade Range Distribution Chart
      if (gradeRangeCanvas) {
        new Chart(gradeRangeCanvas, {
          type: 'pie',
          data: {
            labels: ['تهنئة (>16)', 'تشجيع (14-16)', 'قائمة الشرف (12-14)', 'عادي (10-12)', 'ملاحظات (<10)'],
            datasets: [{
              data: [
                rangeDist.congratulations,
                rangeDist.encouragement,
                rangeDist.honorRoll,
                rangeDist.none,
                rangeDist.remarks
              ],
              backgroundColor: [
                'rgba(34, 197, 94, 0.7)',
                'rgba(59, 130, 246, 0.7)',
                'rgba(147, 51, 234, 0.7)',
                'rgba(107, 114, 128, 0.7)',
                'rgba(239, 68, 68, 0.7)'
              ],
              borderColor: [
                'rgba(34, 197, 94, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(147, 51, 234, 1)',
                'rgba(107, 114, 128, 1)',
                'rgba(239, 68, 68, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            }
          }
        });
      }
    });
  }

  async exportExcelAnalysisToPDF(): Promise<void> {
    if (!this.processedSheetsData || this.processedSheetsData.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    try {
      // Create a temporary container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '210mm'; // A4 width
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'تحليل بيانات Excel';
      title.style.textAlign = 'center';
      title.style.fontSize = '28px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '30px';
      title.style.color = '#111827';
      exportContainer.appendChild(title);

      // Process each sheet
      for (let sheetIndex = 0; sheetIndex < this.processedSheetsData.length; sheetIndex++) {
        const sheetInfo = this.processedSheetsData[sheetIndex];
        
        // Add sheet title
        const sheetTitle = document.createElement('h2');
        sheetTitle.textContent = `الصفحة: ${sheetInfo.sheetName}`;
        sheetTitle.style.fontSize = '22px';
        sheetTitle.style.fontWeight = 'bold';
        sheetTitle.style.marginTop = '30px';
        sheetTitle.style.marginBottom = '20px';
        sheetTitle.style.color = '#1f2937';
        sheetTitle.style.borderBottom = '2px solid #3b82f6';
        sheetTitle.style.paddingBottom = '10px';
        exportContainer.appendChild(sheetTitle);

        // Add statistics
        const statsDiv = document.createElement('div');
        statsDiv.style.display = 'grid';
        statsDiv.style.gridTemplateColumns = 'repeat(4, 1fr)';
        statsDiv.style.gap = '15px';
        statsDiv.style.marginBottom = '20px';

        const avg = this.calculateSheetAverage(sheetInfo.data);
        const above10 = this.getStudentsAbove10Count(sheetInfo.data);
        const below10 = this.getStudentsBelow10Count(sheetInfo.data);
        const total = sheetInfo.data.length;

        const stats = [
          { label: 'معدل الصفحة', value: avg.toFixed(2), color: '#3b82f6' },
          { label: 'معدل ≥ 10', value: above10.toString(), color: '#10b981' },
          { label: 'معدل < 10', value: below10.toString(), color: '#ef4444' },
          { label: 'إجمالي التلاميذ', value: total.toString(), color: '#8b5cf6' }
        ];

        stats.forEach(stat => {
          const statCard = document.createElement('div');
          statCard.style.backgroundColor = '#f3f4f6';
          statCard.style.padding = '15px';
          statCard.style.borderRadius = '8px';
          statCard.style.textAlign = 'center';
          statCard.style.border = `2px solid ${stat.color}`;
          
          const value = document.createElement('div');
          value.textContent = stat.value;
          value.style.fontSize = '24px';
          value.style.fontWeight = 'bold';
          value.style.color = stat.color;
          value.style.marginBottom = '5px';
          
          const label = document.createElement('div');
          label.textContent = stat.label;
          label.style.fontSize = '12px';
          label.style.color = '#6b7280';
          
          statCard.appendChild(value);
          statCard.appendChild(label);
          statsDiv.appendChild(statCard);
        });

        exportContainer.appendChild(statsDiv);

        // Add charts (we'll use canvas to image conversion)
        const chartsDiv = document.createElement('div');
        chartsDiv.style.display = 'grid';
        chartsDiv.style.gridTemplateColumns = 'repeat(2, 1fr)';
        chartsDiv.style.gap = '20px';
        chartsDiv.style.marginBottom = '30px';

        // Get chart canvases
        const gradeDistCanvas = document.getElementById(`gradeDistChart_${sheetIndex}`) as HTMLCanvasElement;
        const gradeRangeCanvas = document.getElementById(`gradeRangeChart_${sheetIndex}`) as HTMLCanvasElement;

        if (gradeDistCanvas) {
          const chartImg = document.createElement('img');
          chartImg.src = gradeDistCanvas.toDataURL('image/png');
          chartImg.style.width = '100%';
          chartImg.style.height = 'auto';
          chartImg.style.border = '1px solid #e5e7eb';
          chartImg.style.borderRadius = '8px';
          chartsDiv.appendChild(chartImg);
        }

        if (gradeRangeCanvas) {
          const chartImg = document.createElement('img');
          chartImg.src = gradeRangeCanvas.toDataURL('image/png');
          chartImg.style.width = '100%';
          chartImg.style.height = 'auto';
          chartImg.style.border = '1px solid #e5e7eb';
          chartImg.style.borderRadius = '8px';
          chartsDiv.appendChild(chartImg);
        }

        exportContainer.appendChild(chartsDiv);
      }

      document.body.appendChild(exportContainer);

      // Use html2canvas to capture the content
      const canvas = await html2canvas(exportContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.scrollHeight, // Capture full scroll height
        windowWidth: exportContainer.scrollWidth,
        windowHeight: exportContainer.scrollHeight
      });

      // Clean up
      document.body.removeChild(exportContainer);

      // Create PDF (مع دعم حقيقي لتعدد الصفحات بدون قص أسفل المحتوى)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let yOffset = margin;

      const imgData = canvas.toDataURL('image/png');

      // الصفحة الأولى + الصفحات التالية إن لزم
      while (remainingHeight > 0) {
        const renderHeight = Math.min(availableHeight, remainingHeight);

        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yOffset,
          imgWidth,
          imgHeight
        );

        remainingHeight -= availableHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset = margin;
        }
      }

      const fileName = `تحليل_بيانات_Excel_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  }

  // Grading Settings Methods
  onSettingsClassChange(): void {
    if (this.settingsSelectedClass) {
      this.loadGradingSettings(this.settingsSelectedClass.id);
    }
  }

  loadGradingSettings(classId: number): void {
    this.gradingSettingsService.getByClassId(classId).subscribe({
      next: (settings) => {
        if (settings) {
          this.gradingSettings = settings;
        } else {
          // Initialize with defaults
          this.gradingSettings = {
            classId: classId,
            notebookCorrectionMaxScore: 5,
            dutyMaxScore: 5,
            attendanceMaxScore: 5,
            attendanceAutoApply: true,
            behaviorMaxScore: 5,
            behaviorAutoApply: true,
            customAssessmentColumns: [],
            baseColumnSettings: DEFAULT_BASE_COLUMN_SETTINGS.map(column => ({ ...column })),
            includeOralExpression: true,
            autoFillOralExpressionFromSeating: false,
          };
        }
        this.gradingSettings.autoFillOralExpressionFromSeating = this.gradingSettings.autoFillOralExpressionFromSeating ?? false;
        this.gradingSettings.baseColumnSettings = this.normalizeBaseColumnSettings(this.gradingSettings.baseColumnSettings);
        // Initialize default ratings and guidance if not present
        this.initializeDefaultRatingsAndGuidance();
      },
      error: (error) => {
        console.error('Error loading grading settings:', error);
      }
    });
  }

  addCustomColumn(): void {
    if (!this.gradingSettings.customAssessmentColumns) {
      this.gradingSettings.customAssessmentColumns = [];
    }
    const newColumn: CustomAssessmentColumn = {
      id: `custom_${Date.now()}`,
      name: '',
      maxScore: 0,
    };
    this.gradingSettings.customAssessmentColumns.push(newColumn);
    this.validateTotalMaxScore();
  }

  removeCustomColumn(index: number): void {
    if (this.gradingSettings.customAssessmentColumns) {
      this.gradingSettings.customAssessmentColumns.splice(index, 1);
      this.validateTotalMaxScore();
    }
  }

  calculateTotalMaxScore(): number {
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    const baseColumnsTotal = this.baseColumnDefinitions.reduce((sum, def) => {
      if (!this.isBaseColumnVisibleInSettings(def.key)) {
        return sum;
      }
      return sum + safeNumber(this.getMaxForBaseColumn(def.key));
    }, 0);

    const customColumnsTotal = (this.gradingSettings.customAssessmentColumns || []).reduce((sum, col) => {
      return sum + Number(col.maxScore || 0);
    }, 0);

    return baseColumnsTotal + customColumnsTotal;
  }

  validateTotalMaxScore(): void {
    const total = this.calculateTotalMaxScore();
    if (total > 20) {
      // Show warning but don't block
      console.warn(`Total max score (${total}) exceeds 20`);
    }
  }

  saveGradingSettings(): void {
    if (!this.settingsSelectedClass) return;

    const total = this.calculateTotalMaxScore();
    if (total > 20) {
      alert('مجموع النقاط القصوى يجب ألا يتجاوز 20. الرجاء تعديل القيم.');
      return;
    }

    // Helper function to safely convert to number
    const toNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Ensure all numeric values are properly converted to numbers
    const customColumns = (this.gradingSettings.customAssessmentColumns || []).map(col => ({
      ...col,
      maxScore: toNumber(col.maxScore)
    }));

    const settingsToSave: Partial<GradingSettings> = {
      notebookCorrectionMaxScore: toNumber(this.gradingSettings.notebookCorrectionMaxScore),
      dutyMaxScore: toNumber(this.gradingSettings.dutyMaxScore),
      attendanceMaxScore: toNumber(this.gradingSettings.attendanceMaxScore),
      attendanceAutoApply: this.gradingSettings.attendanceAutoApply,
      behaviorMaxScore: toNumber(this.gradingSettings.behaviorMaxScore),
      behaviorAutoApply: this.gradingSettings.behaviorAutoApply,
      customAssessmentColumns: customColumns,
      baseColumnSettings: this.normalizeBaseColumnSettings(this.gradingSettings.baseColumnSettings),
      includeOralExpression: this.gradingSettings.includeOralExpression,
      autoFillOralExpressionFromSeating: this.gradingSettings.autoFillOralExpressionFromSeating ?? false,
      customRatings: this.gradingSettings.customRatings || [],
      customGuidance: this.gradingSettings.customGuidance || [],
    };

    this.gradingSettingsService.update(this.settingsSelectedClass.id, settingsToSave).subscribe({
      next: (savedSettings) => {
        this.gradingSettings = savedSettings;
        
        // If this is the current selected class, reload its settings and recalculate grades
        if (this.selectedClass && this.settingsSelectedClass && this.selectedClass.id === this.settingsSelectedClass.id) {
          this.loadCurrentClassGradingSettings();
        }
        
        alert('تم حفظ الإعدادات بنجاح');
      },
      error: (error) => {
        console.error('Error saving grading settings:', error);
        const errorMessage = error?.error?.message || 
                            (error?.error?.error && Array.isArray(error.error.error) 
                              ? error.error.error.join(', ') 
                              : error.error?.error) ||
                            error?.message || 
                            'حدث خطأ أثناء حفظ الإعدادات';
        alert(errorMessage);
      }
    });
  }

  shouldShowOralExpressionColumn(): boolean {
    // Show column if settings exist and includeOralExpression is true, or if no settings exist (default behavior)
    if (this.currentClassGradingSettings) {
      return this.currentClassGradingSettings.includeOralExpression !== false;
    }
    // Default behavior: show the column
    return true;
  }

  getNotebookCorrectionMaxFromSettings(): number {
    return this.currentClassGradingSettings?.notebookCorrectionMaxScore ?? 5;
  }

  getDutyMaxFromSettings(): number {
    return this.currentClassGradingSettings?.dutyMaxScore ?? 5;
  }

  private getAttendanceMaxFromSettings(): number {
    return this.currentClassGradingSettings?.attendanceMaxScore ?? 5;
  }

  private getBehaviorMaxFromSettings(): number {
    return this.currentClassGradingSettings?.behaviorMaxScore ?? 5;
  }

  private isAttendanceAutoApplyEnabled(): boolean {
    return this.currentClassGradingSettings?.attendanceAutoApply ?? true;
  }

  private isBehaviorAutoApplyEnabled(): boolean {
    return this.currentClassGradingSettings?.behaviorAutoApply ?? true;
  }

  getCustomColumns(): CustomAssessmentColumn[] {
    if (this.currentClassGradingSettings && this.currentClassGradingSettings.customAssessmentColumns) {
      return this.currentClassGradingSettings.customAssessmentColumns;
    }
    return [];
  }

  private normalizeBaseColumnSettings(settings?: BaseColumnConfig[]): BaseColumnConfig[] {
    const normalizedMap = new Map<BaseColumnKey, BaseColumnConfig>();
    (settings || []).forEach(column => {
      normalizedMap.set(column.key, {
        key: column.key,
        label: column.label,
        visible: column.visible ?? true,
      });
    });

    return this.baseColumnDefinitions.map(def => {
      const existing = normalizedMap.get(def.key);
      if (existing) {
        return existing;
      }
      const fallback = DEFAULT_BASE_COLUMN_SETTINGS.find(entry => entry.key === def.key);
      return {
        key: def.key,
        label: fallback?.label,
        visible: fallback?.visible ?? true,
      };
    });
  }

  private getBaseColumnsForCurrentView(): BaseColumnConfig[] {
    return this.normalizeBaseColumnSettings(this.currentClassGradingSettings?.baseColumnSettings);
  }

  private getCurrentBaseColumnConfig(key: BaseColumnKey): BaseColumnConfig {
    return this.getBaseColumnsForCurrentView().find(column => column.key === key) ?? { key, visible: true };
  }

  getSettingsBaseColumn(key: BaseColumnKey): BaseColumnConfig {
    if (!this.gradingSettings.baseColumnSettings) {
      this.gradingSettings.baseColumnSettings = this.normalizeBaseColumnSettings([]);
    }
    this.gradingSettings.baseColumnSettings = this.normalizeBaseColumnSettings(this.gradingSettings.baseColumnSettings);
    let column = this.gradingSettings.baseColumnSettings.find(item => item.key === key);
    if (!column) {
      column = { key, visible: true };
      this.gradingSettings.baseColumnSettings.push(column);
    }
    return column;
  }

  shouldShowBaseColumn(key: BaseColumnKey): boolean {
    return this.getCurrentBaseColumnConfig(key).visible ?? true;
  }

  getBaseColumnLabel(key: BaseColumnKey, translationKey: string): string {
    const config = this.getCurrentBaseColumnConfig(key);
    return config.label?.trim() ? config.label : this.translate(translationKey);
  }

  private isBaseColumnVisibleInSettings(key: BaseColumnKey): boolean {
    const column = this.getSettingsBaseColumn(key);
    return column.visible ?? true;
  }

  getMaxForBaseColumn(key: BaseColumnKey): number {
    switch (key) {
      case 'notebook_correction':
        return this.gradingSettings.notebookCorrectionMaxScore ?? 5;
      case 'duty':
        return this.gradingSettings.dutyMaxScore ?? 5;
      case 'attendance':
        return this.gradingSettings.attendanceMaxScore ?? 5;
      case 'behavior':
        return this.gradingSettings.behaviorMaxScore ?? 5;
      default:
        return 0;
    }
  }

  onBaseColumnMaxChange(key: BaseColumnKey, value: string | number): void {
    const numericValue = Number(value);
    const safeValue = isNaN(numericValue) ? 0 : numericValue;
    switch (key) {
      case 'notebook_correction':
        this.gradingSettings.notebookCorrectionMaxScore = safeValue;
        break;
      case 'duty':
        this.gradingSettings.dutyMaxScore = safeValue;
        break;
      case 'attendance':
        this.gradingSettings.attendanceMaxScore = safeValue;
        break;
      case 'behavior':
        this.gradingSettings.behaviorMaxScore = safeValue;
        break;
    }
    this.validateTotalMaxScore();
  }

  onBaseColumnVisibilityChange(key: BaseColumnKey, visible: boolean): void {
    const column = this.getSettingsBaseColumn(key);
    column.visible = visible;
    
    // عند إخفاء العمود، تعيين النقطة القصوى إلى 0
    if (!visible) {
      switch (key) {
        case 'notebook_correction':
          this.gradingSettings.notebookCorrectionMaxScore = 0;
          break;
        case 'duty':
          this.gradingSettings.dutyMaxScore = 0;
          break;
        case 'attendance':
          this.gradingSettings.attendanceMaxScore = 0;
          break;
        case 'behavior':
          this.gradingSettings.behaviorMaxScore = 0;
          break;
      }
      this.validateTotalMaxScore();
      this.cdr.detectChanges();
    }
  }

  getAutoApplyValue(key: BaseColumnKey): boolean {
    if (key === 'attendance') {
      return this.gradingSettings.attendanceAutoApply;
    } else if (key === 'behavior') {
      return this.gradingSettings.behaviorAutoApply;
    }
    return false;
  }

  setAutoApplyValue(key: BaseColumnKey, value: boolean): void {
    if (key === 'attendance') {
      this.gradingSettings.attendanceAutoApply = value;
    } else if (key === 'behavior') {
      this.gradingSettings.behaviorAutoApply = value;
    }
  }

  isAttendanceManual(): boolean {
    return !this.gradingSettings.attendanceAutoApply;
  }

  isBehaviorManual(): boolean {
    return !this.gradingSettings.behaviorAutoApply;
  }

  getDefaultRatings(): RatingRangeConfig[] {
    return [
      { 
        min: 18, 
        ratings: { 
          AR: 'ممتاز', 
          FR: 'Excellent', 
          EN: 'Excellent',
          ES: 'Excelente',
          IT: 'Eccellente',
          DE: 'Ausgezeichnet',
          TR: 'Mükemmel'
        } 
      },
      { 
        min: 16, 
        max: 18, 
        ratings: { 
          AR: 'عمل جيد جدا', 
          FR: 'Très bon travail', 
          EN: 'Very good work',
          ES: 'Muy buen trabajo',
          IT: 'Ottimo lavoro',
          DE: 'Sehr gute Arbeit',
          TR: 'Çok iyi iş'
        } 
      },
      { 
        min: 14, 
        max: 16, 
        ratings: { 
          AR: 'عمل جيد', 
          FR: 'Bon travail', 
          EN: 'Good work',
          ES: 'Buen trabajo',
          IT: 'Buon lavoro',
          DE: 'Gute Arbeit',
          TR: 'İyi iş'
        } 
      },
      { 
        min: 12, 
        max: 14, 
        ratings: { 
          AR: 'عمل حسن', 
          FR: 'Travail correct', 
          EN: 'Fair work',
          ES: 'Trabajo aceptable',
          IT: 'Lavoro discreto',
          DE: 'Angemessene Arbeit',
          TR: 'Kabul edilebilir iş'
        } 
      },
      { 
        min: 10, 
        max: 12, 
        ratings: { 
          AR: 'عمل متوسط', 
          FR: 'Travail moyen', 
          EN: 'Average work',
          ES: 'Trabajo promedio',
          IT: 'Lavoro medio',
          DE: 'Durchschnittliche Arbeit',
          TR: 'Orta iş'
        } 
      },
      { 
        min: 8, 
        max: 10, 
        ratings: { 
          AR: 'دون الوسط', 
          FR: 'En dessous de la moyenne', 
          EN: 'Below average',
          ES: 'Por debajo del promedio',
          IT: 'Sotto la media',
          DE: 'Unter dem Durchschnitt',
          TR: 'Ortalamanın altında'
        } 
      },
      { 
        min: 4, 
        max: 8, 
        ratings: { 
          AR: 'عمل ناقص', 
          FR: 'Travail insuffisant', 
          EN: 'Insufficient work',
          ES: 'Trabajo insuficiente',
          IT: 'Lavoro insufficiente',
          DE: 'Unzureichende Arbeit',
          TR: 'Yetersiz iş'
        } 
      },
      { 
        min: 0, 
        max: 4, 
        ratings: { 
          AR: 'عمل ناقص جدا', 
          FR: 'Travail très insuffisant', 
          EN: 'Very insufficient work',
          ES: 'Trabajo muy insuficiente',
          IT: 'Lavoro molto insufficiente',
          DE: 'Sehr unzureichende Arbeit',
          TR: 'Çok yetersiz iş'
        } 
      },
    ];
  }

  getDefaultGuidance(): GuidanceRangeConfig[] {
    return [
      { 
        min: 18, 
        guidance: { 
          AR: 'تلميذ نجيب يتمتع بقدرات عالية وجدية متميزة، أتمنى لك التوفيق', 
          FR: 'Élève assidu avec des capacités élevées et un sérieux remarquable, je vous souhaite succès',
          EN: 'Diligent student with high abilities and remarkable seriousness, I wish you success',
          ES: 'Estudiante diligente con altas capacidades y seriedad notable, te deseo éxito',
          IT: 'Studente diligente con elevate capacità e serietà notevole, ti auguro successo',
          DE: 'Fleißiger Schüler mit hohen Fähigkeiten und bemerkenswerter Ernsthaftigkeit, ich wünsche dir Erfolg',
          TR: 'Yüksek yeteneklere ve dikkat çekici ciddiyete sahip çalışkan öğrenci, sana başarılar dilerim'
        } 
      },
      { 
        min: 16, 
        max: 18, 
        guidance: { 
          AR: 'عمل يستحق الشكر والتشجيع، واصل', 
          FR: 'Travail méritant des félicitations et des encouragements, continuez',
          EN: 'Work deserving of congratulations and encouragement, continue',
          ES: 'Trabajo que merece felicitaciones y aliento, continúa',
          IT: 'Lavoro che merita congratulazioni e incoraggiamento, continua',
          DE: 'Arbeit, die Glückwünsche und Ermutigung verdient, weiter so',
          TR: 'Tebrikleri ve teşviki hak eden iş, devam et'
        } 
      },
      { 
        min: 14, 
        max: 16, 
        guidance: { 
          AR: 'نتائج مرضية وفي تحسن مستمر، لديك إمكانيات لمواصلة ذلك', 
          FR: 'Résultats satisfaisants et en amélioration continue, vous avez le potentiel de continuer',
          EN: 'Satisfactory results and continuous improvement, you have the potential to continue',
          ES: 'Resultados satisfactorios y mejora continua, tienes el potencial para continuar',
          IT: 'Risultati soddisfacenti e miglioramento continuo, hai il potenziale per continuare',
          DE: 'Zufriedenstellende Ergebnisse und kontinuierliche Verbesserung, du hast das Potenzial weiterzumachen',
          TR: 'Tatmin edici sonuçlar ve sürekli iyileşme, devam etme potansiyelin var'
        } 
      },
      { 
        min: 12, 
        max: 14, 
        guidance: { 
          AR: 'نتائج حسنة، لديك امكانيات لمواصلة ذلك', 
          FR: 'Résultats corrects, vous avez le potentiel de continuer à vous améliorer',
          EN: 'Good results, you have the potential to continue improving',
          ES: 'Buenos resultados, tienes el potencial para seguir mejorando',
          IT: 'Buoni risultati, hai il potenziale per continuare a migliorare',
          DE: 'Gute Ergebnisse, du hast das Potenzial, dich weiter zu verbessern',
          TR: 'İyi sonuçlar, gelişmeye devam etme potansiyelin var'
        } 
      },
      { 
        min: 10, 
        max: 12, 
        guidance: { 
          AR: 'كان بالإمكان أن تكون النتائج أفضل', 
          FR: 'Les résultats auraient pu être meilleurs',
          EN: 'Results could have been better',
          ES: 'Los resultados podrían haber sido mejores',
          IT: 'I risultati avrebbero potuto essere migliori',
          DE: 'Die Ergebnisse hätten besser sein können',
          TR: 'Sonuçlar daha iyi olabilirdi'
        } 
      },
      { 
        min: 8, 
        max: 10, 
        guidance: { 
          AR: 'عليك بمضاعفة مجهوداتك', 
          FR: 'Vous devez multiplier vos efforts',
          EN: 'You need to multiply your efforts',
          ES: 'Necesitas multiplicar tus esfuerzos',
          IT: 'Devi moltiplicare i tuoi sforzi',
          DE: 'Du musst deine Anstrengungen vervielfachen',
          TR: 'Çabalarını çoğaltmalısın'
        } 
      },
      { 
        min: 6, 
        max: 8, 
        guidance: { 
          AR: 'عليك ببذل المزيد من الجهد لتحسين نتائجك', 
          FR: 'Vous devez faire plus d\'efforts pour améliorer vos résultats',
          EN: 'You need to make more effort to improve your results',
          ES: 'Necesitas hacer más esfuerzo para mejorar tus resultados',
          IT: 'Devi fare più sforzo per migliorare i tuoi risultati',
          DE: 'Du musst mehr Anstrengung unternehmen, um deine Ergebnisse zu verbessern',
          TR: 'Sonuçlarını iyileştirmek için daha fazla çaba göstermelisin'
        } 
      },
      { 
        min: 0, 
        max: 6, 
        guidance: { 
          AR: 'عمل ناقص عليك بمضاعفة مجهودك', 
          FR: 'Travail insuffisant, vous devez multiplier vos efforts',
          EN: 'Insufficient work, you need to multiply your efforts',
          ES: 'Trabajo insuficiente, necesitas multiplicar tus esfuerzos',
          IT: 'Lavoro insufficiente, devi moltiplicare i tuoi sforzi',
          DE: 'Unzureichende Arbeit, du musst deine Anstrengungen vervielfachen',
          TR: 'Yetersiz iş, çabalarını çoğaltmalısın'
        } 
      },
    ];
  }

  initializeDefaultRatingsAndGuidance(): void {
    if (!this.gradingSettings.customRatings || this.gradingSettings.customRatings.length === 0) {
      this.gradingSettings.customRatings = this.getDefaultRatings();
    }
    if (!this.gradingSettings.customGuidance || this.gradingSettings.customGuidance.length === 0) {
      this.gradingSettings.customGuidance = this.getDefaultGuidance();
    }
  }

  addRatingRange(): void {
    if (!this.gradingSettings.customRatings) {
      this.gradingSettings.customRatings = [];
    }
    this.gradingSettings.customRatings.push({
      min: 0,
      max: undefined,
      ratings: {}
    });
  }

  removeRatingRange(index: number): void {
    if (this.gradingSettings.customRatings) {
      this.gradingSettings.customRatings.splice(index, 1);
    }
  }

  addGuidanceRange(): void {
    if (!this.gradingSettings.customGuidance) {
      this.gradingSettings.customGuidance = [];
    }
    this.gradingSettings.customGuidance.push({
      min: 0,
      max: undefined,
      guidance: {}
    });
  }

  removeGuidanceRange(index: number): void {
    if (this.gradingSettings.customGuidance) {
      this.gradingSettings.customGuidance.splice(index, 1);
    }
  }

  // Helper functions for managing rating languages
  getRatingLanguageCodes(range: any): string[] {
    if (!range.ratings) {
      range.ratings = {};
      return [''];
    }
    const codes: string[] = [];
    const allCodes = ['AR', 'FR', 'EN', 'ES', 'IT', 'DE', 'TR'];
    allCodes.forEach(code => {
      if (range.ratings[code] !== undefined && range.ratings[code] !== '') {
        codes.push(code);
      }
    });
    // Always add one empty entry for adding new language
    codes.push('');
    return codes;
  }

  addRatingLanguage(range: any): void {
    if (!range.ratings) {
      range.ratings = {};
    }
    // Add empty entry - already handled by getRatingLanguageCodes
  }

  updateRatingLanguageCode(range: any, index: number, newCode: string): void {
    if (!range.ratings) {
      range.ratings = {};
    }
    const codes = this.getRatingLanguageCodes(range);
    const oldCode = codes[index];
    const value = oldCode ? range.ratings[oldCode] : '';
    
    if (oldCode && oldCode !== newCode) {
      delete range.ratings[oldCode];
    }
    if (newCode) {
      range.ratings[newCode] = value || '';
    }
  }

  getRatingValue(range: any, code: string): string {
    if (!range.ratings || !code) {
      return '';
    }
    return range.ratings[code] || '';
  }

  setRatingValue(range: any, code: string, value: string): void {
    if (!range.ratings) {
      range.ratings = {};
    }
    if (code) {
      range.ratings[code] = value;
    }
  }

  removeRatingLanguage(range: any, code: string): void {
    if (range.ratings && code) {
      delete range.ratings[code];
    }
  }

  // Helper functions for managing guidance languages
  getGuidanceLanguageCodes(range: any): string[] {
    if (!range.guidance) {
      range.guidance = {};
      return [''];
    }
    const codes: string[] = [];
    const allCodes = ['AR', 'FR', 'EN', 'ES', 'IT', 'DE', 'TR'];
    allCodes.forEach(code => {
      if (range.guidance[code] !== undefined && range.guidance[code] !== '') {
        codes.push(code);
      }
    });
    // Always add one empty entry for adding new language
    codes.push('');
    return codes;
  }

  addGuidanceLanguage(range: any): void {
    if (!range.guidance) {
      range.guidance = {};
    }
    // Add empty entry - already handled by getGuidanceLanguageCodes
  }

  updateGuidanceLanguageCode(range: any, index: number, newCode: string): void {
    if (!range.guidance) {
      range.guidance = {};
    }
    const codes = this.getGuidanceLanguageCodes(range);
    const oldCode = codes[index];
    const value = oldCode ? range.guidance[oldCode] : '';
    
    if (oldCode && oldCode !== newCode) {
      delete range.guidance[oldCode];
    }
    if (newCode) {
      range.guidance[newCode] = value || '';
    }
  }

  getGuidanceValue(range: any, code: string): string {
    if (!range.guidance || !code) {
      return '';
    }
    return range.guidance[code] || '';
  }

  setGuidanceValue(range: any, code: string, value: string): void {
    if (!range.guidance) {
      range.guidance = {};
    }
    if (code) {
      range.guidance[code] = value;
    }
  }

  removeGuidanceLanguage(range: any, code: string): void {
    if (range.guidance && code) {
      delete range.guidance[code];
    }
  }

  // Apply default ratings for selected language
  applyDefaultRatingsForLanguage(language: string): void {
    if (!language) {
      return;
    }

    const defaultRatings = this.getDefaultRatings();
    
    // Initialize customRatings if empty
    if (!this.gradingSettings.customRatings || this.gradingSettings.customRatings.length === 0) {
      this.gradingSettings.customRatings = defaultRatings.map(r => ({
        min: r.min,
        max: r.max,
        ratings: {}
      }));
    }

    // Apply default values for selected language to all ranges
    this.gradingSettings.customRatings.forEach((range, index) => {
      const defaultRange = defaultRatings.find(dr => 
        dr.min === range.min && 
        (dr.max === range.max || (dr.max === undefined && range.max === undefined))
      );
      
      if (defaultRange && defaultRange.ratings[language as keyof typeof defaultRange.ratings]) {
        if (!range.ratings) {
          range.ratings = {};
        }
        range.ratings[language as keyof typeof range.ratings] = defaultRange.ratings[language as keyof typeof defaultRange.ratings] as string;
      }
    });
  }

  // Get rating value for selected language
  getRatingValueForSelectedLanguage(range: any): string {
    if (!this.selectedRatingsLanguage || !range.ratings) {
      return '';
    }
    return range.ratings[this.selectedRatingsLanguage] || '';
  }

  // Set rating value for selected language
  setRatingValueForSelectedLanguage(range: any, value: string): void {
    if (!this.selectedRatingsLanguage) {
      return;
    }
    if (!range.ratings) {
      range.ratings = {};
    }
    range.ratings[this.selectedRatingsLanguage] = value;
  }

  // Apply default guidance for selected language
  applyDefaultGuidanceForLanguage(language: string): void {
    if (!language) {
      return;
    }

    const defaultGuidance = this.getDefaultGuidance();
    
    // Initialize customGuidance if empty
    if (!this.gradingSettings.customGuidance || this.gradingSettings.customGuidance.length === 0) {
      this.gradingSettings.customGuidance = defaultGuidance.map(g => ({
        min: g.min,
        max: g.max,
        guidance: {}
      }));
    }

    // Apply default values for selected language to all ranges
    this.gradingSettings.customGuidance.forEach((range, index) => {
      const defaultRange = defaultGuidance.find(dg => 
        dg.min === range.min && 
        (dg.max === range.max || (dg.max === undefined && range.max === undefined))
      );
      
      if (defaultRange && defaultRange.guidance[language as keyof typeof defaultRange.guidance]) {
        if (!range.guidance) {
          range.guidance = {};
        }
        range.guidance[language as keyof typeof range.guidance] = defaultRange.guidance[language as keyof typeof defaultRange.guidance] as string;
      }
    });
  }

  // Get guidance value for selected language
  getGuidanceValueForSelectedLanguage(range: any): string {
    if (!this.selectedGuidanceLanguage || !range.guidance) {
      return '';
    }
    return range.guidance[this.selectedGuidanceLanguage] || '';
  }

  // Set guidance value for selected language
  setGuidanceValueForSelectedLanguage(range: any, value: string): void {
    if (!this.selectedGuidanceLanguage) {
      return;
    }
    if (!range.guidance) {
      range.guidance = {};
    }
    range.guidance[this.selectedGuidanceLanguage] = value;
  }

  getTotalColumnsCount(): number {
    const fixedColumns = 5; // #, idNumber, firstName, lastName, birthDate
    const visibleBaseColumns = this.getBaseColumnsForCurrentView().filter(column => column.visible).length;
    const continuousAssessment = 1;
    const oralExpression = this.shouldShowOralExpressionColumn() ? 1 : 0;
    const assignment = 1;
    const test = 1;
    const extraColumns = 4; // termAverage, ratings, guidance, ranking
    return (
      fixedColumns +
      visibleBaseColumns +
      continuousAssessment +
      oralExpression +
      assignment +
      test +
      extraColumns +
      this.getCustomColumns().length
    );
  }

  getCustomColumnGrade(studentId: number, columnId: string | undefined): number | null {
    if (!this.selectedClass || !columnId) return null;
    
    // Find grade for this custom column by checking notes field
    const grade = this.grades.find(g => 
      g.studentId === studentId &&
      g.classId === this.selectedClass!.id &&
      g.term === this.selectedTerm &&
      g.notes === `custom_column_${columnId}`
    );
    
    return grade ? grade.score : null;
  }

  onCustomColumnGradeBlur(event: Event, studentId: number, column: CustomAssessmentColumn): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value !== null && input.value !== undefined && input.value !== '') {
      const score = parseFloat(input.value);
      if (!isNaN(score) && score >= 0 && score <= column.maxScore) {
        this.saveCustomColumnGrade(studentId, column, score);
      } else if (score > column.maxScore) {
        alert(`الدرجة القصوى المسموحة هي ${column.maxScore} نقاط`);
        input.value = '';
      }
    } else if (input && input.value === '') {
      // Delete the grade if input is cleared
      this.deleteCustomColumnGrade(studentId, column.id);
    }
  }

  saveCustomColumnGrade(studentId: number, column: CustomAssessmentColumn, score: number): void {
    if (!this.selectedClass || !column.id) return;

    // Find existing grade
    let existingGrade = this.grades.find(g => 
      g.studentId === studentId &&
      g.classId === this.selectedClass!.id &&
      g.term === this.selectedTerm &&
      g.notes === `custom_column_${column.id}`
    );

    const gradeData: CreateGradeDto = {
      studentId: studentId,
      assessmentId: 0, // We'll use 0 as a placeholder for custom columns
      classId: this.selectedClass.id,
      term: this.selectedTerm,
      score: score,
      maxScore: column.maxScore,
      date: new Date().toISOString().split('T')[0],
      notes: `custom_column_${column.id}`,
      mark: ''
    };

    if (existingGrade) {
      // Update existing grade
      this.apiService.patch<Grade>(`/grades/${existingGrade.id}`, {
        score: score,
        maxScore: column.maxScore
      }).subscribe({
        next: (updatedGrade) => {
          const index = this.grades.findIndex(g => g.id === existingGrade!.id);
          if (index !== -1) {
            this.grades[index] = updatedGrade;
          }
          this.calculateAllGrades();
        },
        error: (error) => {
          console.error('Error updating custom column grade:', error);
        }
      });
    } else {
      // Create new grade
      this.apiService.post<Grade>('/grades', gradeData).subscribe({
        next: (newGrade) => {
          this.grades.push(newGrade);
          this.calculateAllGrades();
        },
        error: (error) => {
          console.error('Error creating custom column grade:', error);
        }
      });
    }
  }

  deleteCustomColumnGrade(studentId: number, columnId: string | undefined): void {
    if (!this.selectedClass || !columnId) return;

    const grade = this.grades.find(g => 
      g.studentId === studentId &&
      g.classId === this.selectedClass!.id &&
      g.term === this.selectedTerm &&
      g.notes === `custom_column_${columnId}`
    );

    if (grade) {
      this.apiService.delete(`/grades/${grade.id}`).subscribe({
        next: () => {
          this.grades = this.grades.filter(g => g.id !== grade.id);
          this.calculateAllGrades();
        },
        error: (error) => {
          console.error('Error deleting custom column grade:', error);
        }
      });
    }
  }

  bulkApplySettings(): void {
    const total = this.calculateTotalMaxScore();
    if (total > 20) {
      alert('مجموع النقاط القصوى يجب ألا يتجاوز 20. الرجاء تعديل القيم.');
      return;
    }

    const bulkDto: any = {
      notebookCorrectionMaxScore: this.gradingSettings.notebookCorrectionMaxScore,
      dutyMaxScore: this.gradingSettings.dutyMaxScore,
      attendanceMaxScore: this.gradingSettings.attendanceMaxScore,
      attendanceAutoApply: this.gradingSettings.attendanceAutoApply,
      behaviorMaxScore: this.gradingSettings.behaviorMaxScore,
      behaviorAutoApply: this.gradingSettings.behaviorAutoApply,
      customAssessmentColumns: this.gradingSettings.customAssessmentColumns,
      baseColumnSettings: this.normalizeBaseColumnSettings(this.gradingSettings.baseColumnSettings),
      includeOralExpression: this.gradingSettings.includeOralExpression,
      autoFillOralExpressionFromSeating: this.gradingSettings.autoFillOralExpressionFromSeating,
      customRatings: this.gradingSettings.customRatings,
      customGuidance: this.gradingSettings.customGuidance,
    };

    // Check if applying to all classes or specific classes
    if (this.applyToAllClasses) {
      bulkDto.applyToAllClasses = true;
    } else {
      if (!this.selectedClassesForBulk || this.selectedClassesForBulk.length === 0) {
        alert('يرجى اختيار قسم واحد على الأقل أو تفعيل "تطبيق على جميع الأقسام"');
        return;
      }
      bulkDto.classIds = this.selectedClassesForBulk;
    }

    // Add language selection if specified
    if (this.selectedRatingsLanguage) {
      bulkDto.ratingsLanguage = this.selectedRatingsLanguage;
    }
    if (this.selectedGuidanceLanguage) {
      bulkDto.guidanceLanguage = this.selectedGuidanceLanguage;
    }

    this.gradingSettingsService.bulkApply(bulkDto).subscribe({
      next: (results) => {
        alert(`تم تطبيق الإعدادات على ${results.length} قسم بنجاح`);
      },
      error: (error) => {
        console.error('Error bulk applying settings:', error);
        alert('حدث خطأ أثناء تطبيق الإعدادات');
      }
    });
  }

  // =================== Council Semester Records Methods ===================

  onCouncilClassChange(): void {
    if (!this.councilSelectedClass) return;

    // Respect the active tab so the correct dataset is refreshed
    if (this.councilActiveTab === 'final') {
      this.loadFinalCouncilDecisions();
    } else {
      this.loadCouncilSemesterData();
    }
  }

  onCouncilTermChange(): void {
    if (!this.councilSelectedClass) return;

    if (this.councilActiveTab === 'final') {
      // Final decisions need to re-sync averages when context changes
      this.loadFinalCouncilDecisions();
    } else {
      this.loadCouncilSemesterData();
    }
  }

  loadCouncilSemesterData(): void {
    if (!this.councilSelectedClass) return;

    // Load council semester records
    this.apiService.get<CouncilSemesterRecord[]>(
      `/council/semester-records?classId=${this.councilSelectedClass.id}&term=${this.councilSelectedTerm}`
    ).subscribe({
      next: (records) => {
        this.councilRecords = records;
        this.loadCouncilStudents();
      },
      error: (error) => {
        console.error('Error loading council semester records:', error);
        // Load students even if council records fail (might be empty)
        this.councilRecords = [];
        this.loadCouncilStudents();
      }
    });
  }

  loadCouncilStudents(): void {
    if (!this.councilSelectedClass) return;

    // Load students and grades in parallel
    this.apiService.get<Student[]>(`/students?classId=${this.councilSelectedClass.id}`).subscribe({
      next: (students) => {
        // Load grades for this class and term
        this.apiService.get<Grade[]>(`/grades?classId=${this.councilSelectedClass!.id}&term=${this.councilSelectedTerm}`).subscribe({
          next: (grades) => {
            // Merge students with their council records and calculate teacher averages
            this.councilStudentsWithRecords = students.map(student => {
              const record = this.councilRecords.find(r => r.studentId === student.id);
              const teacherAverage = this.calculateCouncilTeacherAverage(student.id, grades);
              
              const councilRecord = record || this.createEmptyCouncilRecord(student.id);
              councilRecord.teacherAverage = teacherAverage;
              
              return {
                ...student,
                councilRecord
              };
            });
          },
          error: (error) => {
            console.error('Error loading grades:', error);
            // Still show students without teacher averages
            this.councilStudentsWithRecords = students.map(student => {
              const record = this.councilRecords.find(r => r.studentId === student.id);
              return {
                ...student,
                councilRecord: record || this.createEmptyCouncilRecord(student.id)
              };
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }
  
  calculateCouncilTeacherAverage(studentId: number, grades: Grade[]): number {
    // Filter grades for this student
    const studentGrades = grades.filter(g => g.studentId === studentId);
    
    // Get grades by type
    const notebookGrade = studentGrades.find(g => g.assessmentId === this.assessments.find(a => a.type === 'notebook_correction')?.id);
    const dutyGrade = studentGrades.find(g => g.assessmentId === this.assessments.find(a => a.type === 'duty')?.id);
    const attendanceGrade = studentGrades.find(g => g.assessmentId === this.assessments.find(a => a.type === 'attendance')?.id);
    const behaviorGrade = studentGrades.find(g => g.assessmentId === this.assessments.find(a => a.type === 'behavior')?.id);
    const oralExpressionGrade = studentGrades.find(g => g.assessmentId === this.assessments.find(a => a.type === 'oral_expression')?.id);
    const assignmentGrade = studentGrades.find(g => g.assessmentId === this.assessments.find(a => a.type === 'assignment')?.id);
    const testGrade = studentGrades.find(g => g.assessmentId === this.assessments.find(a => a.type === 'test')?.id);
    
    const notebook = notebookGrade?.score || 0;
    const duty = dutyGrade?.score || 0;
    const attendance = attendanceGrade?.score || 0;
    const behavior = behaviorGrade?.score || 0;
    const oralExpression = oralExpressionGrade?.score || 0;
    const assignment = assignmentGrade?.score || 0;
    const test = testGrade?.score || 0;
    
    // التقييم المستمر = الدفتر + الواجب + الحضور + السلوك (الحد الأقصى 20)
    const continuous = Math.min(notebook + duty + attendance + behavior, 20);
    
    // Check if oral expression is included (default: true)
    const includeOralExpression = this.currentClassGradingSettings?.includeOralExpression !== false;
    
    if (includeOralExpression && oralExpression > 0) {
      // المعدل = ((التقييم المستمر + التعبير الشفهي + الفرض) + (الاختبار × 2)) ÷ 5
      return (continuous + oralExpression + assignment + (test * 2)) / 5;
    } else {
      // المعدل = ((التقييم المستمر + الفرض) + (الاختبار × 2)) ÷ 4
      return (continuous + assignment + (test * 2)) / 4;
    }
  }

  createEmptyCouncilRecord(studentId: number): CouncilSemesterRecord {
    return {
      studentId: studentId,
      classId: this.councilSelectedClass!.id,
      term: this.councilSelectedTerm,
      teacherAverage: 0,
      semesterAverage: 0,
      behaviorRating: 3,
      absencesLevel: 'disciplined',
      award: 'none',
      councilNotes: ''
    };
  }

  saveCouncilRecord(student: Student & { councilRecord?: CouncilSemesterRecord }): void {
    if (!student.councilRecord) return;

    const dto = {
      studentId: Number(student.id),
      classId: Number(this.councilSelectedClass!.id),
      term: Number(this.councilSelectedTerm),
      teacherAverage: student.councilRecord.teacherAverage != null ? Number(student.councilRecord.teacherAverage) : 0,
      semesterAverage: student.councilRecord.semesterAverage != null ? Number(student.councilRecord.semesterAverage) : 0,
      behaviorRating: student.councilRecord.behaviorRating != null ? Number(student.councilRecord.behaviorRating) : 3,
      absencesLevel: student.councilRecord.absencesLevel || 'disciplined',
      award: student.councilRecord.award || 'none',
      councilNotes: student.councilRecord.councilNotes || ''
    };

    console.log('Saving council record:', dto);
    
    if (student.councilRecord.id) {
      // Update existing record
      this.apiService.patch<CouncilSemesterRecord>(
        `/council/semester-records/${student.councilRecord.id}`,
        dto
      ).subscribe({
        next: (updated) => {
          student.councilRecord = updated;
          alert(this.translate('gradebook.saveSuccess'));
        },
        error: (error) => {
          console.error('Error updating council record:', error);
          const errorMsg = error?.error?.message || error?.message || this.translate('gradebook.unknownError');
          alert(`${this.translate('gradebook.saveError')}: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`);
        }
      });
    } else {
      // Create new record
      this.apiService.post<CouncilSemesterRecord>('/council/semester-records', dto).subscribe({
        next: (created) => {
          student.councilRecord = created;
          alert(this.translate('gradebook.saveSuccess'));
        },
        error: (error) => {
          console.error('Error creating council record:', error);
          const errorMsg = error?.error?.message || error?.message || this.translate('gradebook.unknownError');
          alert(`${this.translate('gradebook.saveError')}: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`);
        }
      });
    }
  }

  bulkSaveCouncilRecords(): void {
    const records = this.councilStudentsWithRecords.map(student => ({
      studentId: Number(student.id),
      classId: Number(this.councilSelectedClass!.id),
      term: Number(this.councilSelectedTerm),
      teacherAverage: student.councilRecord?.teacherAverage != null ? Number(student.councilRecord.teacherAverage) : 0,
      semesterAverage: student.councilRecord?.semesterAverage != null ? Number(student.councilRecord.semesterAverage) : 0,
      behaviorRating: student.councilRecord?.behaviorRating != null ? Number(student.councilRecord.behaviorRating) : 3,
      absencesLevel: student.councilRecord?.absencesLevel || 'disciplined',
      award: student.councilRecord?.award || 'none',
      councilNotes: student.councilRecord?.councilNotes || ''
    }));

    console.log('Bulk saving council records:', records);
    
    this.apiService.post<CouncilSemesterRecord[]>('/council/semester-records/bulk', records).subscribe({
      next: (saved) => {
        alert(this.translate('gradebook.bulkSaveRecordsSuccess', { count: String(saved.length) }));
        this.loadCouncilSemesterData();
      },
      error: (error) => {
        console.error('Error bulk saving council records:', error);
        const errorMsg = error?.error?.message || error?.message || this.translate('gradebook.unknownError');
        alert(`${this.translate('gradebook.saveError')}: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`);
      }
    });
  }

  async exportCouncilSemesterPDF(): Promise<void> {
    if (!this.councilSelectedClass) return;

    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const currentLang = this.languageService.getCurrentLanguage();
    const isArabic = currentLang === 'AR';

    // Try to load Arabic-capable font when needed; fallback to helvetica
    const arabicFontLoaded = isArabic ? await this.ensureArabicFont(pdf) : false;
    pdf.setFont(arabicFontLoaded ? 'Amiri' : 'helvetica', 'bold');
    pdf.setFontSize(16);

    // Title
    const title = this.translate('gradebook.councilTitle', { 
      className: this.councilSelectedClass.name, 
      term: String(this.councilSelectedTerm) 
    });
    
    pdf.text(title, pdf.internal.pageSize.width / 2, 15, { align: 'center' });

    // Date
    const dateLocale = isArabic ? 'ar-DZ' : currentLang.toLowerCase();
    const date = new Date().toLocaleDateString(dateLocale);
    pdf.setFontSize(10);
    pdf.setFont(arabicFontLoaded ? 'Amiri' : 'helvetica', 'normal');
    pdf.text(date, pdf.internal.pageSize.width - 20, 10, { align: 'right' });

    // Table headers
    const headers = [
      this.translate('gradebook.photo'),
      this.translate('gradebook.idNumber'),
      this.translate('gradebook.lastName'),
      this.translate('gradebook.firstName'),
      this.translate('gradebook.birthDate'),
      this.translate('gradebook.gender'),
      this.translate('gradebook.repeater'),
      this.translate('gradebook.teacherAverage'),
      this.translate('gradebook.semesterAverage'),
      this.translate('gradebook.behavior'),
      this.translate('gradebook.absences'),
      this.translate('gradebook.award'),
      this.translate('gradebook.notes')
    ];

    // Table data
    const data = this.councilStudentsWithRecords.map(student => [
      '', // Photo placeholder
      student.idNumber || '',
      student.lastName,
      student.firstName,
      student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString(dateLocale) : '',
      this.getGenderLabel(student.gender),
      student.isRepeater ? this.translate('common.yes') : this.translate('common.no'),
      this.formatCouncilAverage(student.councilRecord?.teacherAverage),
      this.formatCouncilAverage(student.councilRecord?.semesterAverage),
      '⭐'.repeat(student.councilRecord?.behaviorRating || 0),
      this.getAbsenceLabel(student.councilRecord?.absencesLevel || ''),
      this.getAwardLabel(student.councilRecord?.award || ''),
      student.councilRecord?.councilNotes || ''
    ]);

    // Use autoTable plugin (you may need to install @types/jspdf-autotable)
    (pdf as any).autoTable({
      head: [headers],
      body: data,
      startY: 25,
      styles: {
        font: arabicFontLoaded ? 'Amiri' : 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        textColor: 0,
        halign: isArabic ? 'right' : 'left',
        textDirection: isArabic ? 'rtl' : 'ltr',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 }, // Photo
        12: { cellWidth: 30 } // Notes
      }
    });

    // Signature section
    const finalY = (pdf as any).lastAutoTable.finalY + 10;
    pdf.setFontSize(10);
    pdf.text(this.translate('gradebook.teacherSignature'), 20, finalY);

    // Save PDF
    const filename = `council_semester_${this.councilSelectedClass.name}_term${this.councilSelectedTerm}_${Date.now()}.pdf`;
    pdf.save(filename);
  }

  private formatCouncilAverage(value: any): string {
    const num = Number(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  }

  translateAward(award: string | undefined, lang: string): string {
    if (!award) return '';
    const translations: any = {
      'AR': {
        'excellence': 'امتياز',
        'congratulation': 'تهنئة',
        'encouragement': 'تشجيع',
        'honor_roll': 'لوحة شرف',
        'none': 'لا شيء'
      },
      'FR': {
        'excellence': 'Excellence',
        'congratulation': 'Félicitations',
        'encouragement': 'Encouragement',
        'honor_roll': 'Tableau d\'honneur',
        'none': 'Aucun'
      },
      'EN': {
        'excellence': 'Excellence',
        'congratulation': 'Congratulation',
        'encouragement': 'Encouragement',
        'honor_roll': 'Honor Roll',
        'none': 'None'
      },
      'ES': {
        'excellence': 'Excelencia',
        'congratulation': 'Felicitación',
        'encouragement': 'Ánimo',
        'honor_roll': 'Cuadro de honor',
        'none': 'Ninguno'
      },
      'IT': {
        'excellence': 'Eccellenza',
        'congratulation': 'Congratulazioni',
        'encouragement': 'Incoraggiamento',
        'honor_roll': 'Albo d\'onore',
        'none': 'Nessuno'
      },
      'DE': {
        'excellence': 'Exzellenz',
        'congratulation': 'Glückwunsch',
        'encouragement': 'Ermutigung',
        'honor_roll': 'Ehrenliste',
        'none': 'Keine'
      },
      'TR': {
        'excellence': 'Mükemmellik',
        'congratulation': 'Tebrik',
        'encouragement': 'Teşvik',
        'honor_roll': 'Onur listesi',
        'none': 'Hiçbiri'
      }
    };
    return translations[lang]?.[award] || award;
  }

  translateAbsencesLevel(level: string | undefined, lang: string): string {
    if (!level) return '';
    const translations: any = {
      'AR': {
        'disciplined': 'منضبط',
        'average': 'متوسط',
        'frequent': 'كثير الغياب'
      },
      'FR': {
        'disciplined': 'Discipliné',
        'average': 'Moyen',
        'frequent': 'Fréquent'
      },
      'EN': {
        'disciplined': 'Disciplined',
        'average': 'Average',
        'frequent': 'Frequent'
      },
      'ES': {
        'disciplined': 'Disciplinado',
        'average': 'Promedio',
        'frequent': 'Faltas frecuentes'
      },
      'IT': {
        'disciplined': 'Disciplinato',
        'average': 'Medio',
        'frequent': 'Assenze frequenti'
      },
      'DE': {
        'disciplined': 'Diszipliniert',
        'average': 'Durchschnittlich',
        'frequent': 'Häufig fehlend'
      },
      'TR': {
        'disciplined': 'Disiplinli',
        'average': 'Orta',
        'frequent': 'Sık devamsız'
      }
    };
    return translations[lang]?.[level] || level;
  }

  // =================== Final Council Decision Methods ===================

  loadFinalCouncilDecisions(): void {
    if (!this.councilSelectedClass) return;

    this.apiService.get<FinalCouncilDecision[]>(
      `/council/final-decisions?classId=${this.councilSelectedClass.id}`
    ).subscribe({
      next: (decisions) => {
        this.finalDecisions = decisions;
        this.loadFinalStudents();
      },
      error: (error) => {
        console.error('Error loading final council decisions:', error);
        // Load students even if final decisions fail (might be empty)
        this.finalDecisions = [];
        this.loadFinalStudents();
      }
    });
  }

  loadFinalStudents(): void {
    if (!this.councilSelectedClass) return;

    this.apiService.get<Student[]>(`/students?classId=${this.councilSelectedClass.id}`).subscribe({
      next: (students) => {
        // Merge students with their final decisions
        this.finalStudentsWithDecisions = students.map(student => {
          const decision = this.finalDecisions.find(d => d.studentId === student.id);
          return {
            ...student,
            finalDecision: decision || this.createEmptyFinalDecision(student.id)
          };
        });

        // Sync term averages from council records
        this.syncAllTermAverages();
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  createEmptyFinalDecision(studentId: number): FinalCouncilDecision {
    return {
      studentId: studentId,
      classId: this.councilSelectedClass!.id,
      term1Average: 0,
      term2Average: 0,
      term3Average: 0,
      annualAverage: 0,
      finalDecision: 'pass',
      isManualDecision: false,
      notes: ''
    };
  }

  syncAllTermAverages(): void {
    this.finalStudentsWithDecisions.forEach(student => {
      this.syncStudentTermAverages(student.id);
    });
  }

  syncStudentTermAverages(studentId: number): void {
    if (!this.councilSelectedClass) return;

    this.apiService.get<{ term1?: number; term2?: number; term3?: number }>(
      `/council/final-decisions/sync-term-averages/${studentId}?classId=${this.councilSelectedClass.id}`
    ).subscribe({
      next: (averages) => {
        const student = this.finalStudentsWithDecisions.find(s => s.id === studentId);
        if (student && student.finalDecision) {
          const term1 = averages.term1 ?? student.finalDecision.term1Average ?? 0;
          const term2 = averages.term2 ?? student.finalDecision.term2Average ?? 0;
          const term3 = averages.term3 ?? student.finalDecision.term3Average ?? 0;

          student.finalDecision.term1Average = Number(term1);
          student.finalDecision.term2Average = Number(term2);
          student.finalDecision.term3Average = Number(term3);
          this.calculateFinalAnnualAverage(student.finalDecision);
          this.determineAutoDecision(student.finalDecision);
        }
      },
      error: (error) => {
        console.error('Error syncing term averages:', error);
      }
    });
  }

  calculateFinalAnnualAverage(decision: FinalCouncilDecision): void {
    // المعدل السنوي = (معدل الفصل 1 + معدل الفصل 2 + معدل الفصل 3) / 3
    const term1 = Number(decision.term1Average ?? 0);
    const term2 = Number(decision.term2Average ?? 0);
    const term3 = Number(decision.term3Average ?? 0);
    
    decision.annualAverage = (term1 + term2 + term3) / 3;
  }

  determineAutoDecision(decision: FinalCouncilDecision): void {
    if (decision.isManualDecision) return;

    const avg = decision.annualAverage || 0;
    if (avg >= 10) {
      decision.finalDecision = 'pass';
    } else if (avg >= 9) {
      decision.finalDecision = 'remedial';
    } else {
      decision.finalDecision = 'repeat';
    }
  }

  onFinalDecisionChange(decision: FinalCouncilDecision): void {
    this.calculateFinalAnnualAverage(decision);
    this.determineAutoDecision(decision);
  }

  saveFinalDecision(student: Student & { finalDecision?: FinalCouncilDecision }): void {
    if (!student.finalDecision) return;

    const dto = {
      studentId: student.id,
      classId: this.councilSelectedClass!.id,
      term1Average: student.finalDecision.term1Average,
      term2Average: student.finalDecision.term2Average,
      term3Average: student.finalDecision.term3Average,
      annualAverage: student.finalDecision.annualAverage,
      finalDecision: student.finalDecision.finalDecision,
      isManualDecision: student.finalDecision.isManualDecision,
      notes: student.finalDecision.notes
    };

    if (student.finalDecision.id) {
      // Update existing decision
      this.apiService.patch<FinalCouncilDecision>(
        `/council/final-decisions/${student.finalDecision.id}`,
        dto
      ).subscribe({
        next: (updated) => {
          student.finalDecision = updated;
          alert(this.translate('gradebook.saveDecisionSuccess'));
        },
        error: (error) => {
          console.error('Error updating final decision:', error);
          const errorMsg = error?.error?.message || error?.message || this.translate('gradebook.unknownError');
          alert(`${this.translate('gradebook.saveError')}: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`);
        }
      });
    } else {
      // Create new decision
      this.apiService.post<FinalCouncilDecision>('/council/final-decisions', dto).subscribe({
        next: (created) => {
          student.finalDecision = created;
          alert(this.translate('gradebook.saveDecisionSuccess'));
        },
        error: (error) => {
          console.error('Error creating final decision:', error);
          const errorMsg = error?.error?.message || error?.message || this.translate('gradebook.unknownError');
          alert(`${this.translate('gradebook.saveError')}: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`);
        }
      });
    }
  }

  bulkSaveFinalDecisions(): void {
    const decisions = this.finalStudentsWithDecisions.map(student => ({
      studentId: student.id,
      classId: this.councilSelectedClass!.id,
      term1Average: student.finalDecision?.term1Average,
      term2Average: student.finalDecision?.term2Average,
      term3Average: student.finalDecision?.term3Average,
      annualAverage: student.finalDecision?.annualAverage,
      finalDecision: student.finalDecision?.finalDecision,
      isManualDecision: student.finalDecision?.isManualDecision,
      notes: student.finalDecision?.notes
    }));

    this.apiService.post<FinalCouncilDecision[]>('/council/final-decisions/bulk', decisions).subscribe({
      next: (saved) => {
        alert(this.translate('gradebook.bulkSaveDecisionsSuccess', { count: String(saved.length) }));
        this.loadFinalCouncilDecisions();
      },
      error: (error) => {
        console.error('Error bulk saving final decisions:', error);
        const errorMsg = error?.error?.message || error?.message || this.translate('gradebook.unknownError');
        alert(`${this.translate('gradebook.saveError')}: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`);
      }
    });
  }

  async exportFinalDecisionPDF(): Promise<void> {
    if (!this.councilSelectedClass) return;

    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const currentLang = this.languageService.getCurrentLanguage();
    const isArabic = currentLang === 'AR';

    // Try to load Arabic-capable font when needed; fallback to helvetica
    const arabicFontLoaded = isArabic ? await this.ensureArabicFont(pdf) : false;
    pdf.setFont(arabicFontLoaded ? 'Amiri' : 'helvetica', 'normal');
    pdf.setFontSize(16);

    // Title
    const title = this.translate('gradebook.finalDecisionTitle', { className: this.councilSelectedClass.name });
    
    pdf.text(title, pdf.internal.pageSize.width / 2, 15, { align: 'center' });

    // Date
    const dateLocale = isArabic ? 'ar-DZ' : currentLang.toLowerCase();
    const date = new Date().toLocaleDateString(dateLocale);
    pdf.setFontSize(10);
    pdf.text(date, pdf.internal.pageSize.width - 20, 10, { align: 'right' });

    // Table headers
    const headers = [
      this.translate('gradebook.idNumber'),
      this.translate('gradebook.lastName'),
      this.translate('gradebook.firstName'),
      this.translate('gradebook.term1Average'),
      this.translate('gradebook.term2Average'),
      this.translate('gradebook.term3Average'),
      this.translate('gradebook.annualAverage'),
      this.translate('gradebook.finalDecision'),
      this.translate('gradebook.notes')
    ];

    // Table data
    const data = this.finalStudentsWithDecisions.map(student => [
      student.idNumber || '',
      student.lastName,
      student.firstName,
      student.finalDecision?.term1Average?.toFixed(2) || '',
      student.finalDecision?.term2Average?.toFixed(2) || '',
      student.finalDecision?.term3Average?.toFixed(2) || '',
      student.finalDecision?.annualAverage?.toFixed(2) || '',
      this.getDecisionLabel(student.finalDecision?.finalDecision || ''),
      student.finalDecision?.notes || ''
    ]);

    // Use autoTable plugin
    (pdf as any).autoTable({
      head: [headers],
      body: data,
      startY: 25,
      styles: {
        font: arabicFontLoaded ? 'Amiri' : 'helvetica',
        fontSize: 9,
        cellPadding: 2,
        textColor: 0,
        halign: isArabic ? 'right' : 'left',
        textDirection: isArabic ? 'rtl' : 'ltr',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        8: { cellWidth: 30 } // Notes
      }
    });

    // Signature section
    const finalY = (pdf as any).lastAutoTable.finalY + 10;
    pdf.setFontSize(10);
    pdf.text(this.translate('gradebook.councilMembersSignature'), 20, finalY);

    // Save PDF
    const filename = `final_decision_${this.councilSelectedClass.name}_${Date.now()}.pdf`;
    pdf.save(filename);
  }

  // Attempts to load an Arabic-supporting font from assets; falls back gracefully
  private async ensureArabicFont(pdf: any): Promise<boolean> {
    try {
      if (this.amiriFontBase64) {
        pdf.addFileToVFS('Amiri-Regular.ttf', this.amiriFontBase64);
        pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'bold');
        return true;
      }

      // Expect font file at assets/fonts/Amiri-Regular.ttf (you need to add it)
      const response = await fetch('assets/fonts/Amiri-Regular.ttf');
      if (!response.ok) return false;
      const buffer = await response.arrayBuffer();
      const base64 = this.arrayBufferToBase64(buffer);
      this.amiriFontBase64 = base64;
      pdf.addFileToVFS('Amiri-Regular.ttf', base64);
      pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      // Use the same glyphs for bold so jsPDF can resolve widths/lookups
      pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'bold');
      return true;
    } catch (error) {
      console.warn('Arabic font load failed, falling back to helvetica:', error);
      return false;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  translateDecision(decision: string | undefined, lang: string): string {
    if (!decision) return '';
    const translations: any = {
      'AR': {
        'pass': 'يتنقل',
        'repeat': 'يعيد',
        'remedial': 'استدراك',
        'redirect': 'يوجه م ت م'
      },
      'FR': {
        'pass': 'Passe',
        'repeat': 'Redouble',
        'remedial': 'Rattrapage',
        'redirect': 'Réorienté (Tech)'
      },
      'EN': {
        'pass': 'Pass',
        'repeat': 'Repeat',
        'remedial': 'Remedial',
        'redirect': 'Vocational Redirect'
      },
      'ES': {
        'pass': 'Promociona',
        'repeat': 'Repite',
        'remedial': 'Recuperación',
        'redirect': 'Reorientación técnica'
      },
      'IT': {
        'pass': 'Promosso',
        'repeat': 'Ripete',
        'remedial': 'Recupero',
        'redirect': 'Riorientato (Tecnico)'
      },
      'DE': {
        'pass': 'Bestanden',
        'repeat': 'Wiederholt',
        'remedial': 'Nachprüfung',
        'redirect': 'Beruflich umgeleitet'
      },
      'TR': {
        'pass': 'Geçti',
        'repeat': 'Sınıf tekrarı',
        'remedial': 'Telafi',
        'redirect': 'Mesleki yönlendirme'
      }
    };
    return translations[lang]?.[decision] || decision;
  }

  getDecisionLabel(decision: string): string {
    return this.translateDecision(decision, this.languageService.getCurrentLanguage());
  }

  getAbsenceLabel(level: string): string {
    return this.translateAbsencesLevel(level, this.languageService.getCurrentLanguage());
  }

  getAwardLabel(award: string): string {
    return this.translateAward(award, this.languageService.getCurrentLanguage());
  }

  getGenderLabel(gender?: 'male' | 'female'): string {
    if (gender === 'male') return this.translate('gradebook.male');
    if (gender === 'female') return this.translate('gradebook.female');
    return '-';
  }

  onCouncilTabChange(tab: 'semester' | 'final'): void {
    this.councilActiveTab = tab;
    if (tab === 'semester' && this.councilSelectedClass) {
      this.loadCouncilSemesterData();
    } else if (tab === 'final' && this.councilSelectedClass) {
      this.loadFinalCouncilDecisions();
    }
  }
}

