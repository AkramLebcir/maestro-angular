import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  gender?: 'male' | 'female';
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

@Component({
  selector: 'app-gradebook',
  templateUrl: './gradebook.component.html',
  styleUrls: ['./gradebook.component.css']
})
export class GradebookComponent implements OnInit {
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
  
  // Sorting
  sortBy: 'firstName' | 'lastName' | 'idNumber' | 'termAverage' | 'annualAverage' | 'ranking' | null = null;
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

  // View mode
  viewMode: 'entry' | 'grades' | 'reports' = 'entry';

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadAssessments();
  }

  loadClasses(): void {
    this.apiService.get<Class[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
        if (data.length > 0 && !this.selectedClass) {
          this.selectedClass = data[0];
          this.loadStudentsForClass(data[0].id);
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

  isBehaviorPositive(behaviorId: number): boolean {
    // السلوكيات الإيجابية: IDs 1-5
    // السلوكيات السلبية: IDs 6-10
    return behaviorId >= 1 && behaviorId <= 5;
  }

  onClassChange(): void {
    if (this.selectedClass) {
      this.loadStudentsForClass(this.selectedClass.id);
    } else {
      this.students = [];
      this.grades = [];
    }
  }

  onTermChange(): void {
    if (this.selectedClass) {
      // إعادة حساب الدرجات للفصل الدراسي الجديد
      // استخدام setTimeout لضمان تحديث this.selectedTerm قبل الحساب
      setTimeout(() => {
        this.calculateAllGrades();
      }, 0);
      // إعادة تحميل الدرجات من الخادم (سيتم استدعاء calculateAllGrades من loadAttendanceForClass و loadBehaviorForClass)
      this.loadGradesForClass(this.selectedClass.id);
    }
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
      
      // Find existing grade to preserve notes and mark
      const existingGrade = this.grades.find(g => 
        g.studentId === studentId && 
        g.assessmentId === assessmentId &&
        g.classId === this.selectedClass!.id
      );
      
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
          // Recalculate all grades immediately
          this.calculateAllGrades();
          // Force change detection to update the view
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
          // Add to local grades immediately for instant calculation
          // Ensure term is set correctly
          const gradeWithTerm = { 
            ...newGrade, 
            term: newGrade.term !== undefined && newGrade.term !== null 
              ? newGrade.term 
              : this.selectedTerm 
          };
          // Create new array to trigger change detection
          this.grades = [...this.grades, gradeWithTerm];
          // Update student's grades array
          const student = this.students.find(s => s.id === this.formData.studentId);
          if (student) {
            if (!student.grades) {
              student.grades = [];
            }
            student.grades.push(gradeWithTerm);
          }
          // Recalculate all grades immediately
          this.calculateAllGrades();
          // Force change detection to update the view
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
    
    // First try to find grade with matching term
    let grade = this.grades.find(g => 
      g.studentId === studentId && 
      g.assessmentId === assessmentId &&
      g.classId === this.selectedClass!.id &&
      (g.term === this.selectedTerm || g.term === undefined || g.term === null)
    );
    
    // If multiple grades exist, prefer the one with matching term
    if (!grade) {
      grade = this.grades.find(g => 
        g.studentId === studentId && 
        g.assessmentId === assessmentId &&
        g.classId === this.selectedClass!.id &&
        g.term === this.selectedTerm
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
    
    // If currently sorted by ranking, termAverage, or annualAverage, reapply the sort
    if (this.sortBy === 'ranking' || this.sortBy === 'termAverage' || this.sortBy === 'annualAverage') {
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
    // نبدأ من 3 نقاط
    // كل حضور أو معذور: +0.5
    // كل غياب أو مغادرة مبكرة: -0.5
    // كل متأخر: -0.25
    if (!this.selectedClass) return 3; // Default starting value
    
    const termFilter = term || this.selectedTerm;
    // تصفية سجلات الحضور للتلميذ والقسم المحدد
    let studentRecords = this.attendanceRecords.filter(r => r.studentId === student.id && r.classId === this.selectedClass?.id);
    
    // تصفية السجلات حسب الفترة الزمنية للفصل الدراسي
    studentRecords = studentRecords.filter(r => {
      if (!r.date) return false;
      return this.isDateInTerm(r.date, termFilter);
    });
    
    if (studentRecords.length === 0) return 3; // Default starting value
    
    // نبدأ من 3 نقاط
    let score = 3;
    
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
    
    // التأكد من أن النتيجة بين 0 و 5
    return Math.max(0, Math.min(5, score));
  }

  calculateBehaviorGrade(student: Student, term?: number): number {
    // حساب نقاط السلوك تلقائياً من أحداث السلوك
    // يتم حساب النقاط بناءً على الفترة الزمنية للفصل الدراسي المحدد
    // الفصل الأول: سبتمبر إلى ديسمبر
    // الفصل الثاني: جانفي إلى مارس
    // الفصل الثالث: أفريل إلى جوان
    // نبدأ من 3 نقاط، كل سلوك إيجابي +0.5، كل سلوك سلبي -0.5
    if (!this.selectedClass) return 3; // Default starting value
    
    const termFilter = term || this.selectedTerm;
    // تصفية أحداث السلوك للتلميذ والقسم المحدد
    let studentEvents = this.behaviorEvents.filter(e => e.studentId === student.id && e.classId === this.selectedClass?.id);
    
    // تصفية الأحداث حسب الفترة الزمنية للفصل الدراسي
    studentEvents = studentEvents.filter(e => {
      if (!e.date) return false;
      return this.isDateInTerm(e.date, termFilter);
    });
    
    if (studentEvents.length === 0) return 3; // Default starting value
    
    // نبدأ من 3 نقاط
    let score = 3;
    
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
    
    // التأكد من أن النتيجة بين 0 و 5
    return Math.max(0, Math.min(5, score));
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
    const total = (notebook || 0) + (duty || 0) + (attendance || 0) + (behavior || 0);
    
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
    
    const oralExpressionGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'oral_expression')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === termFilter
    );
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
    
    // معدل الفصل = ((التقييم المستمر + التعبير الشفهي/العمل العملي + الفرض) + (الاختبار × 2)) ÷ 5
    const part1 = continuousAssessment + oralExpression + assignment;
    const part2 = test * 2;
    const average = (part1 + part2) / 5;
    
    return average;
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
    if (this.students.length === 0) return 0;
    
    const sum = this.students.reduce((acc, s) => {
      return acc + (s.averages?.termAverage || 0);
    }, 0);
    
    return sum / this.students.length;
  }

  calculateRankings(): void {
    // Create a copy of students with averages for sorting
    const studentsWithAverages = this.students
      .filter(s => s.averages?.termAverage !== undefined && (s.averages?.termAverage || 0) > 0)
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
      if (!student.averages?.termAverage || student.averages.termAverage === 0) {
        student.ranking = undefined;
      }
    });
  }

  sortStudents(field: 'firstName' | 'lastName' | 'idNumber' | 'termAverage' | 'annualAverage' | 'ranking'): void {
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

  getSortIcon(field: 'firstName' | 'lastName' | 'idNumber' | 'termAverage' | 'annualAverage' | 'ranking'): string {
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
    if (!this.selectedClass || !this.selectedAssessment) {
      alert('يرجى اختيار القسم ونوع التقييم أولاً');
      return;
    }

    // Find header row
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some((cell: any) => 
        String(cell).toLowerCase().includes('name') || 
        String(cell).toLowerCase().includes('اسم') ||
        String(cell).toLowerCase().includes('score') ||
        String(cell).toLowerCase().includes('درجة')
      )) {
        headerRow = i;
        break;
      }
    }

    const headers = data[headerRow] || [];
    const nameColIndex = headers.findIndex((h: any) => 
      String(h).toLowerCase().includes('name') || 
      String(h).toLowerCase().includes('اسم')
    );
    const scoreColIndex = headers.findIndex((h: any) => 
      String(h).toLowerCase().includes('score') || 
      String(h).toLowerCase().includes('درجة') ||
      String(h).toLowerCase().includes('mark')
    );

    if (nameColIndex === -1 || scoreColIndex === -1) {
      alert('لم يتم العثور على أعمدة الاسم أو الدرجة في ملف Excel');
      return;
    }

    // Process rows
    let imported = 0;
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const name = String(row[nameColIndex] || '').trim();
      const score = parseFloat(row[scoreColIndex] || 0);

      if (!name || isNaN(score)) continue;

      // Find student by name
      const student = this.students.find(s => 
        `${s.firstName} ${s.lastName}`.includes(name) ||
        `${s.lastName} ${s.firstName}`.includes(name) ||
        s.firstName.includes(name) ||
        s.lastName.includes(name)
      );

      if (student) {
        const gradeData: CreateGradeDto = {
          studentId: student.id,
          assessmentId: this.selectedAssessment.id,
          classId: this.selectedClass.id,
          term: this.selectedTerm,
          score: score,
          maxScore: this.selectedAssessment.maxScore,
          date: this.formatDateForAPI(this.selectedDate)
        };

        this.apiService.post<Grade>('/grades', gradeData).subscribe({
          next: () => {
            imported++;
            if (imported === 1) {
              this.loadGradesForClass(this.selectedClass!.id);
            }
          },
          error: (error) => {
            console.error(`Error importing grade for ${name}:`, error);
          }
        });
      }
    }

    alert(`تم استيراد ${imported} درجة بنجاح`);
    this.closeImportModal();
  }

  openImportModal(): void {
    if (!this.selectedClass || !this.selectedAssessment) {
      alert('يرجى اختيار القسم ونوع التقييم أولاً');
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
  }

  closeReportModal(): void {
    this.showReportModal = false;
  }

  getGradeStatistics(): GradeStatistics {
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

  getStudentsAbove10(): number {
    return this.students.filter(s => (s.averages?.termAverage || 0) >= 10).length;
  }

  getStudentsBelow10(): number {
    return this.students.filter(s => (s.averages?.termAverage || 0) < 10).length;
  }

  getHighestGrade(): { student: Student; grade: number } | null {
    const studentsWithGrades = this.students
      .filter(s => s.averages?.termAverage !== undefined)
      .sort((a, b) => (b.averages?.termAverage || 0) - (a.averages?.termAverage || 0));
    
    if (studentsWithGrades.length === 0) return null;
    
    return {
      student: studentsWithGrades[0],
      grade: studentsWithGrades[0].averages?.termAverage || 0
    };
  }

  getLowestGrade(): { student: Student; grade: number } | null {
    const studentsWithGrades = this.students
      .filter(s => s.averages?.termAverage !== undefined)
      .sort((a, b) => (a.averages?.termAverage || 0) - (b.averages?.termAverage || 0));
    
    if (studentsWithGrades.length === 0) return null;
    
    return {
      student: studentsWithGrades[0],
      grade: studentsWithGrades[0].averages?.termAverage || 0
    };
  }

  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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
       '#', 'رقم الهوية أو الكود', 'الاسم', 'اللقب', 'تصحيح الدفتر (5)', 'الواجب (5)', 'الحضور (5)', 'السلوك (5)',
       'التقييم المستمر', 'التعبير الشفهي/العمل العملي', 'الفرض', 'الاختبار', 'المعدل', 'الترتيب'
     ]);

     // Data rows
     this.students.forEach((student, index) => {
       excelData.push([
         index + 1,
         student.idNumber || '-',
         student.firstName,
         student.lastName,
         student.calculatedGrades?.notebookCorrection?.toFixed(2) || '-',
         student.calculatedGrades?.duty?.toFixed(2) || '-',
         student.calculatedGrades?.attendance?.toFixed(2) || '-',
         student.calculatedGrades?.behavior?.toFixed(2) || '-',
         student.calculatedGrades?.continuousAssessment?.toFixed(2) || '-',
         student.calculatedGrades?.oralExpression?.toFixed(2) || '-',
         student.calculatedGrades?.assignment?.toFixed(2) || '-',
         student.calculatedGrades?.test?.toFixed(2) || '-',
         student.averages?.termAverage?.toFixed(2) || '-',
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

    try {
      const element = document.querySelector('.bg-white.rounded-lg.shadow-lg') as HTMLElement;
      if (!element) {
        alert('لم يتم العثور على المحتوى للتصدير');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `سجل_الدرجات_${this.selectedClass.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  }
}

