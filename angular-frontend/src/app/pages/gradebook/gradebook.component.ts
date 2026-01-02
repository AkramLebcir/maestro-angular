import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { GradingSettingsService, GradingSettings, CustomAssessmentColumn, BaseColumnConfig, BaseColumnKey, DEFAULT_BASE_COLUMN_SETTINGS, RatingRangeConfig, GuidanceRangeConfig } from '../../services/grading-settings.service';
import { VoiceGradingService } from '../../services/voice-grading.service';
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
  standalone: false,
  selector: 'app-gradebook',
  templateUrl: './gradebook.component.html',
  styleUrls: ['./gradebook.component.css']
})
export class GradebookComponent implements OnInit, AfterViewInit, OnDestroy {
  students: Student[] = [];
  classes: Class[] = [];
  assessments: Assessment[] = [];
  grades: Grade[] = [];
  attendanceRecords: any[] = [];
  behaviorEvents: any[] = [];
  
  // Lookup maps for fast student matching (O(1) instead of O(n))
  private studentIdLookupMaps?: {
    normalized: Map<string, Student>;
    original: Map<string, Student>;
    noSpaces: Map<string, Student>;
    suffixMap: Map<string, Student>;
    prefixMap: Map<string, Student>;
    middleMap: Map<string, Student>;
  };
  
  // Lookup map for name-based matching
  private studentNameLookupMap?: Map<string, Student>;
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
  autoGenerateObsOnly: boolean = false; // تطبيق الملاحظات فقط دون الإرشادات
  processedExcelData: any[] = [];
  processedSheetsData: { sheetName: string; data: any[] }[] = [];
  // نتائج أخطاء النقاط المستخدمة في تقرير مراقبة النقاط
  gradeMonitoringErrors: any[] = [];
  isProcessing = false;
  // حفظ اسم ملف Excel الأصلي لإضافته الملاحظات والإرشادات دون تغيير البنية
  originalFileName: string = '';
  
  // Import options
  importMode: 'single' | 'multiple' = 'single'; // استيراد نوع واحد أو جميع الأنواع
  importIdentifier: 'name' | 'idNumber' = 'name'; // البحث بالاسم أو رقم الهوية
  availableSheets: Array<{ sheetName: string; rawData: any[][] }> = []; // Available sheets from Excel file
  selectedSheetIndex: number = 0; // Selected sheet index
  
  // متغيرات جديدة لاختيار الورقة
  allSheets: any[] = [];
  selectedSheetName: string = '';
  showSheetSelector: boolean = false;
  
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
  viewMode: 'entry' | 'grades' | 'reports' | 'analysis' | 'excelImport' | 'excelAnalysis' | 'totalExcelAnalysis' | 'settings' | 'council' | 'finalDecision' = 'entry';
  
  // Council variables
  councilRecords: CouncilSemesterRecord[] = [];
  finalDecisions: FinalCouncilDecision[] = [];
  councilSelectedClass: Class | null = null;
  councilSelectedTerm: number = 1;
  councilActiveTab: 'semester' | 'final' = 'semester';
  councilStudentsWithRecords: (Student & { councilRecord?: CouncilSemesterRecord })[] = [];
  
  // Total Excel Analysis variables
  totalAnalysisActiveTab: 'results' | 'count' | 'classification' | 'monitoring' = 'results';
  finalStudentsWithDecisions: (Student & { finalDecision?: FinalCouncilDecision })[] = [];
  editingCouncilRecord: { [key: string]: boolean } = {};
  editingFinalDecision: { [key: string]: boolean } = {};

  // Search variables for council
  councilStudentSearch: string = '';
  finalDecisionStudentSearch: string = '';

  // Hover card variables
  hoveredStudent: (Student & { councilRecord?: CouncilSemesterRecord }) | null = null;
  hoverCardPosition: { top: number; left: number } | null = null;
  studentAttendanceSummary: { present: number; total: number; percentage: number } | null = null;
  studentBehaviorSummary: { rating: number; events: any[] } | null = null;
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

  // Voice Grading
  isVoiceGradingActive = false;

  constructor(
    private apiService: ApiService,
    private gradingSettingsService: GradingSettingsService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    public languageService: LanguageService,
    private voiceGradingService: VoiceGradingService
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
      const view = params['view'];

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

      if (view === 'totalExcelAnalysis') {
        this.viewMode = 'totalExcelAnalysis';
        this.totalAnalysisActiveTab = 'results';
        // Update charts when switching to total analysis tab
        setTimeout(() => {
          this.updateTotalExcelAnalysisCharts();
          this.cdr.detectChanges();
        }, 500);
      }
    });

    // Subscribe to voice grading
    this.voiceGradingService.listening$.subscribe(isListening => {
      this.isVoiceGradingActive = isListening;
      this.cdr.detectChanges();
    });

    this.voiceGradingService.transcript$.subscribe(transcript => {
      this.handleVoiceInput(transcript);
    });
  }

  toggleVoiceGrading() {
    this.voiceGradingService.toggle();
  }

  handleVoiceInput(transcript: string) {
    if (!this.isVoiceGradingActive) return;
    
    // Parse number from transcript (handle Arabic and English numerals)
    const number = this.parseNumberFromSpeech(transcript);
    
    if (number !== null && !isNaN(number)) {
      const activeElement = document.activeElement as HTMLInputElement;
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'number') {
        activeElement.value = number.toString();
        activeElement.dispatchEvent(new Event('input'));
        activeElement.dispatchEvent(new Event('change'));
        
        // Optional: Trigger blur to save if needed, or wait for user to move
        // activeElement.dispatchEvent(new Event('blur')); 
        // Better to let user say "Next" or manually move, or auto-move?
        // Let's stick to filling the value for now. 
        // Triggering blur might save immediately which is good.
        activeElement.blur(); 
        activeElement.focus(); // Focus back? No, blur triggers save.
        
        // Maybe move to next input?
        // For now just fill and trigger change.
      }
    }
  }

  parseNumberFromSpeech(text: string): number | null {
    // 1. Normalize Arabic numerals to English
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let normalized = text;
    
    arabicNumerals.forEach((num, index) => {
      normalized = normalized.replace(new RegExp(num, 'g'), index.toString());
    });

    // 2. Handle Decimal Separators
    // Arabic 'فاصلة', comma, etc. -> '.'
    normalized = normalized.replace(/فاصلة/g, '.')
                           .replace(/,/g, '.')
                           .replace(/،/g, '.'); // Arabic comma

    // 3. Cleanup: Remove non-numeric characters except '.' and '-'
    // Note: This might remove words, so we rely on the speech engine to give digits or we do more advanced parsing.
    // For now, let's just extract the first valid number pattern found.
    
    // Check if the string contains digits
    const match = normalized.match(/-?[\d]+(\.[\d]+)?/);
    if (match) {
        const parsed = parseFloat(match[0]);
        return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  /**
   * Normalize Arabic text for better matching (handles hamza, taa marbuta, etc.)
   */
  /**
   * دالة التنظيف الذكي للأسماء - تتجاهل الفوارق بين (أ، إ، آ) و (ة، هـ)
   * لرفع نسبة نجاح المطابقة إلى 100%
   */
  /**
   * دالة المطابقة الذكية - تجمع بين المطابقة برقم التعريف والاسم
   */
  private findStudentSmartly(row: any, identifierColIndex: number, lastNameColIndex: number, firstNameColIndex: number): Student | undefined {
    // دالة تنظيف
    const clean = (val: any): string => {
      if (val === null || val === undefined || val === '') return '';
      return String(val)
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, '')
        .trim();
    };

    let identifier: string = '';
    let lastName: string = '';
    let firstName: string = '';

    // استخراج البيانات من الصف
    if (this.importIdentifier === 'idNumber') {
      const identifierValue = row[identifierColIndex];
      if (identifierValue !== null && identifierValue !== undefined && identifierValue !== '') {
        identifier = clean(identifierValue);
      }
      
      if (lastNameColIndex !== -1) {
        const lastNameValue = row[lastNameColIndex];
        if (lastNameValue !== null && lastNameValue !== undefined && lastNameValue !== '') {
          lastName = clean(lastNameValue);
        }
      }
      
      if (firstNameColIndex !== -1) {
        const firstNameValue = row[firstNameColIndex];
        if (firstNameValue !== null && firstNameValue !== undefined && firstNameValue !== '') {
          firstName = clean(firstNameValue);
        }
      }
    } else {
      if (lastNameColIndex !== -1) {
        const lastNameValue = row[lastNameColIndex];
        if (lastNameValue !== null && lastNameValue !== undefined && lastNameValue !== '') {
          lastName = clean(lastNameValue);
        }
      }
      
      if (firstNameColIndex !== -1) {
        const firstNameValue = row[firstNameColIndex];
        if (firstNameValue !== null && firstNameValue !== undefined && firstNameValue !== '') {
          firstName = clean(firstNameValue);
        }
      }
    }

    // محاولة المطابقة برقم التعريف أولاً
    if (identifier) {
      const normalizeId = (id: any): string => {
        if (id === null || id === undefined || id === '') return '';
        let cleanId = String(id).replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '').trim();
        if (cleanId.includes('e+') || cleanId.includes('E+')) {
          const num = parseFloat(cleanId);
          if (!isNaN(num)) {
            cleanId = num > Number.MAX_SAFE_INTEGER ? num.toFixed(0) : Math.floor(num).toString();
          }
        }
        if (cleanId.includes('.')) {
          const num = parseFloat(cleanId);
          if (!isNaN(num)) {
            cleanId = Math.floor(num).toString();
          }
        }
        cleanId = cleanId.replace(/^0+/, '') || '0';
        return cleanId;
      };

      const normalizedIdentifier = normalizeId(identifier);
      if (normalizedIdentifier && this.studentIdLookupMaps) {
        let student = this.studentIdLookupMaps.normalized.get(normalizedIdentifier);
        if (student) return student;
        
        const excelIdOriginal = String(identifier).replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '').trim();
        student = this.studentIdLookupMaps.original.get(excelIdOriginal);
        if (student) return student;
      }
    }

    // محاولة المطابقة بالاسم (تجاهل المسافات الزائدة)
    if (lastName || firstName) {
      const excelFullName = `${lastName || ''} ${firstName || ''}`.trim();
      const searchLastName = this.normalizeArabicText(lastName);
      const searchFirstName = this.normalizeArabicText(firstName);
      
      if (searchLastName && searchFirstName) {
        const fullNameKey = `${searchLastName}|${searchFirstName}`;
        const student = this.studentNameLookupMap?.get(fullNameKey);
        if (student) return student;
      }
      
      if (searchLastName) {
        const student = this.studentNameLookupMap?.get(searchLastName);
        if (student) return student;
      }
      
      // مطابقة جزئية
      if (searchLastName && searchFirstName) {
        const student = this.students.find(s => {
          const sLastName = this.normalizeArabicText(s.lastName || '');
          const sFirstName = this.normalizeArabicText(s.firstName || '');
          return (sLastName.includes(searchLastName) || searchLastName.includes(sLastName)) &&
                 (sFirstName.includes(searchFirstName) || searchFirstName.includes(sFirstName));
        });
        if (student) return student;
      }
    }

    return undefined;
  }

  normalizeArabicText(text: string): string {
    if (!text) return '';
    
    let normalized = String(text).trim();
    
    // Normalize hamza variations (أ, إ, آ, ؤ, ئ -> ا) - جميع أشكال الهمزة
    normalized = normalized.replace(/[أإآؤئ]/g, 'ا');
    
    // Normalize ي and ى - جميع أشكال الياء
    normalized = normalized.replace(/[ىي]/g, 'ي');
    
    // Normalize ة and ه - جميع أشكال التاء المربوطة والهاء
    normalized = normalized.replace(/[ةه]/g, 'ه');
    
    // Normalize additional Arabic variations
    // Normalize ك and ك (different forms of Kaf)
    normalized = normalized.replace(/[ك]/g, 'ك');
    
    // Remove diacritics (tashkeel) - جميع علامات التشكيل
    normalized = normalized.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
    
    // Remove zero-width characters and hidden spaces
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Normalize spaces (multiple spaces to single space)
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Convert to lowercase for case-insensitive matching
    return normalized.toLowerCase();
  }

  /**
   * Build lookup maps for fast student matching (O(1) lookups instead of O(n) .find() calls)
   * This dramatically improves performance when processing Excel files with many rows
   */
  private buildStudentLookupMaps(): void {
    // Helper function to normalize identifier (same as in processExcelDataInternal)
    // This must match exactly the normalization logic used during matching
    const normalizeId = (id: any): string => {
      if (id === null || id === undefined || id === '') return '';
      
      // Convert to string - handle Number, String, and any other type
      let cleanId = String(id);
      
      // Remove ALL types of spaces (regular, non-breaking, zero-width, etc.)
      // This is critical for matching Excel data which may have hidden characters
      cleanId = cleanId.replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '');
      
      // Trim again after removing all spaces
      cleanId = cleanId.trim();
      
      // Handle scientific notation
      if (cleanId.includes('e+') || cleanId.includes('E+')) {
        const num = parseFloat(cleanId);
        if (!isNaN(num)) {
          if (num > Number.MAX_SAFE_INTEGER) {
            cleanId = num.toFixed(0);
          } else {
            cleanId = Math.floor(num).toString();
          }
        }
      }
      
      // Handle decimal numbers
      if (cleanId.includes('.')) {
        const num = parseFloat(cleanId);
        if (!isNaN(num)) {
          cleanId = Math.floor(num).toString();
        } else {
          cleanId = cleanId.replace(/\.0+$/, '').replace(/\.$/, '');
        }
      }
      
      // Remove leading zeros (but keep at least one digit if all zeros)
      cleanId = cleanId.replace(/^0+/, '') || '0';
      
      return cleanId;
    };

    // Initialize maps
    const normalizedMap = new Map<string, Student>();
    const originalMap = new Map<string, Student>();
    const noSpacesMap = new Map<string, Student>();
    const suffixMap = new Map<string, Student>();
    const prefixMap = new Map<string, Student>();
    const middleMap = new Map<string, Student>();
    const nameMap = new Map<string, Student>();

    // Build ID-based lookup maps
    for (const student of this.students) {
      if (!student.idNumber) continue;

      const normalizedId = normalizeId(student.idNumber);
      // Clean original ID thoroughly - remove all types of spaces
      const originalId = String(student.idNumber)
        .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '')
        .trim();
      const noSpacesId = originalId; // Already cleaned above

      // Strategy 1: Normalized ID (most common)
      if (normalizedId && normalizedId.length > 0) {
        normalizedMap.set(normalizedId, student);
        
        // Also add common padded variations (14, 15, 16 digits) for better matching
        // This helps when Excel has IDs without leading zeros but DB has them (or vice versa)
        if (normalizedId.length >= 10 && normalizedId.length < 16) {
          for (let targetLength = 14; targetLength <= 16; targetLength++) {
            const paddedId = normalizedId.padStart(targetLength, '0');
            if (!normalizedMap.has(paddedId)) {
              normalizedMap.set(paddedId, student);
            }
          }
        }
      }

      // Strategy 2: Original ID with spaces
      if (originalId) {
        originalMap.set(originalId, student);
      }

      // Strategy 3: Original ID without spaces
      if (noSpacesId) {
        noSpacesMap.set(noSpacesId, student);
      }

      // Strategy 4-6: Build suffix, prefix, and middle maps for flexible matching
      if (normalizedId && normalizedId.length >= 10) {
        // Suffix map (last 10-14 digits)
        for (let suffixLen = Math.min(14, normalizedId.length); suffixLen >= 10; suffixLen--) {
          const suffix = normalizedId.slice(-suffixLen);
          if (!suffixMap.has(suffix)) {
            suffixMap.set(suffix, student);
          }
        }

        // Prefix map (first 10-14 digits)
        for (let prefixLen = Math.min(14, normalizedId.length); prefixLen >= 10; prefixLen--) {
          const prefix = normalizedId.slice(0, prefixLen);
          if (!prefixMap.has(prefix)) {
            prefixMap.set(prefix, student);
          }
        }

        // Middle map (middle 10-12 digits)
        if (normalizedId.length >= 12) {
          const startSkip = Math.floor((normalizedId.length - 12) / 2);
          const middlePart = normalizedId.slice(startSkip, startSkip + 12);
          if (!middleMap.has(middlePart)) {
            middleMap.set(middlePart, student);
          }
        }
      }
    }

    // Build name-based lookup map
    for (const student of this.students) {
      if (student.lastName && student.firstName) {
        const normalizedLastName = this.normalizeArabicText(student.lastName);
        const normalizedFirstName = this.normalizeArabicText(student.firstName);
        
        // Full name match (lastName + firstName)
        const fullNameKey = `${normalizedLastName}|${normalizedFirstName}`;
        nameMap.set(fullNameKey, student);
        
        // Last name only
        if (!nameMap.has(normalizedLastName)) {
          nameMap.set(normalizedLastName, student);
        }
      } else if (student.lastName) {
        const normalizedLastName = this.normalizeArabicText(student.lastName);
        if (!nameMap.has(normalizedLastName)) {
          nameMap.set(normalizedLastName, student);
        }
      }
    }

    // Store maps
    this.studentIdLookupMaps = {
      normalized: normalizedMap,
      original: originalMap,
      noSpaces: noSpacesMap,
      suffixMap,
      prefixMap,
      middleMap
    };
    
    this.studentNameLookupMap = nameMap;
  }

  ngOnDestroy() {
    this.voiceGradingService.stop();
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
        
        // Note: Zero values for continuous assessment will be handled after loading attendance and behavior
        // This allows us to calculate the correct value first, then clean up zero values if needed
        
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
        // IMPORTANT: Check if there's a manual grade first (imported or manually entered)
        // This allows imported continuous assessment values to override automatic calculation
        // The imported value takes priority, but base columns (notebook, duty, attendance, behavior)
        // can still be modified independently and won't affect the imported continuous assessment value
        const manualGrade = this.grades.find(g => 
          g.studentId === student.id && 
          g.assessmentId === assessment.id &&
          g.classId === this.selectedClass?.id &&
          g.term === this.selectedTerm
        );
        
        // Calculate automatic value first
        const calculatedValue = this.calculateAutomaticGrade(student, assessment, this.selectedTerm);
        
        if (manualGrade && manualGrade.score > 0) {
          // Use manual grade (imported or manually entered) only if it's greater than 0
          // A score of 0 might be a leftover default value, so we prefer calculated value
          calculated[key] = manualGrade.score;
        } else if (manualGrade && manualGrade.score === 0 && calculatedValue > 0) {
          // If manual grade is 0 but calculated value is > 0, use calculated value
          // This handles cases where 0 was saved as a default but we should calculate from base columns
          calculated[key] = calculatedValue;
        } else if (!manualGrade) {
          // No manual grade found, calculate automatically from notebook + duty + attendance + behavior
          calculated[key] = calculatedValue;
        } else {
          // Manual grade is 0 and calculated is also 0, use 0
          calculated[key] = 0;
        }
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
    
    // Use saved grades, or 0 if not saved yet
    // Note: This calculates from saved values only, not from input fields
    const duty = dutyGrade?.score ?? 0;
    const notebook = notebookGrade?.score ?? 0;
    
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
    
    // Calculate total: notebook + duty + attendance + behavior + custom columns
    // Even if notebook and duty are 0 (not saved yet), we still calculate from attendance and behavior
    const total = notebook + duty + attendance + behavior + customColumnsScore;
    
    // التأكد من أن النتيجة لا تتعدى 20 نقطة
    // Return the calculated value even if it's 0 (from attendance + behavior only)
    return Math.min(Math.max(total, 0), 20);
  }

  /**
   * Calculate and save continuous assessment from base columns for all students
   * This is used when continuous assessment is not imported from Excel
   * It calculates the value from notebook + duty + attendance + behavior + custom columns
   * Only calculates for students who don't have a manual continuous assessment grade
   */
  calculateContinuousAssessmentForAllStudents(): void {
    if (!this.selectedClass) return;
    
    const continuousAssessment = this.assessments.find(a => a.type === 'continuous_assessment');
    if (!continuousAssessment) return;
    
    let calculatedCount = 0;
    
    // Process each student
    for (const student of this.students) {
      // Check if there's already a manual grade (imported or manually entered) for this term
      const existingGrade = this.grades.find(g => 
        g.studentId === student.id && 
        g.assessmentId === continuousAssessment.id &&
        g.classId === this.selectedClass!.id &&
        g.term === this.selectedTerm
      );
      
      // If there's already a manual grade, skip this student
      if (existingGrade) {
        continue;
      }
      
      // Calculate continuous assessment from base columns
      const calculatedScore = this.calculateContinuousAssessment(student, this.selectedTerm);
      
      // Only save if the calculated score is greater than 0
      // This ensures we don't save 0 as a default value
      if (calculatedScore > 0) {
        calculatedCount++;
        this.calculateAndSaveContinuousAssessment(student.id, this.selectedTerm);
      }
    }
    
    if (calculatedCount > 0) {
      console.log(`Calculated continuous assessment for ${calculatedCount} students from base columns`);
    }
  }

  /**
   * إعادة حساب التقييم المستمر لجميع الطلاب بعد الاستيراد
   * هذه الدالة تحسب التقييم المستمر حتى للطلاب الذين تم استيراد درجاتهم
   * لأن التقييم المستمر يعتمد على درجات أخرى (notebook, duty, attendance, behavior)
   */
  recalculateContinuousAssessmentForAllStudents(): void {
    if (!this.selectedClass) return;
    
    const continuousAssessment = this.assessments.find(a => a.type === 'continuous_assessment');
    if (!continuousAssessment) return;
    
    // إعادة تحميل الدرجات أولاً لضمان الحصول على أحدث البيانات
    this.loadGradesForClass(this.selectedClass.id);
    
    // انتظار قليل لضمان اكتمال التحميل
    setTimeout(() => {
      // التحقق مرة أخرى من selectedClass داخل setTimeout
      if (!this.selectedClass) return;
      
      let recalculatedCount = 0;
      
      // Process each student
      for (const student of this.students) {
        // حساب التقييم المستمر من الأعمدة الأساسية
        const calculatedScore = this.calculateContinuousAssessment(student, this.selectedTerm);
        
        // التحقق من وجود درجة موجودة
        const existingGrade = this.grades.find(g => 
          g.studentId === student.id && 
          g.assessmentId === continuousAssessment.id &&
          g.classId === this.selectedClass!.id &&
          g.term === this.selectedTerm
        );
        
        // إذا كانت الدرجة المحسوبة مختلفة عن الموجودة، أو لم تكن موجودة، قم بحفظها
        if (!existingGrade || Math.abs(existingGrade.score - calculatedScore) > 0.01) {
          if (calculatedScore > 0) {
            recalculatedCount++;
            this.calculateAndSaveContinuousAssessment(student.id, this.selectedTerm);
          }
        }
      }
      
      if (recalculatedCount > 0 && this.selectedClass) {
        console.log(`✅ تم إعادة حساب التقييم المستمر لـ ${recalculatedCount} طالب بعد الاستيراد`);
        // إعادة تحميل الدرجات بعد الحساب
        this.loadGradesForClass(this.selectedClass.id);
        this.cdr.detectChanges();
      }
    }, 1500);
  }

  /**
   * Calculate and save continuous assessment from base columns for a single student
   * This is used when continuous assessment is not imported from Excel
   * It calculates the value from notebook + duty + attendance + behavior + custom columns
   */
  calculateAndSaveContinuousAssessment(studentId: number, term: number): void {
    if (!this.selectedClass) return;
    
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;
    
    const continuousAssessment = this.assessments.find(a => a.type === 'continuous_assessment');
    if (!continuousAssessment) return;
    
    // Check if there's already a manual grade (imported or manually entered)
    const existingGrade = this.grades.find(g => 
      g.studentId === studentId && 
      g.assessmentId === continuousAssessment.id &&
      g.classId === this.selectedClass!.id &&
      g.term === term
    );
    
    // If there's already a manual grade, don't override it
    if (existingGrade) {
      return;
    }
    
    // Calculate continuous assessment from base columns
    const calculatedScore = this.calculateContinuousAssessment(student, term);
    
    // Only save if the calculated score is greater than 0
    // This ensures we don't save 0 as a default value
    if (calculatedScore > 0) {
      const gradeData: CreateGradeDto = {
        studentId: studentId,
        assessmentId: continuousAssessment.id,
        classId: this.selectedClass!.id,
        term: term,
        score: calculatedScore,
        maxScore: continuousAssessment.maxScore,
        date: this.formatDateForAPI(this.selectedDate)
      };

      this.apiService.post<Grade>('/grades', gradeData).subscribe({
        next: (savedGrade) => {
          // Update local grades array
          const existingIndex = this.grades.findIndex(g => 
            g.studentId === studentId && 
            g.assessmentId === continuousAssessment.id &&
            g.classId === this.selectedClass!.id &&
            g.term === term
          );
          
          if (existingIndex >= 0) {
            this.grades[existingIndex] = savedGrade;
          } else {
            this.grades.push(savedGrade);
          }
          
          // Recalculate student grades
          this.calculateStudentGrades(student);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`Error saving calculated continuous assessment for student ${studentId}:`, error);
        }
      });
    }
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
  async onExcelFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      alert('يرجى اختيار ملف Excel صالح (.xlsx أو .xls)');
      input.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت');
      input.value = '';
      return;
    }

    try {
      // إرسال الملف إلى NestJS للمعالجة
      this.apiService.importGradesExcel(file).subscribe({
        next: (response) => {
          console.log('تمت المعالجة في السرفر بنجاح', response);

          if (!response.sheets || response.sheets.length === 0) {
            alert('لا توجد أوراق عمل في ملف Excel');
            input.value = '';
            return;
          }

          // Store available sheets
          this.availableSheets = response.sheets;
          this.selectedSheetIndex = 0;

          // تخزين جميع الأوراق
          this.allSheets = response.sheets;

          // إذا وجدنا أكثر من ورقة، نظهر القائمة للمستخدم
          if (response.sheets.length > 1) {
            this.showSheetSelector = true;
            // لا نعالج أي ورقة تلقائياً - ننتظر اختيار المستخدم
          } else {
            // إذا كانت ورقة واحدة، نعالجها مباشرة
            const firstSheet = response.sheets[0];
            if (!firstSheet.rawData || firstSheet.rawData.length === 0) {
              alert('لا توجد بيانات في ورقة العمل');
              input.value = '';
              return;
            }
            this.processExcelData(firstSheet.rawData);
            input.value = '';
          }
        },
        error: (err) => {
          console.error('خطأ في الرفع', err);
          const errorMessage = err?.error?.message || err?.message || 'حدث خطأ أثناء استيراد البيانات';
          alert(errorMessage);
          input.value = '';
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء رفع الملف');
      input.value = '';
    }
  }

  onSheetSelected(): void {
    if (this.availableSheets.length === 0 || this.selectedSheetIndex < 0 || this.selectedSheetIndex >= this.availableSheets.length) {
      return;
    }

    const selectedSheet = this.availableSheets[this.selectedSheetIndex];
    if (!selectedSheet.rawData || selectedSheet.rawData.length === 0) {
      alert('لا توجد بيانات في ورقة العمل المحددة');
      return;
    }

    this.processExcelData(selectedSheet.rawData);
  }

  // دالة جديدة لاستدعائها عند تغيير الورقة من الواجهة
  onSheetChange(index: string | number): void {
    const sheetIndex = typeof index === 'string' ? parseInt(index, 10) : index;
    
    if (this.allSheets.length === 0 || isNaN(sheetIndex) || sheetIndex < 0 || sheetIndex >= this.allSheets.length) {
      return;
    }

    const selectedSheet = this.allSheets[sheetIndex];
    const selectedData = selectedSheet.rawData;
    if (!selectedData || selectedData.length === 0) {
      alert('لا توجد بيانات في ورقة العمل المحددة');
      return;
    }

    this.processExcelData(selectedData);
    this.showSheetSelector = false; // إخفاء القائمة بعد الاختيار
  }

  processExcelData(data: any[]): void {
    if (!this.selectedClass) {
      alert('يرجى اختيار القسم أولاً');
      return;
    }
    
    console.log('Processing Excel data. Selected class:', this.selectedClass.id, this.selectedClass.name);
    console.log('Current students count:', this.students?.length || 0);
    
    // Ensure students are loaded for the selected class
    if (!this.students || this.students.length === 0) {
      console.warn('No students loaded. Loading students for class:', this.selectedClass.id);
      
      // Load students and wait for the response
      this.apiService.get<Student[]>(`/classes/${this.selectedClass.id}/students`).subscribe({
        next: (students) => {
          this.students = students;
          console.log(`Students loaded: ${students.length}, Class: ${this.selectedClass?.name}`);
          console.log('Sample students:', students.slice(0, 3).map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, idNumber: s.idNumber })));
          
          if (students.length === 0) {
            alert(`لا يوجد تلاميذ في القسم "${this.selectedClass?.name ?? 'غير محدد'}".\n\nيرجى التأكد من:\n1. وجود تلاميذ في القسم المحدد\n2. أن التلاميذ في ملف Excel موجودون في نفس القسم\n3. أن البيانات في ملف Excel تبدأ من السطر رقم 9`);
            return;
          }
          // Now process the Excel data with loaded students
          this.processExcelDataInternal(data);
        },
        error: (error) => {
          console.error('Error loading students:', error);
          // Try fallback
          this.apiService.get<Student[]>('/students').subscribe({
            next: (allStudents) => {
              this.students = allStudents.filter(s => s.classId === this.selectedClass!.id);
              console.log(`Students loaded (fallback): ${this.students.length}, Class: ${this.selectedClass?.name}`);
              console.log('Sample students (fallback):', this.students.slice(0, 3).map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, idNumber: s.idNumber })));
              
              if (this.students.length === 0) {
                alert(`لا يوجد تلاميذ في القسم "${this.selectedClass?.name ?? 'غير محدد'}".\n\nيرجى التأكد من:\n1. وجود تلاميذ في القسم المحدد\n2. أن التلاميذ في ملف Excel موجودون في نفس القسم\n3. أن البيانات في ملف Excel تبدأ من السطر رقم 9`);
                return;
              }
              this.processExcelDataInternal(data).catch(err => {
                console.error('Error processing Excel data:', err);
              });
            },
            error: (error2) => {
              console.error('Error loading students (fallback):', error2);
              alert('حدث خطأ أثناء تحميل التلاميذ. يرجى المحاولة مرة أخرى');
            }
          });
        }
      });
      return;
    }
    
    // Students already loaded, process directly
    console.log('Students already loaded, processing Excel data directly');
    this.processExcelDataInternal(data).catch(err => {
      console.error('Error processing Excel data:', err);
    });
  }

  private async processExcelDataInternal(data: any[]): Promise<void> {
    if (!this.selectedClass) {
      alert('يرجى اختيار القسم أولاً');
      return;
    }
    
    console.log('=== Starting Excel Data Processing ===');
    console.log('Selected class:', this.selectedClass.id, this.selectedClass.name);
    console.log('Students available:', this.students?.length || 0);
    console.log('Excel data rows:', data.length);
    console.log('Sample students:', this.students?.slice(0, 3).map(s => ({ 
      id: s.id, 
      name: `${s.firstName} ${s.lastName}`, 
      idNumber: s.idNumber,
      classId: s.classId 
    })));
    
    // استخدام السطر رقم 8 كصف رأس (index 7 لأن المصفوفات تبدأ من 0)
    const headerRowIndex = 7;
    
    // التحقق من وجود بيانات كافية
    if (data.length <= headerRowIndex) {
      alert(`ملف Excel لا يحتوي على بيانات كافية.\n\nيجب أن يحتوي على:\n- صف رأس في السطر رقم 8\n- بيانات التلاميذ من السطر رقم 9 فما فوق\n\nعدد الأسطر الحالي: ${data.length}`);
      return;
    }

    const headerRow = headerRowIndex;
    const headers = data[headerRow] || [];
    
    // Debug: Log header row and headers
    console.log('Header row index:', headerRow, '(السطر رقم', headerRow + 1, 'في Excel)');
    console.log('Headers found:', headers);
    console.log('Data rows after header:', data.length - headerRow - 1);
    
    // Find identifier columns (name or idNumber)
    let identifierColIndex = -1;
    let lastNameColIndex = -1;
    let firstNameColIndex = -1;
    
    if (this.importIdentifier === 'idNumber') {
      // First, try exact matches (highest priority) - case sensitive for Arabic
      const exactMatches = [
        'رقم التعريف',
        'رقم الهوية',
        'رقم الهوية / الكود',
        'رقم الهوية/الكود',
        'idnumber',
        'id_number',
        'student_id',
        'رقم_التعريف',
        'رقم_الهوية'
      ];
      
      identifierColIndex = headers.findIndex((h: any) => {
        const headerStr = String(h || '').trim();
        const headerStrLower = headerStr.toLowerCase();
        
        // Try exact match (case sensitive for Arabic, case insensitive for English)
        for (const exactMatch of exactMatches) {
          if (exactMatch === headerStr || exactMatch.toLowerCase() === headerStrLower) {
            return true;
          }
        }
        return false;
      });
      
      // If no exact match, try partial matches
      if (identifierColIndex === -1) {
        identifierColIndex = headers.findIndex((h: any) => {
          const headerStr = String(h || '').trim();
          const headerStrLower = headerStr.toLowerCase();
          
          // Skip if header looks like a number (data row, not header)
          if (!isNaN(Number(headerStr)) && headerStr.length > 0) {
            return false;
          }
          
          // Priority 1: Contains "رقم التعريف" or "رقم الهوية" (exact phrase)
          if (headerStr.includes('رقم التعريف') || headerStr.includes('رقم الهوية')) {
            return true;
          }
          
          // Priority 2: Contains both "رقم" and ("هوية" or "تعريف")
          if (headerStr.includes('رقم') && (headerStr.includes('هوية') || headerStr.includes('تعريف'))) {
            return true;
          }
          
          // Priority 3: Contains "id" or "code" (excluding name/id fields)
          if ((headerStrLower.includes('id') || headerStrLower.includes('code') || headerStr.includes('كود')) &&
              !headerStrLower.includes('name') && !headerStr.includes('اسم')) {
            return true;
          }
          
          // Priority 4: Contains "رقم" and "كود"
          if (headerStr.includes('رقم') && headerStr.includes('كود')) {
            return true;
          }
          
          return false;
        });
      }
    } else {
      // البحث عن عمود اللقب (lastName)
      const lastNameKeywords = ['اللقب', 'lastname', 'last_name', 'last name', 'surname', 'اسم العائلة', 'family_name', 'family name'];
      lastNameColIndex = headers.findIndex((h: any) => {
        const headerStr = String(h || '').trim().toLowerCase();
        if (!isNaN(Number(headerStr)) && headerStr.length > 0) {
          return false;
        }
        return lastNameKeywords.some(keyword => headerStr === keyword.toLowerCase() || headerStr.includes(keyword.toLowerCase()));
      });
      
      // البحث عن عمود الاسم (firstName) - اختياري
      const firstNameKeywords = ['الاسم', 'firstname', 'first_name', 'first name', 'name', 'الاسم الأول'];
      firstNameColIndex = headers.findIndex((h: any) => {
        const headerStr = String(h || '').trim().toLowerCase();
        if (!isNaN(Number(headerStr)) && headerStr.length > 0) {
          return false;
        }
        // تجنب عمود اللقب
        if (h === headers[lastNameColIndex]) return false;
        return firstNameKeywords.some(keyword => headerStr === keyword.toLowerCase() || headerStr.includes(keyword.toLowerCase()));
      });
      
      // إذا لم نجد عمود الاسم، نستخدم عمود اللقب فقط
      if (lastNameColIndex !== -1) {
        identifierColIndex = lastNameColIndex;
      } else if (firstNameColIndex !== -1) {
        identifierColIndex = firstNameColIndex;
      }
    }

    if (identifierColIndex === -1) {
      const availableHeaders = headers.filter((h: any) => h).slice(0, 10).map((h: any) => String(h)).join(', ');
      console.error('Could not find identifier column. Headers:', headers);
      alert(this.importIdentifier === 'idNumber' 
        ? `لم يتم العثور على عمود رقم الهوية/الكود في ملف Excel.\n\nصف الرأس: السطر رقم 8\n\nالأعمدة الموجودة: ${availableHeaders}${headers.length > 10 ? '...' : ''}\n\nتأكد من وجود عمود باسم "رقم التعريف" أو "رقم الهوية" أو "رقم الهوية/الكود" في السطر رقم 8`
        : `لم يتم العثور على عمود اللقب في ملف Excel.\n\nصف الرأس: السطر رقم 8\n\nالأعمدة الموجودة: ${availableHeaders}${headers.length > 10 ? '...' : ''}\n\nتأكد من وجود عمود باسم "اللقب" في السطر رقم 8`);
      return;
    }
    
    console.log('Identifier column found at index:', identifierColIndex, 'Header:', headers[identifierColIndex]);
    if (this.importIdentifier === 'name') {
      console.log('Last name column:', lastNameColIndex !== -1 ? headers[lastNameColIndex] : 'not found');
      console.log('First name column:', firstNameColIndex !== -1 ? headers[firstNameColIndex] : 'not found');
    }

    // Determine which assessments to import
    let assessmentsToImport: Assessment[] = [];
    if (this.importMode === 'multiple') {
      // استيراد جميع أنواع التقييم: التقييم المستمر (أولوية)، التعبير الشفهي، الفرض، الاختبار
      const assessmentTypes: AssessmentType[] = ['continuous_assessment', 'oral_expression', 'assignment', 'test'];
      assessmentsToImport = this.assessments.filter(a => assessmentTypes.includes(a.type));
      
      // إعطاء أولوية لـ "التقييم المستمر" - وضعه في البداية
      assessmentsToImport.sort((a, b) => {
        if (a.type === 'continuous_assessment') return -1;
        if (b.type === 'continuous_assessment') return 1;
        return 0;
      });
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
      // إعطاء أولوية لـ "التقييم المستمر" - البحث عنه أولاً
      const sortedAssessments = [...assessmentsToImport].sort((a, b) => {
        if (a.type === 'continuous_assessment') return -1;
        if (b.type === 'continuous_assessment') return 1;
        return 0;
      });
      
      for (const assessment of sortedAssessments) {
        const colIndex = headers.findIndex((h: any) => {
          if (!h || h === '') return false;
          
          const headerStr = String(h).toLowerCase().trim();
          const assessmentNameAr = assessment.nameAr.toLowerCase().trim();
          
          // تطبيع النص العربي للمقارنة
          const normalizedHeader = this.normalizeArabicText(String(h));
          const normalizedAssessment = this.normalizeArabicText(assessment.nameAr);
          
          // البحث المطابق الدقيق للاسم العربي (مع تطبيع)
          if (normalizedHeader === normalizedAssessment) {
            return true;
          }
          
          // البحث المطابق الدقيق للاسم العربي (بدون تطبيع)
          if (headerStr === assessmentNameAr || 
              headerStr.includes(assessmentNameAr) || 
              assessmentNameAr.includes(headerStr)) {
            return true;
          }
          
          // مطابقة جزئية مع تطبيع
          if (normalizedHeader.includes(normalizedAssessment) || 
              normalizedAssessment.includes(normalizedHeader)) {
            return true;
          }
          
          // البحث حسب نوع التقييم - كلمات مفتاحية متعددة
          switch (assessment.type) {
            case 'continuous_assessment':
              // مطابقة جزئية محسّنة للتقييم المستمر
              return headerStr.includes('continuous') || 
                     headerStr.includes('مستمر') || 
                     headerStr.includes('تقييم مستمر') ||
                     headerStr.includes('التقييم المستمر') ||
                     (normalizedHeader.includes('تقييم') && normalizedHeader.includes('مستمر')) ||
                     headerStr.includes('évaluation continue') ||
                     (headerStr.includes('évaluation') && headerStr.includes('continue')) ||
                     (headerStr.includes('تقييم') && headerStr.includes('مستمر'));
            case 'oral_expression':
              return (headerStr.includes('oral') && headerStr.includes('expression')) ||
                     (headerStr.includes('شفهي') && headerStr.includes('تعبير')) ||
                     headerStr.includes('تعبير شفهي') ||
                     headerStr.includes('التعبير الشفهي') ||
                     headerStr.includes('expression orale') ||
                     headerStr.includes('شفهي') ||
                     headerStr.includes('تعبير') ||
                     headerStr.includes('oral') ||
                     headerStr.includes('expression') ||
                     (headerStr.includes('عمل') && headerStr.includes('عملي')) ||
                     headerStr.includes('العمل العملي');
            case 'assignment':
              return headerStr.includes('assignment') || 
                     headerStr.includes('فرض') ||
                     headerStr.includes('الفرض') ||
                     headerStr.includes('معدل الفروض') ||
                     headerStr.includes('معدل فرض') ||
                     headerStr.includes('devoir') ||
                     headerStr === 'فرض' ||
                     headerStr === 'الفرض' ||
                     headerStr === 'معدل الفروض';
            case 'test':
              return headerStr.includes('test') || 
                     headerStr.includes('exam') ||
                     headerStr.includes('اختبار') ||
                     headerStr.includes('الاختبار') ||
                     headerStr.includes('examen') ||
                     headerStr === 'اختبار' ||
                     headerStr === 'الاختبار';
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
        const headerStrings = headers.map((h: any) => String(h || '').toLowerCase().trim());
        const scoreColumns = headerStrings
          .map((headerStr: string, index: number) => {
            // Skip empty headers
            if (!headerStr || headerStr === '') return -1;
            
            // تجنب الأعمدة التي هي معرفات (اسم، رقم، إلخ)
            const isIdentifier = headerStr.includes('name') || 
                                 headerStr.includes('اسم') ||
                                 headerStr.includes('id') ||
                                 headerStr.includes('رقم') ||
                                 headerStr.includes('code') ||
                                 headerStr.includes('كود') ||
                                 headerStr.includes('last') ||
                                 headerStr.includes('first') ||
                                 headerStr.includes('لقب') ||
                                 headerStr.includes('تاريخ') ||
                                 headerStr.includes('date') ||
                                 headerStr.includes('birth') ||
                                 headerStr.includes('الميلاد') ||
                                 headerStr.includes('gender') ||
                                 headerStr.includes('جنس');
            
            if (isIdentifier) return -1;
            
            // Look for score-related keywords
            const isScoreColumn = headerStr.includes('score') || 
                                  headerStr.includes('درجة') ||
                                  headerStr.includes('mark') ||
                                  headerStr.includes('note') ||
                                  headerStr.includes('نقطة') ||
                                  headerStr.includes('point');
            
            // Also accept any numeric column that's not an identifier
            const hasNumbers = /\d/.test(headerStr);
            
            if (isScoreColumn || (!isIdentifier && hasNumbers)) {
              return index;
            }
            return -1;
          })
          .filter((idx: number) => idx !== -1);
        
        // مطابقة الأعمدة مع أنواع التقييم حسب الترتيب
        if (scoreColumns.length > 0) {
          const maxColumns = Math.min(scoreColumns.length, assessmentsToImport.length);
          for (let i = 0; i < maxColumns; i++) {
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
      // استيراد نوع واحد - البحث عن عمود الدرجة مع تحسينات
      const headerStrings = headers.map((h: any) => String(h || '').toLowerCase().trim());
      
      // Try multiple search strategies
      let scoreColIndex = -1;
      
      // Strategy 1: Exact match with assessment name
      if (this.selectedAssessment?.nameAr) {
        const assessmentName = this.selectedAssessment.nameAr.toLowerCase().trim();
        scoreColIndex = headerStrings.findIndex((h: string) => 
          h === assessmentName || 
          h.includes(assessmentName) || 
          assessmentName.includes(h)
        );
      }
      
      // Strategy 2: Generic score keywords
      if (scoreColIndex === -1) {
        const scoreKeywords = ['score', 'درجة', 'mark', 'note', 'note/20', 'درجة/20', 'score/20'];
        for (const keyword of scoreKeywords) {
          scoreColIndex = headerStrings.findIndex((h: string) => h.includes(keyword));
          if (scoreColIndex !== -1) break;
        }
      }
      
      // Strategy 3: Look for any column that doesn't match identifier patterns but contains numbers
      if (scoreColIndex === -1) {
        // Find columns that are not identifiers
        for (let i = 0; i < headers.length; i++) {
          const headerStr = headerStrings[i];
          if (!headerStr) continue;
          
          // Skip identifier columns
          if (headerStr.includes('name') || headerStr.includes('اسم') ||
              headerStr.includes('id') || headerStr.includes('رقم') ||
              headerStr.includes('code') || headerStr.includes('كود') ||
              headerStr.includes('last') || headerStr.includes('first') ||
              headerStr.includes('لقب') || headerStr.includes('تاريخ')) {
            continue;
          }
          
          // If it's not an identifier, it might be a score column
          scoreColIndex = i;
          break;
        }
      }
      
      if (scoreColIndex === -1) {
        alert(`لم يتم العثور على عمود الدرجة في ملف Excel.\n\nالأعمدة الموجودة: ${headers.filter((h: any) => h).slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}\n\nتأكد من وجود عمود باسم "الدرجة" أو "Score" أو اسم التقييم: ${this.selectedAssessment?.nameAr || ''}`);
        return;
      }
      assessmentColumns.push({ assessment: this.selectedAssessment!, colIndex: scoreColIndex });
    }

    if (assessmentColumns.length === 0) {
      const expectedColumns = this.importMode === 'multiple' 
        ? assessmentsToImport.map(a => a.nameAr).join('، ')
        : this.selectedAssessment?.nameAr || 'الدرجة';
      
      // عرض الأعمدة الموجودة في الملف للمساعدة في التشخيص
      const availableHeaders = headers
        .map((h: any, idx: number) => `${idx + 1}. ${String(h || '').trim()}`)
        .filter((h: string) => h && !h.includes('undefined') && !h.includes('null'))
        .slice(0, 10)
        .join('\n');
      
      alert(`لم يتم العثور على أعمدة الدرجات في ملف Excel.\n\nالمتوقع: ${expectedColumns}\n\nتأكد من أن أسماء الأعمدة في ملف Excel تحتوي على:\n${this.importMode === 'multiple' 
        ? '- التقييم المستمر (مطلوب)\n- التعبير الشفهي أو التعبير الشفهي/العمل العملي (اختياري)\n- الفرض أو معدل الفروض\n- الاختبار'
        : '- الدرجة أو Score'}\n\nالأعمدة الموجودة في الملف:\n${availableHeaders || 'لا توجد أعمدة'}`);
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

    // Build lookup maps for fast student matching (O(1) lookups instead of O(n) .find() calls)
    // This dramatically improves performance, especially with large student lists
    this.buildStudentLookupMaps();

    // Process rows with batch processing to avoid UI freezing
    let totalImported = 0;
    let processedCount = 0;
    let failedCount = 0;
    const totalRows = data.length - headerRow - 1;
    const importStats: { [assessmentId: number]: { name: string; count: number } } = {};
    const failedStudents: Array<{ 
      row: number; 
      identifier?: string; 
      lastName?: string; 
      firstName?: string; 
      reason: string;
      className?: string;
    }> = [];
    
    // تهيئة الإحصائيات
    assessmentColumns.forEach(({ assessment }) => {
      importStats[assessment.id] = { name: assessment.nameAr, count: 0 };
    });

    // دالة مساعدة لتنظيف النصوص من أي رموز مخفية أو مسافات
    const clean = (val: any): string => {
      if (val === null || val === undefined || val === '') return '';
      // Convert to string and remove all types of spaces and hidden characters
      return String(val)
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
        .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, '') // Remove all types of spaces
        .trim();
    };

    // معالجة محسّنة: معالجة صف واحد في كل مرة مع تأخير لتجنب تجمد المتصفح
    console.log("🚀 بدء المعالجة المحسنة...");
    
    const rowsToProcess: Array<{ row: any[]; index: number }> = [];
    
    // جمع جميع الصفوف المراد معالجتها (تخطي الصفوف الفارغة تماماً)
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        // التحقق من وجود بيانات فعلية في الصف
        const hasData = row.some((cell: any) => 
          cell !== null && cell !== undefined && cell !== '' && String(cell).trim() !== ''
        );
        if (hasData) {
          rowsToProcess.push({ row, index: i });
        }
      }
    }

    console.log(`📊 عدد الصفوف المراد معالجتها: ${rowsToProcess.length}`);

    // معالجة كل صف على حدة مع تأخير بين كل صف
    for (let idx = 0; idx < rowsToProcess.length; idx++) {
      const { row, index: i } = rowsToProcess[idx];
      
      // السماح للمتصفح بالتنفس لتجنب الـ Timeout (10ms بين كل صف)
      if (idx > 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      try {
        // التحقق من صحة الصف
        if (!row || row.length === 0) continue;

      // Extract identifier from row - handle different data types
      let identifier: string = '';
      let lastName: string = '';
      let firstName: string = '';
      
      if (this.importIdentifier === 'idNumber') {
        const identifierValue = row[identifierColIndex];
        if (identifierValue !== null && identifierValue !== undefined && identifierValue !== '') {
          // Use clean function for thorough cleaning
          identifier = clean(identifierValue);
        }
        
        // Also extract name columns for fallback matching
        if (lastNameColIndex !== -1) {
          const lastNameValue = row[lastNameColIndex];
          if (lastNameValue !== null && lastNameValue !== undefined && lastNameValue !== '') {
            lastName = clean(lastNameValue);
          }
        }
        
        if (firstNameColIndex !== -1) {
          const firstNameValue = row[firstNameColIndex];
          if (firstNameValue !== null && firstNameValue !== undefined && firstNameValue !== '') {
            firstName = clean(firstNameValue);
          }
        }
      } else {
        // استخراج اللقب والاسم
        if (lastNameColIndex !== -1) {
          const lastNameValue = row[lastNameColIndex];
          if (lastNameValue !== null && lastNameValue !== undefined && lastNameValue !== '') {
            lastName = clean(lastNameValue);
          }
        }
        
        if (firstNameColIndex !== -1) {
          const firstNameValue = row[firstNameColIndex];
          if (firstNameValue !== null && firstNameValue !== undefined && firstNameValue !== '') {
            firstName = clean(firstNameValue);
          }
        }
        
        // إذا لم نجد عمود الاسم، نستخدم اللقب فقط
        if (!lastName && !firstName) {
          console.warn(`Empty name at row ${i + 1}`);
          continue;
        }
      }
      
      // Skip rows with empty identifier AND empty name (completely empty row)
      if (this.importIdentifier === 'idNumber' && !identifier && !lastName && !firstName) {
        console.warn(`Empty identifier and name at row ${i + 1} - skipping row`);
        continue;
      }
      
      // If identifier is empty but we have name, we can still try to match by name (fallback)
      // So we don't skip the row in this case - it will be handled in the matching logic below

      // Find student by identifier with flexible text-based comparison
      let student: Student | undefined;
      if (this.importIdentifier === 'idNumber') {
        // Helper function to normalize identifier - more robust cleaning
        const normalizeId = (id: any): string => {
          if (id === null || id === undefined || id === '') return '';
          
          // Convert to string - handle Number, String, and any other type
          let cleanId = String(id);
          
          // Remove ALL types of spaces (regular, non-breaking, zero-width, etc.)
          // This is critical for Excel data which may have hidden characters
          cleanId = cleanId.replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '');
          
          // Trim again after removing all spaces
          cleanId = cleanId.trim();
          
          // Handle scientific notation (e.g., 1.1009161702046e+15)
          if (cleanId.includes('e+') || cleanId.includes('E+')) {
            const num = parseFloat(cleanId);
            if (!isNaN(num)) {
              // Convert to string without scientific notation - use toFixed(0) for large numbers
              if (num > Number.MAX_SAFE_INTEGER) {
                cleanId = num.toFixed(0);
              } else {
                cleanId = Math.floor(num).toString();
              }
            }
          }
          
          // Handle decimal numbers (remove .0 or .00 at the end)
          if (cleanId.includes('.')) {
            const num = parseFloat(cleanId);
            if (!isNaN(num)) {
              cleanId = Math.floor(num).toString();
            } else {
              // If parseFloat fails, just remove trailing zeros after decimal point
              cleanId = cleanId.replace(/\.0+$/, '').replace(/\.$/, '');
            }
          }
          
          // Remove leading zeros (but keep at least one digit if all zeros)
          cleanId = cleanId.replace(/^0+/, '') || '0';
          
          return cleanId;
        };
        
        // Normalize Excel identifier
        const normalizedIdentifier = normalizeId(identifier);
        
        if (!normalizedIdentifier) {
          console.warn(`Empty normalized identifier at row ${i + 1}`);
          continue;
        }
        
        // Use the pre-built lookup maps for O(1) performance
        // Strategy 1: Exact match after normalization (without leading zeros)
        student = this.studentIdLookupMaps?.normalized.get(normalizedIdentifier);
        
        // Strategy 2: Exact match with original formatting (keeping leading zeros and spaces)
        if (!student) {
          // Clean identifier thoroughly before matching
          const excelIdOriginal = String(identifier)
            .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '')
            .trim();
          student = this.studentIdLookupMaps?.original.get(excelIdOriginal);
        }
        
        // Strategy 3: Match without spaces but with original leading zeros
        if (!student) {
          // Remove all types of spaces
          const excelIdNoSpaces = String(identifier)
            .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '')
            .trim();
          student = this.studentIdLookupMaps?.noSpaces.get(excelIdNoSpaces);
        }
        
        // Strategy 4: Match by suffix (last digits) - useful if Excel has extra leading digits
        if (!student && normalizedIdentifier.length >= 10) {
          // Try different suffix lengths
          for (let suffixLen = Math.min(14, normalizedIdentifier.length); suffixLen >= 10; suffixLen--) {
            const excelSuffix = normalizedIdentifier.slice(-suffixLen);
            student = this.studentIdLookupMaps?.suffixMap.get(excelSuffix);
            if (student) break;
          }
        }
        
        // Strategy 5: Match by prefix (first digits) - useful if Excel has extra trailing digits
        if (!student && normalizedIdentifier.length >= 10) {
          // Try different prefix lengths
          for (let prefixLen = Math.min(14, normalizedIdentifier.length); prefixLen >= 10; prefixLen--) {
            const excelPrefix = normalizedIdentifier.slice(0, prefixLen);
            student = this.studentIdLookupMaps?.prefixMap.get(excelPrefix);
            if (student) break;
          }
        }
        
        // Strategy 6: Match by middle part (skip first/last few digits) - useful for format differences
        if (!student && normalizedIdentifier.length >= 12) {
          // Try matching middle 10-12 digits
          const startSkip = Math.floor((normalizedIdentifier.length - 12) / 2);
          const middlePart = normalizedIdentifier.slice(startSkip, startSkip + 12);
          student = this.studentIdLookupMaps?.middleMap.get(middlePart);
        }
        
        // Strategy 7: Try matching with leading zeros added back (in case Excel removed them)
        // This is a fallback that tries common ID lengths (14, 15, 16 digits)
        if (!student && normalizedIdentifier.length >= 10 && normalizedIdentifier.length < 16) {
          for (let targetLength = 16; targetLength >= 14; targetLength--) {
            const paddedId = normalizedIdentifier.padStart(targetLength, '0');
            student = this.studentIdLookupMaps?.normalized.get(paddedId);
            if (student) break;
            
            // Also try with original map
            student = this.studentIdLookupMaps?.original.get(paddedId);
            if (student) break;
          }
        }
        
        // Strategy 8: Direct string comparison after thorough cleaning
        // This handles cases where the lookup maps missed due to formatting differences
        if (!student) {
          // Clean the Excel identifier thoroughly
          const excelIdCleaned = String(identifier)
            .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '')
            .trim();
          
          // Try direct match with cleaned original IDs (only for first few failures to avoid performance impact)
          if (failedCount < 5) {
            for (const s of this.students) {
              if (!s.idNumber) continue;
              const dbIdCleaned = String(s.idNumber)
                .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '')
                .trim();
              
              if (excelIdCleaned === dbIdCleaned) {
                student = s;
                break;
              }
            }
          }
        }
        
        // Strategy 9: Try reverse lookup - check if Excel ID is contained in any student's ID or vice versa
        // This handles cases where Excel has a subset/superset of the full ID
        if (!student && normalizedIdentifier.length >= 10) {
          // Only do this as a last resort since it requires iteration
          // But limit to first few failures to avoid performance impact
          if (failedCount < 10) {
            student = this.students.find(s => {
              if (!s.idNumber) return false;
              const dbNormalized = normalizeId(s.idNumber);
              if (!dbNormalized) return false;
              
              // Check if one contains the other (handles partial matches)
              if (dbNormalized.length >= 10 && normalizedIdentifier.length >= 10) {
                // Try matching last 10-14 digits (most significant part)
                const minLen = Math.min(dbNormalized.length, normalizedIdentifier.length, 14);
                const dbSuffix = dbNormalized.slice(-minLen);
                const excelSuffix = normalizedIdentifier.slice(-minLen);
                if (dbSuffix === excelSuffix) return true;
                
                // Try matching first 10-14 digits
                const dbPrefix = dbNormalized.slice(0, minLen);
                const excelPrefix = normalizedIdentifier.slice(0, minLen);
                if (dbPrefix === excelPrefix) return true;
              }
              
              // Fallback: check if one is contained in the other
              return dbNormalized.includes(normalizedIdentifier) || 
                     normalizedIdentifier.includes(dbNormalized);
            });
          }
        }
        
        // Strategy 10: Fallback - إذا فشلت المطابقة برقم التعريف، جرب المطابقة بالاسم واللقب
        if (!student && (lastName || firstName)) {
          // محاولة إضافية: البحث عن طريق الاسم إذا فشل المعرف
          const searchLastName = this.normalizeArabicText(lastName);
          const searchFirstName = this.normalizeArabicText(firstName);
          
          // Try matching by full name (lastName + firstName)
          if (searchLastName && searchFirstName) {
            const fullNameKey = `${searchLastName}|${searchFirstName}`;
            student = this.studentNameLookupMap?.get(fullNameKey);
          }
          
          // Try matching by lastName only
          if (!student && searchLastName) {
            student = this.studentNameLookupMap?.get(searchLastName);
          }
          
          // Try partial name matching as last resort
          if (!student && searchLastName && searchFirstName) {
            student = this.students.find(s => {
              const sLastName = this.normalizeArabicText(s.lastName || '');
              const sFirstName = this.normalizeArabicText(s.firstName || '');
              return (sLastName.includes(searchLastName) || searchLastName.includes(sLastName)) &&
                     (sFirstName.includes(searchFirstName) || searchFirstName.includes(sFirstName));
            });
          }
          
          // Try matching by lastName only (partial)
          if (!student && searchLastName) {
            student = this.students.find(s => {
              const sLastName = this.normalizeArabicText(s.lastName || '');
              return sLastName.includes(searchLastName) || searchLastName.includes(sLastName);
            });
          }
          
          // لا نطبع سجلات Console هنا لتقليل الحمل - سيتم تسجيلها في failedStudents
        }
      } else {
        // البحث بالاسم: مطابقة اللقب والاسم مع تطبيع النص العربي
        const searchLastName = this.normalizeArabicText(lastName);
        const searchFirstName = this.normalizeArabicText(firstName);
        
        // Strategy 1: مطابقة كاملة للقب والاسم (مع تطبيع) - use lookup map for O(1)
        if (searchLastName && searchFirstName) {
          const fullNameKey = `${searchLastName}|${searchFirstName}`;
          student = this.studentNameLookupMap?.get(fullNameKey);
        }
        
        // Strategy 2: مطابقة اللقب فقط (إذا لم يكن هناك عمود اسم) - use lookup map
        if (!student && searchLastName) {
          student = this.studentNameLookupMap?.get(searchLastName);
        }
        
        // Strategy 3-5: Partial matches - still need to iterate but only if exact match failed
        // This is less common, so the performance impact is acceptable
        if (!student && searchLastName && searchFirstName) {
          // Strategy 3: مطابقة جزئية للقب والاسم (مع تطبيع)
          student = this.students.find(s => {
            const sLastName = this.normalizeArabicText(s.lastName || '');
            const sFirstName = this.normalizeArabicText(s.firstName || '');
            return (sLastName.includes(searchLastName) || searchLastName.includes(sLastName)) &&
                   (sFirstName.includes(searchFirstName) || searchFirstName.includes(sFirstName));
          });
        }
        
        // Strategy 4: مطابقة جزئية للقب فقط (مع تطبيع)
        if (!student && searchLastName) {
          student = this.students.find(s => {
            const sLastName = this.normalizeArabicText(s.lastName || '');
            return sLastName.includes(searchLastName) || searchLastName.includes(sLastName);
          });
        }
        
        // Strategy 5: مطابقة جزئية للاسم فقط (للأسماء المركبة مثل "أكرم عبد المنعم")
        if (!student && searchFirstName) {
          student = this.students.find(s => {
            const sFirstName = this.normalizeArabicText(s.firstName || '');
            if (sFirstName.includes(searchFirstName) || searchFirstName.includes(sFirstName)) {
              if (searchLastName) {
                const sLastName = this.normalizeArabicText(s.lastName || '');
                return sLastName.includes(searchLastName) || searchLastName.includes(sLastName);
              }
              return true;
            }
            return false;
          });
        }
        
        // Debug logging (only log failures, not every success to reduce console noise)
        // Only log first few failures to avoid performance impact
        if (!student && failedCount < 3) {
          console.warn(`❌ Student not found for name: lastName="${lastName}", firstName="${firstName}" at row ${i + 1}`);
        }
      }

      if (!student) {
        // تحديد سبب الفشل
        let reason = this.importIdentifier === 'idNumber' 
          ? 'رقم التعريف غير موجود في هذه الفئة'
          : 'الاسم غير موجود في هذه الفئة';
        
        // إذا كان البحث برقم التعريف وفشل، حاول التحقق من وجوده في فئات أخرى
        if (this.importIdentifier === 'idNumber' && identifier) {
          // تبسيط: التحقق من وجود الرقم في أي فئة (بدون normalizeId لأننا خارج نطاقه)
          const existsInOtherClasses = this.students.some(s => {
            if (!s.idNumber) return false;
            // مقارنة بسيطة بعد التنظيف
            const sIdCleaned = String(s.idNumber).replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '').trim();
            const excelIdCleaned = String(identifier).replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '').trim();
            return sIdCleaned === excelIdCleaned && s.classId !== this.selectedClass!.id;
          });
          
          if (existsInOtherClasses) {
            reason = 'الطالب موجود في فئة أخرى غير المحددة حالياً';
          } else if (lastName || firstName) {
            reason = 'رقم التعريف غير موجود - تمت محاولة المطابقة بالاسم أيضاً ولكن لم يتم العثور على الطالب';
          }
        } else if (lastName || firstName && this.importIdentifier !== 'idNumber') {
          reason = 'الاسم غير موجود في هذه الفئة';
        }
        
        // تسجيل الطلاب الذين لم يتم العثور عليهم مع السبب
        const failedStudent = {
          row: i + 1,
          ...(this.importIdentifier === 'idNumber' ? { identifier } : {}),
          ...(lastName ? { lastName } : {}),
          ...(firstName ? { firstName } : {}),
          reason: reason,
          className: this.selectedClass?.name || 'غير محدد'
        };
        failedStudents.push(failedStudent);
        
        // تسجيل تفصيلي في Console (فقط للطلاب الفاشلين - لتقليل الحمل)
        if (failedCount < 10) { // تقليل السجلات لتقليل الحمل
          const identifierDisplay = this.importIdentifier === 'idNumber' 
            ? identifier 
            : `اللقب: ${lastName}${firstName ? `, الاسم: ${firstName}` : ''}`;
          console.warn(`❌ لم يتم العثور على: ${lastName || ''} ${firstName || ''} - رقم التعريف: ${identifier || 'غير موجود'} (السطر ${i + 1}) - السبب: ${reason}`);
        }
        
        failedCount++;
        continue;
      }

        // Import grades for each assessment
        // Track if continuous assessment was imported for this student
        let continuousAssessmentImported = false;
        
        for (const { assessment, colIndex } of assessmentColumns) {
          const scoreValue = row[colIndex];
          if (scoreValue === null || scoreValue === undefined || scoreValue === '') continue;
          
          const score = parseFloat(String(scoreValue).replace(',', '.'));
          if (isNaN(score)) continue;

          // Track if continuous assessment was imported
          if (assessment.type === 'continuous_assessment') {
            continuousAssessmentImported = true;
          }

          const gradeData: CreateGradeDto = {
            studentId: student.id,
            assessmentId: assessment.id,
            classId: this.selectedClass.id,
            term: this.selectedTerm,
            score: score,
            maxScore: assessment.maxScore,
            date: this.formatDateForAPI(this.selectedDate)
          };

          try {
            // استخدام Promise بدلاً من subscribe لتجنب تجمد المتصفح
            await firstValueFrom(this.apiService.post<Grade>('/grades', gradeData));
            totalImported++;
            importStats[assessment.id].count++;
            processedCount++;
          } catch (error) {
            const identifierDisplay = this.importIdentifier === 'idNumber' 
              ? identifier 
              : `اللقب: ${lastName}${firstName ? `, الاسم: ${firstName}` : ''}`;
            console.error(`Error importing grade for ${identifierDisplay} (${assessment.nameAr}):`, error);
            failedCount++;
            processedCount++;
          }
        }
        
        // لا نقوم بتحديث الواجهة هنا - سيتم التحديث مرة واحدة في النهاية
      
        // Store student ID for later calculation if continuous assessment was not imported
        if (!continuousAssessmentImported && this.importMode === 'multiple') {
          // This will be handled after all imports complete
        }
      } catch (err) {
        console.error(`خطأ في معالجة صف ${i + 1}:`, err);
        failedCount++;
      }
    }
    
    // بعد اكتمال جميع الاستيرادات
    const totalExpected = rowsToProcess.length * assessmentColumns.length;
    const successRate = totalExpected > 0 ? ((totalImported / totalExpected) * 100).toFixed(1) : '0';
    console.log(`✅ اكتمل الاستيراد: ${totalImported} من أصل ${totalExpected} (${successRate}%)`);
    
      // استخدام requestAnimationFrame لتحديث الواجهة مرة واحدة فقط في النهاية
      requestAnimationFrame(() => {
        this.isProcessing = false;
        this.cdr.detectChanges(); // تحديث الواجهة مرة واحدة فقط
        
        // إعادة تحميل الدرجات بعد الانتهاء من جميع الاستيرادات
        this.loadGradesForClass(this.selectedClass!.id);
        
        // حساب التقييم المستمر بعد إعادة التحميل - مع تأخير أطول لضمان اكتمال التحميل
        setTimeout(() => {
          // إعادة حساب التقييم المستمر لجميع الطلاب (بما في ذلك الذين تم استيراد درجاتهم)
          this.recalculateContinuousAssessmentForAllStudents();
        }, 2000);
      });

    // Wait a bit before showing the alert to allow requests to complete
    setTimeout(() => {
      const totalRowsProcessed = rowsToProcess.length;
      let message = '';
      
      // رسالة النجاح المحسّنة
      if (parseFloat(successRate) === 100) {
        message = `✅ تم استيراد درجات جميع الطلاب (${totalRowsProcessed}) بنجاح تام!\n\n`;
      } else if (totalImported > 0) {
        message = `✅ تم استيراد ${totalImported} درجة بنجاح من ${totalRowsProcessed} طالب (${successRate}%)\n\n`;
      } else {
        message = `⚠️ لم يتم استيراد أي درجات\n\n`;
      }
      
      if (this.importMode === 'multiple' && assessmentColumns.length > 1) {
        message += 'التفاصيل:\n';
        Object.values(importStats).forEach(stat => {
          if (stat.count > 0) {
            message += `- ${stat.name}: ${stat.count} درجة\n`;
          }
        });
        message += '\n';
      }
      
      if (failedCount > 0) {
        message += `⚠️ ملاحظة: فشل استيراد ${failedCount} صف\n\n`;
        message += `الأسباب المحتملة:\n`;
        message += `- التلميذ غير موجود في القسم المحدد\n`;
        message += `- رقم الهوية أو الاسم غير متطابق\n`;
        message += `- البيانات في ملف Excel تبدأ من السطر رقم 9\n\n`;
        message += `يرجى التحقق من console للمزيد من التفاصيل`;
        
        // عرض قائمة بالطلاب الذين فشل استيرادهم
        if (failedStudents.length > 0) {
          console.error('=== قائمة الطلاب الذين لم يتم العثور عليهم ===');
          failedStudents.forEach(failed => {
            const nameDisplay = failed.lastName || failed.firstName 
              ? `${failed.lastName || ''} ${failed.firstName || ''}`.trim()
              : 'غير محدد';
            const idDisplay = failed.identifier || 'غير موجود';
            const display = `السطر ${failed.row}: ${nameDisplay} - رقم التعريف: ${idDisplay} - السبب: ${failed.reason} - الفئة المحددة: ${failed.className}`;
            console.error(`❌ ${display}`);
          });
          
          // إضافة معلومات إضافية في رسالة Alert
          if (failedStudents.length <= 10) {
            const failedDetails = failedStudents.map(f => {
              const name = f.lastName || f.firstName ? `${f.lastName || ''} ${f.firstName || ''}`.trim() : 'غير محدد';
              return `السطر ${f.row}: ${name} - ${f.reason}`;
            }).join('\n');
            message += `\n\nالطلاب الذين لم يتم العثور عليهم:\n${failedDetails}`;
          } else {
            const failedDetails = failedStudents.slice(0, 10).map(f => {
              const name = f.lastName || f.firstName ? `${f.lastName || ''} ${f.firstName || ''}`.trim() : 'غير محدد';
              return `السطر ${f.row}: ${name} - ${f.reason}`;
            }).join('\n');
            message += `\n\nالطلاب الذين لم يتم العثور عليهم (أول 10):\n${failedDetails}`;
            message += `\n\n(عرض أول 10 طلاب فقط - راجع Console للقائمة الكاملة)`;
          }
        }
      }
      
      console.log('=== Import Summary ===');
      console.log(`Total imported: ${totalImported}`);
      console.log(`Failed rows: ${failedCount}`);
      console.log(`Total rows processed: ${totalRows}`);
      console.log(`Assessment columns found: ${assessmentColumns.length}`);
      console.log(`Success rate: ${successRate}%`);
      
      if (parseFloat(successRate) === 100) {
        console.log(`✅ تم استيراد درجات جميع الطلاب (${totalRowsProcessed}) بنجاح تام!`);
      } else if (totalImported > 0) {
        console.log(`✅ تم استيراد ${totalImported} درجة بنجاح من ${totalRowsProcessed} طالب (${successRate}%)`);
      }
      
      alert(message || 'تمت العملية');
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
    this.availableSheets = [];
    this.selectedSheetIndex = 0;
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

  async exportToExcel(): Promise<void> {
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

    // إرسال البيانات إلى NestJS للتصدير
    if (!this.selectedClass) {
      alert('يرجى اختيار قسم أولاً');
      return;
    }

    try {
      this.apiService.exportGradesExcel(this.selectedClass.id, excelData).subscribe({
        next: (blob: Blob) => {
          // Generate filename
          const className = this.selectedClass?.name || 'غير_محدد';
          const fileName = `سجل_الدرجات_${className}_${new Date().toISOString().split('T')[0]}.xlsx`;

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting to Excel:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تصدير البيانات إلى Excel';
          alert(errorMessage);
        }
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء تصدير البيانات إلى Excel');
    }
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
    this.updateAutoGenerateOptions();
  }

  onLevelChange(): void {
    this.updateAutoGenerateOptions();
  }

  private updateAutoGenerateOptions(): void {
    // تعيين خيارات التوليد التلقائي حسب المستوى
    if (this.selectedLevel === 'middle') {
      // للطور المتوسط: تطبيق الملاحظات فقط دون الإرشادات
      this.autoGenerateObsOnly = true;
      this.autoGenerateObsCons = false;
    } else {
      // للمستويات الأخرى: تطبيق الملاحظات والإرشادات معاً
      this.autoGenerateObsCons = true;
      this.autoGenerateObsOnly = false;
    }
  }

  closeEnhancedImportModal(): void {
    this.showEnhancedImportModal = false;
    this.isProcessing = false;
  }

  async onEnhancedExcelFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      alert('يرجى اختيار ملف Excel صالح (.xlsx أو .xls)');
      input.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت');
      input.value = '';
      return;
    }

    this.isProcessing = true;
    this.processedSheetsData = [];

    try {
      // إرسال الملف إلى NestJS للمعالجة
      this.apiService.importGradesExcel(file).subscribe({
        next: (response) => {
          console.log('تمت المعالجة في السرفر بنجاح', response);

          if (!response.sheets || response.sheets.length === 0) {
            alert('لا توجد أوراق عمل في ملف Excel');
            input.value = '';
            this.isProcessing = false;
            return;
          }

          // حفظ اسم الملف الأصلي
          this.originalFileName = file.name;
          
          // Process all sheets
          let totalProcessed = 0;
          const allProcessedData: any[] = [];
          
          for (const sheetInfo of response.sheets) {
            const sheetName = sheetInfo.sheetName;
            const jsonData = sheetInfo.rawData;
            
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
          input.value = '';
        },
        error: (err) => {
          console.error('خطأ في الرفع', err);
          const errorMessage = err?.error?.message || err?.message || 'حدث خطأ أثناء استيراد البيانات';
          alert(errorMessage);
          this.isProcessing = false;
          input.value = '';
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء رفع الملف');
      this.isProcessing = false;
      input.value = '';
    }
  }

  processEnhancedExcelData(data: any[], sheetName?: string): any[] {
    if (!data || data.length === 0) {
      alert('الملف فارغ أو غير صحيح');
      return [];
    }

    // Find header row - يمكن أن يكون في السطر 8 أو 9 أو 10 أو قبل ذلك
    let headerRow = 0;
    // البحث في أول 15 سطر للسماح بوجود رؤوس في السطر 8 أو 9 أو 10
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some((cell: any) => {
        const cellStr = String(cell || '').toLowerCase();
        return cellStr.includes('name') || 
               cellStr.includes('اسم') || 
               cellStr.includes('nom') ||
               cellStr.includes('score') ||
               cellStr.includes('درجة') ||
               cellStr.includes('note') ||
               cellStr.includes('mark') ||
               cellStr.includes('obs') ||
               cellStr.includes('ملاحظات') ||
               cellStr.includes('cons') ||
               cellStr.includes('إرشادات') ||
               cellStr.includes('observation') ||
               cellStr.includes('guidance');
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
      } else if (this.autoGenerateObsOnly) {
        // Generate observations only, no guidance
        observation = this.generateObservation(average, this.selectedLevel, this.selectedLanguage);
        guidance = ''; // Leave guidance empty
      } else {
        // Read from Excel file if columns exist, otherwise generate automatically
        let observationRead = false;
        let guidanceRead = false;
        
        if (observationColIndex !== -1) {
          const obsValue = row[observationColIndex];
          // Check if value exists and is not empty
          if (obsValue !== undefined && obsValue !== null) {
            const obsStr = String(obsValue).trim();
            if (obsStr !== '' && obsStr !== '-' && obsStr.toLowerCase() !== 'null' && obsStr.toLowerCase() !== 'undefined') {
              observation = obsStr;
              observationRead = true;
              // Debug log for first row
              if (processedData.length === 0) {
                console.log('✓ Reading observation from Excel:', observation, 'from column index:', observationColIndex, 'Raw value:', obsValue);
              }
            } else if (processedData.length === 0) {
              console.log('✗ Observation column found but value is empty. Will generate automatically.');
            }
          } else if (processedData.length === 0) {
            console.log('✗ Observation column found but value is null/undefined. Will generate automatically.');
          }
        } else if (processedData.length === 0) {
          console.log('✗ Observation column not found in Excel file. Will generate automatically.');
        }
        
        if (guidanceColIndex !== -1) {
          const consValue = row[guidanceColIndex];
          // Check if value exists and is not empty
          if (consValue !== undefined && consValue !== null) {
            const consStr = String(consValue).trim();
            if (consStr !== '' && consStr !== '-' && consStr.toLowerCase() !== 'null' && consStr.toLowerCase() !== 'undefined') {
              guidance = consStr;
              guidanceRead = true;
              // Debug log for first row
              if (processedData.length === 0) {
                console.log('✓ Reading guidance from Excel:', guidance, 'from column index:', guidanceColIndex, 'Raw value:', consValue);
              }
            } else if (processedData.length === 0) {
              console.log('✗ Guidance column found but value is empty. Will generate automatically.');
            }
          } else if (processedData.length === 0) {
            console.log('✗ Guidance column found but value is null/undefined. Will generate automatically.');
          }
        } else if (processedData.length === 0) {
          console.log('✗ Guidance column not found in Excel file. Will generate automatically.');
        }
        
        // إذا لم نتمكن من قراءة البيانات من الملف (لأنها فارغة أو غير موجودة)، نولدها تلقائياً
        if (!observationRead) {
          observation = this.generateObservation(average, this.selectedLevel, this.selectedLanguage);
        }
        if (!guidanceRead) {
          guidance = this.generateGuidance(average, this.selectedLevel, this.selectedLanguage);
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

  async downloadProcessedExcel(): Promise<void> {
    if (!this.processedExcelData || this.processedExcelData.length === 0) {
      alert('لا توجد بيانات للتحميل');
      return;
    }

    // إذا كان لدينا اسم ملف Excel الأصلي، يمكن استخدام الطريقة مع الحفاظ على البنية
    // لكن نحتاج إلى الملف الأصلي نفسه، لذا سنستخدم الطريقة العادية

    try {
      const gradeErrors = this.getStudentsWithGradeErrors();

      // إرسال البيانات إلى NestJS للتصدير
      this.apiService.exportProcessedExcel({
        processedExcelData: this.processedExcelData,
        processedSheetsData: this.processedSheetsData,
        gradeErrors: gradeErrors,
        selectedLanguage: this.selectedLanguage,
        selectedLevel: this.selectedLevel
      }).subscribe({
        next: (blob: Blob) => {
          const levelNames: { [key: string]: string } = {
            'primary': 'ابتدائي',
            'middle': 'متوسط',
            'secondary': 'ثانوي'
          };
          const levelName = levelNames[this.selectedLevel] || 'غير محدد';
          const fileName = `النتائج_المعالجة_${levelName}_${new Date().toISOString().split('T')[0]}.xlsx`;

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting processed Excel:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تصدير البيانات';
          alert(errorMessage);
        }
      });
    } catch (error) {
      console.error('Error exporting processed Excel:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    }
  }

  // Old implementation removed - now handled by Backend

  async downloadProcessedExcelWithOriginalStructure(originalFile?: File): Promise<void> {
    if (!originalFile && !this.originalFileName) {
      alert('لا يوجد ملف Excel أصلي. يرجى رفع الملف الأصلي مرة أخرى');
      return;
    }

    // إذا لم يكن الملف متوفراً، نطلب من المستخدم رفعه
    if (!originalFile) {
      // يمكن إضافة UI لرفع الملف هنا
      alert('يرجى رفع الملف الأصلي مرة أخرى');
      return;
    }

    try {
      // إرسال الملف الأصلي والبيانات المعالجة إلى NestJS
      this.apiService.exportProcessedExcelWithOriginalStructure(originalFile, {
        processedSheetsData: this.processedSheetsData,
        selectedLanguage: this.selectedLanguage,
        originalFileName: this.originalFileName || originalFile.name
      }).subscribe({
        next: (blob: Blob) => {
          let fileName = 'ملف_مملوء.xlsx';
          if (this.originalFileName) {
            const nameWithoutExt = this.originalFileName.replace(/\.(xlsx|xls)$/i, '');
            fileName = `${nameWithoutExt}_مملوء.xlsx`;
          } else if (originalFile.name) {
            const nameWithoutExt = originalFile.name.replace(/\.(xlsx|xls)$/i, '');
            fileName = `${nameWithoutExt}_مملوء.xlsx`;
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting processed Excel with original structure:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تصدير البيانات';
          alert(errorMessage);
        }
      });
    } catch (error) {
      console.error('Error exporting processed Excel with original structure:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    }
  }

  // Old implementation removed - now handled by Backend

  // Excel Analysis Functions
  onExcelAnalysisTabClick(): void {
    this.viewMode = 'excelAnalysis';
    // Update charts when switching to analysis tab
    setTimeout(() => {
      this.updateExcelAnalysisCharts();
      this.cdr.detectChanges();
    }, 100);
  }

  onTotalExcelAnalysisTabClick(): void {
    this.viewMode = 'totalExcelAnalysis';
    this.totalAnalysisActiveTab = 'results';
    // Update charts when switching to total analysis tab
    setTimeout(() => {
      this.updateTotalExcelAnalysisCharts();
      this.cdr.detectChanges();
    }, 100);
  }

  onTotalAnalysisTabChange(tab: 'results' | 'count' | 'classification' | 'monitoring'): void {
    this.totalAnalysisActiveTab = tab;
    // Update charts when switching tabs
    setTimeout(() => {
      if (tab === 'results') {
        this.updateTotalAverageDistributionChart();
      } else if (tab === 'classification') {
        this.updateTotalClassificationChart();
      }
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

  // =================== Student Hover Card Methods ===================

  showStudentHoverCard(student: Student & { councilRecord?: CouncilSemesterRecord }, event?: MouseEvent): void {
    this.hoveredStudent = student;

    // Calculate position for the hover card
    if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const cardWidth = 320; // w-80 = 320px
      const cardHeight = 200; // approximate height

      // Use page offsets to account for zoom levels
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

      let left = rect.right + scrollLeft + 10; // Position to the right of the image
      let top = rect.top + scrollTop; // Align with the top of the image

      // Ensure the card stays within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if it goes off-screen (prefer left side if right side doesn't fit)
      if (left + cardWidth > viewportWidth + scrollLeft) {
        left = rect.left + scrollLeft - cardWidth - 10; // Show on the left side
      }
      if (left < scrollLeft + 10) {
        left = scrollLeft + 10;
      }

      // Adjust vertical position if it goes off-screen
      if (top + cardHeight > viewportHeight + scrollTop) {
        top = viewportHeight + scrollTop - cardHeight - 10; // Move up to fit in viewport
      }

      this.hoverCardPosition = {
        top: top,
        left: left
      };
    }

    // Load student attendance and behavior data
    this.loadStudentAttendanceSummary(student.id);
    this.loadStudentBehaviorSummary(student.id);
  }

  hideStudentHoverCard(): void {
    this.hoveredStudent = null;
    this.hoverCardPosition = null;
    this.studentAttendanceSummary = null;
    this.studentBehaviorSummary = null;
  }

  private loadStudentAttendanceSummary(studentId: number): void {
    // Load attendance records for the current term/class
    this.apiService.get<any[]>(`/attendance?studentId=${studentId}&classId=${this.councilSelectedClass?.id}`).subscribe({
      next: (records) => {
        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        this.studentAttendanceSummary = {
          present: presentDays,
          total: totalDays,
          percentage: percentage
        };
      },
      error: (error) => {
        console.error('Error loading attendance summary:', error);
        this.studentAttendanceSummary = { present: 0, total: 0, percentage: 0 };
      }
    });
  }

  private loadStudentBehaviorSummary(studentId: number): void {
    // Load behavior events for the current term/class
    this.apiService.get<any[]>(`/behavior-events?studentId=${studentId}&classId=${this.councilSelectedClass?.id}`).subscribe({
      next: (events) => {
        // Calculate behavior rating based on events (simplified logic)
        let rating = 3; // Default neutral rating

        if (events.length > 0) {
          const positiveEvents = events.filter(e => e.behaviorType === 'positive').length;
          const negativeEvents = events.filter(e => e.behaviorType === 'negative').length;

          if (positiveEvents > negativeEvents) {
            rating = Math.min(5, 3 + Math.floor((positiveEvents - negativeEvents) / 2));
          } else if (negativeEvents > positiveEvents) {
            rating = Math.max(1, 3 - Math.floor((negativeEvents - positiveEvents) / 2));
          }
        }

        this.studentBehaviorSummary = {
          rating: rating,
          events: events
        };
      },
      error: (error) => {
        console.error('Error loading behavior summary:', error);
        this.studentBehaviorSummary = { rating: 3, events: [] };
      }
    });
  }

  // =================== Search Getters ===================

  get filteredCouncilStudents(): (Student & { councilRecord?: CouncilSemesterRecord })[] {
    if (!this.councilStudentSearch.trim()) {
      return this.councilStudentsWithRecords;
    }

    const searchTerm = this.councilStudentSearch.toLowerCase();
    return this.councilStudentsWithRecords.filter(student =>
      student.firstName?.toLowerCase().includes(searchTerm) ||
      student.lastName?.toLowerCase().includes(searchTerm) ||
      student.idNumber?.toLowerCase().includes(searchTerm)
    );
  }

  // Total Excel Analysis Functions
  calculateTotalAverage(): number {
    if (!this.processedSheetsData || this.processedSheetsData.length === 0) return 0;
    let totalSum = 0;
    let totalCount = 0;
    this.processedSheetsData.forEach(sheetInfo => {
      sheetInfo.data.forEach(row => {
        if (row.average) {
          totalSum += row.average;
          totalCount++;
        }
      });
    });
    return totalCount > 0 ? totalSum / totalCount : 0;
  }

  getTotalStudentsAbove10(): number {
    if (!this.processedSheetsData) return 0;
    let count = 0;
    this.processedSheetsData.forEach(sheetInfo => {
      count += this.getStudentsAbove10Count(sheetInfo.data);
    });
    return count;
  }

  getTotalStudentsBelow10(): number {
    if (!this.processedSheetsData) return 0;
    let count = 0;
    this.processedSheetsData.forEach(sheetInfo => {
      count += this.getStudentsBelow10Count(sheetInfo.data);
    });
    return count;
  }

  getTotalStudentsCount(): number {
    if (!this.processedSheetsData) return 0;
    return this.processedSheetsData.reduce((sum, sheetInfo) => sum + sheetInfo.data.length, 0);
  }

  getTotalSectionsCount(): number {
    return this.processedSheetsData ? this.processedSheetsData.length : 0;
  }

  getCountByRange(data: any[], min: number, max: number): number {
    if (!data) return 0;
    return data.filter(row => {
      const avg = row.average || 0;
      if (max === 21) return avg >= min;
      return avg >= min && avg < max;
    }).length;
  }

  getTotalCountByRange(min: number, max: number): number {
    if (!this.processedSheetsData) return 0;
    let count = 0;
    this.processedSheetsData.forEach(sheetInfo => {
      count += this.getCountByRange(sheetInfo.data, min, max);
    });
    return count;
  }

  getClassificationCount(data: any[], type: 'congratulations' | 'encouragement' | 'honorRoll' | 'none' | 'remarks'): number {
    if (!data) return 0;
    const dist = this.getGradeRangeDistributionForSheet(data);
    switch (type) {
      case 'congratulations': return dist.congratulations;
      case 'encouragement': return dist.encouragement;
      case 'honorRoll': return dist.honorRoll;
      case 'none': return dist.none;
      case 'remarks': return dist.remarks;
      default: return 0;
    }
  }

  getTotalClassificationCount(type: 'congratulations' | 'encouragement' | 'honorRoll' | 'none' | 'remarks'): number {
    if (!this.processedSheetsData) return 0;
    let count = 0;
    this.processedSheetsData.forEach(sheetInfo => {
      count += this.getClassificationCount(sheetInfo.data, type);
    });
    return count;
  }

  getStatusClass(data: any[]): string {
    const successRate = (this.getStudentsAbove10Count(data) / data.length) * 100;
    if (successRate >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (successRate >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }

  getStatusText(data: any[]): string {
    const successRate = (this.getStudentsAbove10Count(data) / data.length) * 100;
    if (successRate >= 80) return 'ممتاز';
    if (successRate >= 60) return 'جيد';
    return 'يحتاج تحسين';
  }

  updateTotalExcelAnalysisCharts(): void {
    if (!this.processedSheetsData || this.processedSheetsData.length === 0) return;
    
    setTimeout(() => {
      // Update average distribution chart
      this.updateTotalAverageDistributionChart();
      // Update classification chart
      this.updateTotalClassificationChart();
    }, 200);
  }

  updateTotalAverageDistributionChart(): void {
    const ctx = document.getElementById('totalAverageDistributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    const stats = {
      lessThan4: this.getTotalCountByRange(0, 4),
      between4and6: this.getTotalCountByRange(4, 6),
      between6and8: this.getTotalCountByRange(6, 8),
      between8and10: this.getTotalCountByRange(8, 10),
      between10and12: this.getTotalCountByRange(10, 12),
      between12and14: this.getTotalCountByRange(12, 14),
      between14and16: this.getTotalCountByRange(14, 16),
      greaterThan16: this.getTotalCountByRange(16, 21)
    };

    const chartData = {
      labels: ['< 4', '4 - 6', '6 - 8', '8 - 10', '10 - 12', '12 - 14', '14 - 16', '≥ 16'],
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
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 101, 101, 0.7)',
          'rgba(251, 146, 60, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(168, 85, 247, 0.7)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 101, 101, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 1
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        },
        title: {
          display: true,
          text: 'توزيع المعدلات الإجمالي'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    };

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: chartOptions
    });
  }

  updateTotalClassificationChart(): void {
    const ctx = document.getElementById('totalClassificationChart') as HTMLCanvasElement;
    if (!ctx) return;

    const classificationData = {
      congratulations: this.getTotalClassificationCount('congratulations'),
      encouragement: this.getTotalClassificationCount('encouragement'),
      honorRoll: this.getTotalClassificationCount('honorRoll'),
      none: this.getTotalClassificationCount('none'),
      remarks: this.getTotalClassificationCount('remarks')
    };

    const chartData = {
      labels: ['تهاني (≥ 16)', 'تشجيع (14-16)', 'شرف (12-14)', 'عادي (10-12)', 'ملاحظات (< 10)'],
      datasets: [{
        label: 'عدد التلاميذ',
        data: [
          classificationData.congratulations,
          classificationData.encouragement,
          classificationData.honorRoll,
          classificationData.none,
          classificationData.remarks
        ],
        backgroundColor: [
          'rgba(168, 85, 247, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        },
        title: {
          display: true,
          text: 'تصنيف التلاميذ حسب المعدل'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    };

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: chartOptions
    });
  }

  async exportTotalExcelAnalysisToPDF(): Promise<void> {
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
      title.textContent = 'تقرير تحليل بيانات Excel الإجمالي';
      title.style.textAlign = 'center';
      title.style.fontSize = '28px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      exportContainer.appendChild(title);

      // Add date
      const dateInfo = document.createElement('p');
      dateInfo.textContent = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      dateInfo.style.textAlign = 'center';
      dateInfo.style.fontSize = '12px';
      dateInfo.style.color = '#6b7280';
      dateInfo.style.marginBottom = '30px';
      exportContainer.appendChild(dateInfo);

      // Overall Statistics Section
      const statsSection = document.createElement('div');
      statsSection.style.marginBottom = '30px';
      
      const statsTitle = document.createElement('h2');
      statsTitle.textContent = 'الإحصائيات الإجمالية';
      statsTitle.style.fontSize = '22px';
      statsTitle.style.fontWeight = 'bold';
      statsTitle.style.marginBottom = '20px';
      statsTitle.style.color = '#1f2937';
      statsTitle.style.borderBottom = '2px solid #3b82f6';
      statsTitle.style.paddingBottom = '10px';
      statsSection.appendChild(statsTitle);

      const statsGrid = document.createElement('div');
      statsGrid.style.display = 'grid';
      statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      statsGrid.style.gap = '15px';
      statsGrid.style.marginBottom = '20px';

      const totalAvg = this.calculateTotalAverage();
      const totalAbove10 = this.getTotalStudentsAbove10();
      const totalBelow10 = this.getTotalStudentsBelow10();
      const totalStudents = this.getTotalStudentsCount();

      const stats = [
        { label: 'المعدل الإجمالي', value: totalAvg.toFixed(2), color: '#3b82f6' },
        { label: 'عدد التلاميذ بمعدل ≥ 10', value: totalAbove10.toString(), color: '#10b981' },
        { label: 'عدد التلاميذ بمعدل < 10', value: totalBelow10.toString(), color: '#ef4444' },
        { label: 'إجمالي التلاميذ', value: totalStudents.toString(), color: '#8b5cf6' }
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
        statsGrid.appendChild(statCard);
      });

      statsSection.appendChild(statsGrid);
      exportContainer.appendChild(statsSection);

      // Results Analysis by Average Section
      const resultsSection = document.createElement('div');
      resultsSection.style.marginBottom = '30px';
      resultsSection.style.pageBreakInside = 'avoid';

      const resultsTitle = document.createElement('h2');
      resultsTitle.textContent = 'تحليل النتائج حسب المعدل';
      resultsTitle.style.fontSize = '22px';
      resultsTitle.style.fontWeight = 'bold';
      resultsTitle.style.marginBottom = '20px';
      resultsTitle.style.color = '#1f2937';
      resultsTitle.style.borderBottom = '2px solid #3b82f6';
      resultsTitle.style.paddingBottom = '10px';
      resultsSection.appendChild(resultsTitle);

      // Results Table
      const resultsTable = document.createElement('table');
      resultsTable.style.width = '100%';
      resultsTable.style.borderCollapse = 'collapse';
      resultsTable.style.fontSize = '11px';
      resultsTable.style.marginBottom = '20px';
      resultsTable.style.border = '1px solid #d1d5db';

      const resultsThead = document.createElement('thead');
      const resultsHeaderRow = document.createElement('tr');
      resultsHeaderRow.style.backgroundColor = '#3b82f6';
      resultsHeaderRow.style.color = '#ffffff';
      
      ['القسم', 'المعدل', 'عدد التلاميذ', '≥ 10', '< 10', 'النسبة المئوية ≥ 10'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '8px';
        th.style.border = '1px solid #2563eb';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        resultsHeaderRow.appendChild(th);
      });
      resultsThead.appendChild(resultsHeaderRow);
      resultsTable.appendChild(resultsThead);

      const resultsTbody = document.createElement('tbody');
      this.processedSheetsData.forEach(sheetInfo => {
        const row = document.createElement('tr');
        const avg = this.calculateSheetAverage(sheetInfo.data);
        const above10 = this.getStudentsAbove10Count(sheetInfo.data);
        const below10 = this.getStudentsBelow10Count(sheetInfo.data);
        const percentage = sheetInfo.data.length > 0 ? ((above10 / sheetInfo.data.length) * 100).toFixed(2) : '0.00';
        
        [sheetInfo.sheetName, avg.toFixed(2), sheetInfo.data.length.toString(), above10.toString(), below10.toString(), `${percentage}%`].forEach((cellText, index) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '8px';
          td.style.border = '1px solid #d1d5db';
          td.style.textAlign = 'right';
          if (index === 3) td.style.color = '#10b981';
          if (index === 4) td.style.color = '#ef4444';
          row.appendChild(td);
        });
        resultsTbody.appendChild(row);
      });
      resultsTable.appendChild(resultsTbody);
      resultsSection.appendChild(resultsTable);

      // Add chart for Results Analysis
      const totalAverageChartCanvas = document.getElementById('totalAverageDistributionChart') as HTMLCanvasElement;
      if (totalAverageChartCanvas) {
        const chartDiv = document.createElement('div');
        chartDiv.style.marginTop = '20px';
        chartDiv.style.marginBottom = '20px';
        
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = 'مخطط توزيع المعدلات الإجمالي';
        chartTitle.style.fontSize = '18px';
        chartTitle.style.fontWeight = 'bold';
        chartTitle.style.marginBottom = '15px';
        chartTitle.style.color = '#1f2937';
        chartDiv.appendChild(chartTitle);

        const chartImg = document.createElement('img');
        chartImg.src = totalAverageChartCanvas.toDataURL('image/png');
        chartImg.style.width = '100%';
        chartImg.style.height = 'auto';
        chartImg.style.border = '1px solid #e5e7eb';
        chartImg.style.borderRadius = '8px';
        chartDiv.appendChild(chartImg);
        resultsSection.appendChild(chartDiv);
      }

      exportContainer.appendChild(resultsSection);

      // Count by Range Section
      const countSection = document.createElement('div');
      countSection.style.marginBottom = '30px';
      countSection.style.pageBreakInside = 'avoid';

      const countTitle = document.createElement('h2');
      countTitle.textContent = 'حصر التلاميذ حسب المعدل لجميع الأقسام';
      countTitle.style.fontSize = '22px';
      countTitle.style.fontWeight = 'bold';
      countTitle.style.marginBottom = '20px';
      countTitle.style.color = '#1f2937';
      countTitle.style.borderBottom = '2px solid #3b82f6';
      countTitle.style.paddingBottom = '10px';
      countSection.appendChild(countTitle);

      // Count Table
      const countTable = document.createElement('table');
      countTable.style.width = '100%';
      countTable.style.borderCollapse = 'collapse';
      countTable.style.fontSize = '10px';
      countTable.style.marginBottom = '20px';
      countTable.style.border = '1px solid #d1d5db';

      const countThead = document.createElement('thead');
      const countHeaderRow = document.createElement('tr');
      countHeaderRow.style.backgroundColor = '#3b82f6';
      countHeaderRow.style.color = '#ffffff';
      
      ['القسم', '< 4', '4 - 6', '6 - 8', '8 - 10', '10 - 12', '12 - 14', '14 - 16', '≥ 16', 'الإجمالي'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '6px';
        th.style.border = '1px solid #2563eb';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        countHeaderRow.appendChild(th);
      });
      countThead.appendChild(countHeaderRow);
      countTable.appendChild(countThead);

      const countTbody = document.createElement('tbody');
      this.processedSheetsData.forEach(sheetInfo => {
        const row = document.createElement('tr');
        const cells = [
          sheetInfo.sheetName,
          this.getCountByRange(sheetInfo.data, 0, 4).toString(),
          this.getCountByRange(sheetInfo.data, 4, 6).toString(),
          this.getCountByRange(sheetInfo.data, 6, 8).toString(),
          this.getCountByRange(sheetInfo.data, 8, 10).toString(),
          this.getCountByRange(sheetInfo.data, 10, 12).toString(),
          this.getCountByRange(sheetInfo.data, 12, 14).toString(),
          this.getCountByRange(sheetInfo.data, 14, 16).toString(),
          this.getCountByRange(sheetInfo.data, 16, 21).toString(),
          sheetInfo.data.length.toString()
        ];
        
        cells.forEach((cellText, index) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '6px';
          td.style.border = '1px solid #d1d5db';
          td.style.textAlign = 'right';
          if (index === 0) td.style.fontWeight = 'bold';
          if (index === cells.length - 1) td.style.fontWeight = 'bold';
          row.appendChild(td);
        });
        countTbody.appendChild(row);
      });

      // Add total row
      const totalRow = document.createElement('tr');
      totalRow.style.backgroundColor = '#f3f4f6';
      totalRow.style.fontWeight = 'bold';
      const totalCells = [
        'الإجمالي',
        this.getTotalCountByRange(0, 4).toString(),
        this.getTotalCountByRange(4, 6).toString(),
        this.getTotalCountByRange(6, 8).toString(),
        this.getTotalCountByRange(8, 10).toString(),
        this.getTotalCountByRange(10, 12).toString(),
        this.getTotalCountByRange(12, 14).toString(),
        this.getTotalCountByRange(14, 16).toString(),
        this.getTotalCountByRange(16, 21).toString(),
        this.getTotalStudentsCount().toString()
      ];
      
      totalCells.forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        td.style.padding = '6px';
        td.style.border = '1px solid #d1d5db';
        td.style.textAlign = 'right';
        countTbody.appendChild(td);
      });
      countTbody.appendChild(totalRow);

      countTable.appendChild(countTbody);
      countSection.appendChild(countTable);
      exportContainer.appendChild(countSection);

      // Classification Section
      const classificationSection = document.createElement('div');
      classificationSection.style.marginBottom = '30px';
      classificationSection.style.pageBreakInside = 'avoid';

      const classificationTitle = document.createElement('h2');
      classificationTitle.textContent = 'تصنيف التلاميذ حسب المعدل لجميع الأقسام';
      classificationTitle.style.fontSize = '22px';
      classificationTitle.style.fontWeight = 'bold';
      classificationTitle.style.marginBottom = '20px';
      classificationTitle.style.color = '#1f2937';
      classificationTitle.style.borderBottom = '2px solid #3b82f6';
      classificationTitle.style.paddingBottom = '10px';
      classificationSection.appendChild(classificationTitle);

      // Classification Table
      const classificationTable = document.createElement('table');
      classificationTable.style.width = '100%';
      classificationTable.style.borderCollapse = 'collapse';
      classificationTable.style.fontSize = '11px';
      classificationTable.style.marginBottom = '20px';
      classificationTable.style.border = '1px solid #d1d5db';

      const classificationThead = document.createElement('thead');
      const classificationHeaderRow = document.createElement('tr');
      classificationHeaderRow.style.backgroundColor = '#3b82f6';
      classificationHeaderRow.style.color = '#ffffff';
      
      ['القسم', 'تهاني (≥ 16)', 'تشجيع (14 - 16)', 'شرف (12 - 14)', 'عادي (10 - 12)', 'ملاحظات (< 10)', 'الإجمالي'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '8px';
        th.style.border = '1px solid #2563eb';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        classificationHeaderRow.appendChild(th);
      });
      classificationThead.appendChild(classificationHeaderRow);
      classificationTable.appendChild(classificationThead);

      const classificationTbody = document.createElement('tbody');
      this.processedSheetsData.forEach(sheetInfo => {
        const row = document.createElement('tr');
        const cells = [
          sheetInfo.sheetName,
          this.getClassificationCount(sheetInfo.data, 'congratulations').toString(),
          this.getClassificationCount(sheetInfo.data, 'encouragement').toString(),
          this.getClassificationCount(sheetInfo.data, 'honorRoll').toString(),
          this.getClassificationCount(sheetInfo.data, 'none').toString(),
          this.getClassificationCount(sheetInfo.data, 'remarks').toString(),
          sheetInfo.data.length.toString()
        ];
        
        cells.forEach((cellText, index) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '8px';
          td.style.border = '1px solid #d1d5db';
          td.style.textAlign = 'right';
          if (index === 0) td.style.fontWeight = 'bold';
          if (index === 1) td.style.color = '#9333ea';
          if (index === 2) td.style.color = '#2563eb';
          if (index === 3) td.style.color = '#16a34a';
          if (index === 4) td.style.color = '#ca8a04';
          if (index === 5) td.style.color = '#dc2626';
          if (index === cells.length - 1) td.style.fontWeight = 'bold';
          row.appendChild(td);
        });
        classificationTbody.appendChild(row);
      });

      // Add total row
      const classificationTotalRow = document.createElement('tr');
      classificationTotalRow.style.backgroundColor = '#f3f4f6';
      classificationTotalRow.style.fontWeight = 'bold';
      const classificationTotalCells = [
        'الإجمالي',
        this.getTotalClassificationCount('congratulations').toString(),
        this.getTotalClassificationCount('encouragement').toString(),
        this.getTotalClassificationCount('honorRoll').toString(),
        this.getTotalClassificationCount('none').toString(),
        this.getTotalClassificationCount('remarks').toString(),
        this.getTotalStudentsCount().toString()
      ];
      
      classificationTotalCells.forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        td.style.padding = '8px';
        td.style.border = '1px solid #d1d5db';
        td.style.textAlign = 'right';
        classificationTbody.appendChild(td);
      });
      classificationTbody.appendChild(classificationTotalRow);

      classificationTable.appendChild(classificationTbody);
      classificationSection.appendChild(classificationTable);

      // Add chart for Classification
      const classificationChartCanvas = document.getElementById('totalClassificationChart') as HTMLCanvasElement;
      if (classificationChartCanvas) {
        const chartDiv = document.createElement('div');
        chartDiv.style.marginTop = '20px';
        chartDiv.style.marginBottom = '20px';
        
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = 'مخطط التصنيف الإجمالي';
        chartTitle.style.fontSize = '18px';
        chartTitle.style.fontWeight = 'bold';
        chartTitle.style.marginBottom = '15px';
        chartTitle.style.color = '#1f2937';
        chartDiv.appendChild(chartTitle);

        const chartImg = document.createElement('img');
        chartImg.src = classificationChartCanvas.toDataURL('image/png');
        chartImg.style.width = '100%';
        chartImg.style.height = 'auto';
        chartImg.style.border = '1px solid #e5e7eb';
        chartImg.style.borderRadius = '8px';
        chartDiv.appendChild(chartImg);
        classificationSection.appendChild(chartDiv);
      }

      exportContainer.appendChild(classificationSection);

      // Detailed Student Classification by Section
      const detailedClassificationSection = document.createElement('div');
      detailedClassificationSection.style.marginBottom = '30px';
      detailedClassificationSection.style.pageBreakInside = 'avoid';

      const detailedTitle = document.createElement('h2');
      detailedTitle.textContent = 'تصنيف التلاميذ حسب المعدل - تفاصيل لكل قسم';
      detailedTitle.style.fontSize = '22px';
      detailedTitle.style.fontWeight = 'bold';
      detailedTitle.style.marginBottom = '20px';
      detailedTitle.style.color = '#1f2937';
      detailedTitle.style.borderBottom = '2px solid #3b82f6';
      detailedTitle.style.paddingBottom = '10px';
      detailedClassificationSection.appendChild(detailedTitle);

      // Process each section
      this.processedSheetsData.forEach(sheetInfo => {
        const sectionDiv = document.createElement('div');
        sectionDiv.style.marginBottom = '25px';
        sectionDiv.style.pageBreakInside = 'avoid';

        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = `القسم: ${sheetInfo.sheetName}`;
        sectionTitle.style.fontSize = '18px';
        sectionTitle.style.fontWeight = 'bold';
        sectionTitle.style.marginBottom = '15px';
        sectionTitle.style.color = '#3b82f6';
        sectionTitle.style.paddingBottom = '8px';
        sectionTitle.style.borderBottom = '1px solid #d1d5db';
        sectionDiv.appendChild(sectionTitle);

        // Sort students by average descending
        const sortedStudents = [...sheetInfo.data].sort((a, b) => (b.average || 0) - (a.average || 0));

        // Create table for this section
        const sectionTable = document.createElement('table');
        sectionTable.style.width = '100%';
        sectionTable.style.borderCollapse = 'collapse';
        sectionTable.style.fontSize = '10px';
        sectionTable.style.marginBottom = '20px';
        sectionTable.style.border = '1px solid #d1d5db';

        const sectionThead = document.createElement('thead');
        const sectionHeaderRow = document.createElement('tr');
        sectionHeaderRow.style.backgroundColor = '#3b82f6';
        sectionHeaderRow.style.color = '#ffffff';
        
        ['الترتيب', 'الاسم', 'اللقب', 'المعدل', 'التصنيف'].forEach(headerText => {
          const th = document.createElement('th');
          th.textContent = headerText;
          th.style.padding = '6px';
          th.style.border = '1px solid #2563eb';
          th.style.textAlign = 'right';
          th.style.fontWeight = 'bold';
          sectionHeaderRow.appendChild(th);
        });
        sectionThead.appendChild(sectionHeaderRow);
        sectionTable.appendChild(sectionThead);

        const sectionTbody = document.createElement('tbody');
        sortedStudents.forEach((student, index) => {
          const row = document.createElement('tr');
          const avg = student.average || 0;
          let classification = '';
          let classificationColor = '';
          
          if (avg >= 16) {
            classification = 'تهاني';
            classificationColor = '#9333ea';
          } else if (avg >= 14) {
            classification = 'تشجيع';
            classificationColor = '#2563eb';
          } else if (avg >= 12) {
            classification = 'شرف';
            classificationColor = '#16a34a';
          } else if (avg >= 10) {
            classification = 'عادي';
            classificationColor = '#ca8a04';
          } else {
            classification = 'ملاحظات';
            classificationColor = '#dc2626';
          }

          const cells = [
            (index + 1).toString(),
            student.firstName || '-',
            student.lastName || '-',
            avg.toFixed(2),
            classification
          ];
          
          cells.forEach((cellText, cellIndex) => {
            const td = document.createElement('td');
            td.textContent = cellText;
            td.style.padding = '6px';
            td.style.border = '1px solid #d1d5db';
            td.style.textAlign = 'right';
            
            if (cellIndex === 3) { // Average column
              if (avg >= 10) td.style.color = '#10b981';
              else td.style.color = '#ef4444';
              td.style.fontWeight = 'bold';
            }
            if (cellIndex === 4) { // Classification column
              td.style.color = classificationColor;
              td.style.fontWeight = 'bold';
            }
            
            row.appendChild(td);
          });
          sectionTbody.appendChild(row);
        });
        sectionTable.appendChild(sectionTbody);
        sectionDiv.appendChild(sectionTable);
        detailedClassificationSection.appendChild(sectionDiv);
      });

      exportContainer.appendChild(detailedClassificationSection);

      // Monitoring Document Section
      const monitoringSection = document.createElement('div');
      monitoringSection.style.marginBottom = '30px';
      monitoringSection.style.pageBreakInside = 'avoid';

      const monitoringTitle = document.createElement('h2');
      monitoringTitle.textContent = 'وثيقة المراقبة';
      monitoringTitle.style.fontSize = '22px';
      monitoringTitle.style.fontWeight = 'bold';
      monitoringTitle.style.marginBottom = '20px';
      monitoringTitle.style.color = '#1f2937';
      monitoringTitle.style.borderBottom = '2px solid #3b82f6';
      monitoringTitle.style.paddingBottom = '10px';
      monitoringSection.appendChild(monitoringTitle);

      // Monitoring Summary
      const monitoringSummary = document.createElement('div');
      monitoringSummary.style.display = 'grid';
      monitoringSummary.style.gridTemplateColumns = 'repeat(3, 1fr)';
      monitoringSummary.style.gap = '15px';
      monitoringSummary.style.marginBottom = '20px';

      const sectionsCount = this.getTotalSectionsCount();
      const successRate = totalStudents > 0 ? ((totalAbove10 / totalStudents) * 100).toFixed(2) : '0.00';

      const monitoringStats = [
        { label: 'عدد الأقسام', value: sectionsCount.toString(), color: '#eab308' },
        { label: 'إجمالي التلاميذ', value: totalStudents.toString(), color: '#3b82f6' },
        { label: 'نسبة النجاح', value: `${successRate}%`, color: '#10b981' }
      ];

      monitoringStats.forEach(stat => {
        const statCard = document.createElement('div');
        statCard.style.backgroundColor = '#f3f4f6';
        statCard.style.padding = '15px';
        statCard.style.borderRadius = '8px';
        statCard.style.textAlign = 'center';
        statCard.style.border = `2px solid ${stat.color}`;
        
        const value = document.createElement('div');
        value.textContent = stat.value;
        value.style.fontSize = '20px';
        value.style.fontWeight = 'bold';
        value.style.color = stat.color;
        value.style.marginBottom = '5px';
        
        const label = document.createElement('div');
        label.textContent = stat.label;
        label.style.fontSize = '12px';
        label.style.color = '#6b7280';
        
        statCard.appendChild(value);
        statCard.appendChild(label);
        monitoringSummary.appendChild(statCard);
      });

      monitoringSection.appendChild(monitoringSummary);

      // Monitoring Table
      const monitoringTable = document.createElement('table');
      monitoringTable.style.width = '100%';
      monitoringTable.style.borderCollapse = 'collapse';
      monitoringTable.style.fontSize = '11px';
      monitoringTable.style.marginBottom = '20px';
      monitoringTable.style.border = '1px solid #d1d5db';

      const monitoringThead = document.createElement('thead');
      const monitoringHeaderRow = document.createElement('tr');
      monitoringHeaderRow.style.backgroundColor = '#3b82f6';
      monitoringHeaderRow.style.color = '#ffffff';
      
      ['القسم', 'المعدل', 'عدد التلاميذ', '≥ 10', '< 10', 'نسبة النجاح', 'الحالة'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '8px';
        th.style.border = '1px solid #2563eb';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        monitoringHeaderRow.appendChild(th);
      });
      monitoringThead.appendChild(monitoringHeaderRow);
      monitoringTable.appendChild(monitoringThead);

      const monitoringTbody = document.createElement('tbody');
      this.processedSheetsData.forEach(sheetInfo => {
        const row = document.createElement('tr');
        const avg = this.calculateSheetAverage(sheetInfo.data);
        const above10 = this.getStudentsAbove10Count(sheetInfo.data);
        const below10 = this.getStudentsBelow10Count(sheetInfo.data);
        const successRate = sheetInfo.data.length > 0 ? ((above10 / sheetInfo.data.length) * 100).toFixed(2) : '0.00';
        const statusClass = this.getStatusClass(sheetInfo.data);
        let statusText = '';
        if (statusClass.includes('green')) statusText = 'ممتاز';
        else if (statusClass.includes('yellow')) statusText = 'جيد';
        else statusText = 'يحتاج تحسين';
        
        [sheetInfo.sheetName, avg.toFixed(2), sheetInfo.data.length.toString(), above10.toString(), below10.toString(), `${successRate}%`, statusText].forEach((cellText, index) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '8px';
          td.style.border = '1px solid #d1d5db';
          td.style.textAlign = 'right';
          if (index === 3) td.style.color = '#10b981';
          if (index === 4) td.style.color = '#ef4444';
          if (index === 6) {
            if (statusText === 'ممتاز') td.style.color = '#10b981';
            else if (statusText === 'جيد') td.style.color = '#eab308';
            else td.style.color = '#ef4444';
            td.style.fontWeight = 'bold';
          }
          row.appendChild(td);
        });
        monitoringTbody.appendChild(row);
      });
      monitoringTable.appendChild(monitoringTbody);
      monitoringSection.appendChild(monitoringTable);

      // Add all charts to Monitoring Document section
      const monitoringChartsDiv = document.createElement('div');
      monitoringChartsDiv.style.marginTop = '30px';
      
      const chartsTitle = document.createElement('h3');
      chartsTitle.textContent = 'المخططات الإجمالية';
      chartsTitle.style.fontSize = '18px';
      chartsTitle.style.fontWeight = 'bold';
      chartsTitle.style.marginBottom = '20px';
      chartsTitle.style.color = '#1f2937';
      chartsTitle.style.borderBottom = '2px solid #3b82f6';
      chartsTitle.style.paddingBottom = '10px';
      monitoringChartsDiv.appendChild(chartsTitle);

      const chartsGrid = document.createElement('div');
      chartsGrid.style.display = 'grid';
      chartsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      chartsGrid.style.gap = '20px';

      // Add Average Distribution Chart - try to get from DOM
      const totalAverageChartCanvas2 = document.getElementById('totalAverageDistributionChart') as HTMLCanvasElement;
      if (totalAverageChartCanvas2) {
        try {
          const chartCard = document.createElement('div');
          chartCard.style.border = '1px solid #e5e7eb';
          chartCard.style.borderRadius = '8px';
          chartCard.style.padding = '15px';
          chartCard.style.backgroundColor = '#f9fafb';
          
          const chartTitle = document.createElement('h4');
          chartTitle.textContent = 'توزيع المعدلات الإجمالي';
          chartTitle.style.fontSize = '16px';
          chartTitle.style.fontWeight = 'bold';
          chartTitle.style.marginBottom = '10px';
          chartTitle.style.color = '#1f2937';
          chartCard.appendChild(chartTitle);

          const chartImg = document.createElement('img');
          chartImg.src = totalAverageChartCanvas2.toDataURL('image/png');
          chartImg.style.width = '100%';
          chartImg.style.height = 'auto';
          chartImg.style.maxHeight = '300px';
          chartImg.style.objectFit = 'contain';
          chartCard.appendChild(chartImg);
          chartsGrid.appendChild(chartCard);
        } catch (e) {
          console.warn('Could not capture average distribution chart:', e);
        }
      }

      // Add Classification Chart - try to get from DOM
      const classificationChartCanvas2 = document.getElementById('totalClassificationChart') as HTMLCanvasElement;
      if (classificationChartCanvas2) {
        try {
          const chartCard = document.createElement('div');
          chartCard.style.border = '1px solid #e5e7eb';
          chartCard.style.borderRadius = '8px';
          chartCard.style.padding = '15px';
          chartCard.style.backgroundColor = '#f9fafb';
          
          const chartTitle = document.createElement('h4');
          chartTitle.textContent = 'مخطط التصنيف الإجمالي';
          chartTitle.style.fontSize = '16px';
          chartTitle.style.fontWeight = 'bold';
          chartTitle.style.marginBottom = '10px';
          chartTitle.style.color = '#1f2937';
          chartCard.appendChild(chartTitle);

          const chartImg = document.createElement('img');
          chartImg.src = classificationChartCanvas2.toDataURL('image/png');
          chartImg.style.width = '100%';
          chartImg.style.height = 'auto';
          chartImg.style.maxHeight = '300px';
          chartImg.style.objectFit = 'contain';
          chartCard.appendChild(chartImg);
          chartsGrid.appendChild(chartCard);
        } catch (e) {
          console.warn('Could not capture classification chart:', e);
        }
      }

      if (chartsGrid.children.length > 0) {
        monitoringChartsDiv.appendChild(chartsGrid);
        monitoringSection.appendChild(monitoringChartsDiv);
      }

      exportContainer.appendChild(monitoringSection);

      document.body.appendChild(exportContainer);

      // Wait for charts to render and ensure they're visible
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force chart updates to ensure they're rendered
      this.updateTotalExcelAnalysisCharts();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use html2canvas to capture the content
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.scrollHeight,
        windowWidth: exportContainer.scrollWidth,
        windowHeight: exportContainer.scrollHeight
      });

      // Clean up
      document.body.removeChild(exportContainer);

      // Create PDF with proper page breaks
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/png');

      // Calculate number of pages needed
      const totalPages = Math.ceil(imgHeight / availableHeight);

      // Add pages as needed - properly crop each page using negative yOffset
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        // Calculate the yOffset for this page (negative to show different portion)
        const yOffset = margin - (page * availableHeight);

        // Add the full image with adjusted yOffset to show the correct portion
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yOffset,
          imgWidth,
          imgHeight
        );
      }

      const fileName = `تقرير_تحليل_Excel_الإجمالي_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  }

  get filteredFinalStudents(): (Student & { finalDecision?: FinalCouncilDecision })[] {
    if (!this.finalDecisionStudentSearch.trim()) {
      return this.finalStudentsWithDecisions;
    }

    const searchTerm = this.finalDecisionStudentSearch.toLowerCase();
    return this.finalStudentsWithDecisions.filter(student =>
      student.firstName?.toLowerCase().includes(searchTerm) ||
      student.lastName?.toLowerCase().includes(searchTerm) ||
      student.idNumber?.toLowerCase().includes(searchTerm)
    );
  }
}

