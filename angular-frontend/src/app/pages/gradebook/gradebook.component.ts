import { Component, OnInit } from '@angular/core';
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
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
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
  
  // Grade form
  formData: CreateGradeDto = {
    studentId: 0,
    assessmentId: 0,
    classId: 0,
    term: 1,
    score: 0,
    maxScore: 20,
    date: new Date().toISOString().split('T')[0]
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

  constructor(private apiService: ApiService) {}

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
        this.grades = data;
        // Initialize grades for each student
        this.students.forEach(student => {
          student.grades = data.filter(g => g.studentId === student.id);
        });
        // Load attendance and behavior data
        this.loadAttendanceForClass(classId);
        this.loadBehaviorForClass(classId);
        this.calculateAllGrades();
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        this.grades = [];
        this.students.forEach(student => {
          student.grades = [];
        });
        this.calculateAllGrades();
      }
    });
  }

  loadAttendanceForClass(classId: number): void {
    this.apiService.get<any[]>(`/attendance?classId=${classId}`).subscribe({
      next: (data) => {
        this.attendanceRecords = data;
        this.calculateAllGrades();
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.attendanceRecords = [];
      }
    });
  }

  loadBehaviorForClass(classId: number): void {
    this.apiService.get<any[]>(`/behavior-events?classId=${classId}`).subscribe({
      next: (data) => {
        this.behaviorEvents = data;
        this.calculateAllGrades();
      },
      error: (error) => {
        console.error('Error loading behavior:', error);
        this.behaviorEvents = [];
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
      notes: existingGrade?.notes
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
        // Recalculate grades after saving
        setTimeout(() => {
          this.calculateAllGrades();
        }, 100);
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
      
      this.formData.studentId = studentId;
      this.formData.assessmentId = assessmentId;
      this.formData.score = score;
      this.formData.classId = this.selectedClass!.id;
      this.formData.term = this.selectedTerm;
      this.formData.maxScore = assessment.maxScore;
      this.formData.date = this.formatDateForAPI(this.selectedDate);
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

    const existingGrade = this.grades.find(g => 
      g.studentId === this.formData.studentId && 
      g.assessmentId === this.formData.assessmentId &&
      g.classId === this.formData.classId
    );

    if (existingGrade) {
      this.apiService.patch<Grade>(`/grades/${existingGrade.id}`, this.formData).subscribe({
        next: () => {
          this.loadGradesForClass(this.formData.classId);
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
      this.apiService.post<Grade>('/grades', this.formData).subscribe({
        next: () => {
          this.loadGradesForClass(this.formData.classId);
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
    return this.grades.find(g => 
      g.studentId === studentId && 
      g.assessmentId === assessmentId &&
      g.classId === this.selectedClass?.id &&
      g.term === this.selectedTerm
    );
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
    this.students.forEach(student => {
      this.calculateStudentGrades(student);
    });
    this.calculateRankings();
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
        calculated[key] = this.calculateAutomaticGrade(student, assessment);
      } else if (assessment.type === 'continuous_assessment') {
        // Calculated automatically from notebook + duty + attendance + behavior
        calculated[key] = this.calculateAutomaticGrade(student, assessment);
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

  calculateAutomaticGrade(student: Student, assessment: Assessment): number {
    switch (assessment.type) {
      case 'attendance':
        return this.calculateAttendanceGrade(student);
      case 'behavior':
        return this.calculateBehaviorGrade(student);
      case 'continuous_assessment':
        return this.calculateContinuousAssessment(student);
      case 'practical_work':
        return this.calculatePracticalWorkGrade(student);
      default:
        return 0;
    }
  }

  calculateAttendanceGrade(student: Student): number {
    // Calculate from attendance records automatically
    // نبدأ من 3 نقاط
    // كل حضور أو معذور: +0.5
    // كل غياب أو مغادرة مبكرة: -0.5
    // كل متأخر: -0.25
    if (!this.selectedClass) return 3; // Default starting value
    
    const studentRecords = this.attendanceRecords.filter(r => r.studentId === student.id && r.classId === this.selectedClass?.id);
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
    
    // Clamp between 0 and 5
    return Math.max(0, Math.min(5, score));
  }

  calculateBehaviorGrade(student: Student): number {
    // Calculate from behavior events automatically
    // نبدأ من 3 نقاط، كل سلوك إيجابي +0.5، كل سلوك سلبي -0.5
    if (!this.selectedClass) return 3; // Default starting value
    
    const studentEvents = this.behaviorEvents.filter(e => e.studentId === student.id && e.classId === this.selectedClass?.id);
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
    
    // Clamp between 0 and 5
    return Math.max(0, Math.min(5, score));
  }

  calculateContinuousAssessment(student: Student): number {
    // Get calculated grades (attendance and behavior are automatic)
    const behavior = this.calculateBehaviorGrade(student);
    const attendance = this.calculateAttendanceGrade(student);
    
    // Get manual grades (both on 5 points scale)
    const dutyGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'duty')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === this.selectedTerm
    );
    const notebookGrade = this.grades.find(g => 
      g.studentId === student.id && 
      g.assessmentId === this.assessments.find(a => a.type === 'notebook_correction')?.id &&
      g.classId === this.selectedClass?.id &&
      g.term === this.selectedTerm
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
    const behavior = this.calculateBehaviorGrade(student);
    const attendance = this.calculateAttendanceGrade(student);
    
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
    
    // المعدل = ((التقييم المستمر + التعبير الشفهي/العمل العملي + الفرض) ÷ 3 + الاختبار × 2) ÷ 5
    const part1 = (continuousAssessment + oralExpression + assignment) / 3;
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
    const studentsWithAverages = this.students
      .filter(s => s.averages?.termAverage !== undefined)
      .sort((a, b) => (b.averages?.termAverage || 0) - (a.averages?.termAverage || 0));
    
    studentsWithAverages.forEach((student, index) => {
      student.ranking = index + 1;
    });
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
       '#', 'الاسم', 'اللقب', 'تصحيح الدفتر (5)', 'الواجب (5)', 'الحضور (5)', 'السلوك (5)',
       'التقييم المستمر', 'التعبير الشفهي/العمل العملي', 'الفرض', 'الاختبار', 'المعدل', 'الترتيب'
     ]);

     // Data rows
     this.students.forEach((student, index) => {
       excelData.push([
         index + 1,
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

