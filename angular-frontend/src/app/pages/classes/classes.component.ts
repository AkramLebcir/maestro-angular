import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { createPage1, createPage2, createPage3, createPage4 } from './classes-pdf-export';
import { ChartConfiguration, ChartOptions } from 'chart.js';

export interface Student {
  id: number;
  idNumber?: string;
  lastName: string;
  firstName: string;
  dateOfBirth?: Date | string;
  placeOfBirth?: string;
  gender?: 'male' | 'female';
  isRepeater?: boolean;
  studentId?: string;
  photo?: string;
  generalNotes?: string;
  classId?: number;
  group?: 1 | 2 | null;
  email?: string;
  studentNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: number;
  level: string;
  name: string;
  subject: string;
  labId?: number;
  lab?: {
    id: number;
    name: string;
    location?: string;
  };
  weeklySessions: number;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassDto {
  level: string;
  name: string;
  subject: string;
  labId?: number;
  weeklySessions: number;
}

export interface Lab {
  id: number;
  name: string;
  description?: string;
  location?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabDto {
  name: string;
  description?: string;
  location?: string;
  isAvailable?: boolean;
}

export interface Student {
  id: number;
  idNumber?: string;
  lastName: string;
  firstName: string;
  dateOfBirth?: Date | string;
  placeOfBirth?: string;
  gender?: 'male' | 'female';
  isRepeater?: boolean;
  studentId?: string;
  photo?: string;
  generalNotes?: string;
  classId?: number;
  group?: 1 | 2 | null;
  email?: string;
  studentNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}


@Component({
  standalone: false,
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.css']
})
export class ClassesComponent implements OnInit, OnDestroy {
  @ViewChild('classReportContent') classReportContent!: ElementRef;
  
  classes: Class[] = [];
  labs: Lab[] = [];
  showModal = false;
  showLabModal = false;
  showGroupModal = false;
  showClassReportModal = false;
  showExamPackagingModal = false;
  editingClass: Class | null = null;
  currentClassForGroups: Class | null = null;
  currentClassForReport: Class | null = null;
  currentClassForExamPackaging: Class | null = null;
  classReportData: any = null;
  classStudents: Student[] = [];
  selectedStudents: Set<number> = new Set();
  isExportingPDF = false;
  isExportingExamPackagingPDF = false;
  
  // Detailed report data
  classReportStudents: any[] = [];
  classReportAttendance: any[] = [];
  classReportBehaviorEvents: any[] = [];
  classReportGrades: any[] = [];
  classReportAssessments: any[] = [];
  allAssessments: any[] = []; // Store loaded assessments
  allBehaviors: any[] = [];
  
  // Attendance Charts
  attendanceDonutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['حاضر', 'غائب', 'معذور', 'متأخر', 'مغادر مبكراً'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#22c55e', '#ef4444', '#2563eb', '#f97316', '#eab308'],
      borderWidth: 1
    }]
  };
  attendanceDonutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  
  attendanceWeeklyChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { label: 'غائب', data: [], backgroundColor: '#ef4444' },
      { label: 'معذور', data: [], backgroundColor: '#2563eb' },
      { label: 'متأخر', data: [], backgroundColor: '#f97316' },
      { label: 'حاضر', data: [], backgroundColor: '#22c55e' },
      { label: 'مغادر مبكراً', data: [], backgroundColor: '#eab308' }
    ]
  };
  attendanceWeeklyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true }
    },
    plugins: {
      legend: { position: 'top' }
    }
  };
  
  // Behavior Charts
  behaviorLineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { label: 'إيجابي', data: [], borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', tension: 0.4 },
      { label: 'سلبي', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.4 }
    ]
  };
  behaviorLineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    },
    plugins: {
      legend: { position: 'top' }
    }
  };
  formData: CreateClassDto = {
    level: '',
    name: '',
    subject: '',
    weeklySessions: 0
  };
  labFormData: CreateLabDto = {
    name: '',
    description: '',
    location: '',
    isAvailable: true
  };

  classLevels = [
    { value: '1st_year_middle', label: 'السنة أولى متوسط' },
    { value: '2nd_year_middle', label: 'السنة ثانية متوسط' },
    { value: '3rd_year_middle', label: 'السنة ثالثة متوسط' },
    { value: '4th_year_middle', label: 'السنة رابعة متوسط' },
    { value: '1st_year_high', label: 'السنة أولى ثانوي' },
    { value: '2nd_year_high', label: 'السنة ثانية ثانوي' },
    { value: '3rd_year_high', label: 'السنة ثالثة ثانوي' }
  ];

  // Import functionality
  isImporting = false;
  private excelWorker: Worker | null = null;

  // Sorting functionality
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Exam Packaging Report Form Data
  examPackagingForm = {
    academicYearStart: '',
    academicYearEnd: '',
    subject: '',
    level: '',
    branch: '',
    className: '',
    studentCount: 0,
    paperCount: '',
    procedureDate: '',
    preparedBy: '',
    preparedDate: '',
    notes: ''
  };

  // School and teacher info
  schoolName = '';
  wilaya = '';
  teacherName = '';

  constructor(
    private apiService: ApiService,
    @Inject(LanguageService) public languageService: LanguageService,
    private authService: AuthService
  ) {}

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  // Import functionality
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        alert('يرجى اختيار ملف Excel صالح (.xlsx أو .xls)');
        event.target.value = '';
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت');
        event.target.value = '';
        return;
      }

      this.isImporting = true;
      
      // إرسال الملف إلى NestJS باستخدام apiService
      this.apiService.importDigitalization(file).subscribe({
        next: (response) => {
          this.isImporting = false;
          console.log('تمت المعالجة في السرفر بنجاح', response);
          const message = `تم استيراد ${response.importedCount} تلميذ بنجاح${response.createdClasses > 0 ? ` وتم إنشاء ${response.createdClasses} قسم جديد` : ''}`;
          alert(message);
          // تحديث الواجهة بالبيانات المستلمة
          this.loadClasses();
          event.target.value = '';
        },
        error: (err) => {
          this.isImporting = false;
          console.error('خطأ في الرفع', err);
          const errorMessage = err?.error?.message || err?.message || 'حدث خطأ أثناء استيراد البيانات';
          alert(errorMessage);
          event.target.value = '';
        }
      });
    }
  }

  private importClassesFromExcel(file: File): void {
    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      alert('يرجى اختيار ملف Excel صالح (.xlsx أو .xls)');
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت');
      return;
    }

    this.isImporting = true;
    this.currentFile = file;
    console.log('Importing classes from:', file.name);

    // استخدام Worker إذا كان متاحاً
    if (this.excelWorker) {
      // قراءة الملف كـ ArrayBuffer وإرساله إلى Worker
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        this.excelWorker?.postMessage({
          type: 'process',
          fileData: arrayBuffer,
          fileName: file.name
        });
      };
      reader.onerror = () => {
        this.isImporting = false;
        alert('حدث خطأ أثناء قراءة الملف');
        this.currentFile = null;
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Fallback: معالجة مباشرة بدون Worker
      console.warn('Worker not available, using direct processing');
      this.sendFileToAPI();
    }
  }

  // Sorting functionality
  sortClasses(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.classes.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'studentCount':
          aValue = a.studentCount;
          bValue = b.studentCount;
          break;
        case 'lab':
          aValue = this.getLabName(a.labId).toLowerCase();
          bValue = this.getLabName(b.labId).toLowerCase();
          break;
        case 'weeklySessions':
          aValue = a.weeklySessions;
          bValue = b.weeklySessions;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕️'; // Neutral sort icon
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  ngOnInit(): void {
    this.loadClasses();
    this.loadLabs();
    this.initializeWorker();
  }

  ngOnDestroy(): void {
    if (this.excelWorker) {
      this.excelWorker.terminate();
      this.excelWorker = null;
    }
  }

  private initializeWorker(): void {
    // Worker initialization disabled - webpack configuration needed for import.meta.url
    // Using direct processing fallback instead
    // TODO: Configure webpack to properly handle workers with import.meta.url
    this.excelWorker = null;
    
    // Original worker initialization code (commented out until webpack is configured):
    /*
    if (typeof Worker !== 'undefined') {
      try {
        // إنشاء Worker - استخدام import.meta.url متوافق مع webpack 5
        // ملاحظة: بدون .ts extension لأن webpack سيتولى البناء
        this.excelWorker = new Worker(
          new URL('../../workers/excel.worker', import.meta.url)
        );
        
        // الاستماع لرسائل Worker
        this.excelWorker.onmessage = ({ data }) => {
          if (data.type === 'success') {
            // تمت المعالجة بنجاح، الآن أرسل الملف إلى API
            this.sendFileToAPI();
          } else if (data.type === 'error') {
            this.isImporting = false;
            alert(data.error || 'حدث خطأ أثناء معالجة ملف Excel');
            this.currentFile = null;
          } else if (data.type === 'progress') {
            // يمكن إضافة شريط تقدم هنا إذا لزم الأمر
            console.log(`Progress: ${data.progress}%`);
          }
        };

        this.excelWorker.onerror = (error) => {
          console.error('Worker error:', error);
          this.isImporting = false;
          // Fallback to direct processing
          if (this.currentFile) {
            console.warn('Falling back to direct processing');
            this.sendFileToAPI();
          }
        };
      } catch (error) {
        console.warn('Failed to initialize Worker, using direct processing:', error);
        // Worker غير متاح، سيتم استخدام المعالجة المباشرة
        this.excelWorker = null;
      }
    } else {
      console.warn('Web Workers are not supported in this browser');
    }
    */
  }

  private currentFile: File | null = null;

  private sendFileToAPI(): void {
    if (!this.currentFile) return;

    this.apiService.importDigitalization(this.currentFile).subscribe({
      next: (result) => {
        this.isImporting = false;
        const message = `تم استيراد ${result.importedCount} تلميذ بنجاح${result.createdClasses > 0 ? ` وتم إنشاء ${result.createdClasses} قسم جديد` : ''}`;
        alert(message);
        this.loadClasses();
        this.currentFile = null;
      },
      error: (error) => {
        this.isImporting = false;
        console.error('Error importing:', error);
        const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء استيراد البيانات';
        alert(errorMessage);
        this.currentFile = null;
      }
    });
  }

  loadClasses(): void {
    this.apiService.get<Class[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      }
    });
  }

  loadLabs(): void {
    this.apiService.get<Lab[]>('/labs').subscribe({
      next: (data) => {
        this.labs = data;
      },
      error: (error) => {
        console.error('Error loading labs:', error);
      }
    });
  }

  openAddModal(): void {
    this.editingClass = null;
    this.formData = {
      level: '',
      name: '',
      subject: '',
      weeklySessions: 0
    };
    this.loadLabs(); // Reload labs to ensure we have the latest list
    this.showModal = true;
  }

  openEditModal(classItem: Class): void {
    this.editingClass = classItem;
    this.formData = {
      level: classItem.level,
      name: classItem.name,
      subject: classItem.subject,
      labId: classItem.labId,
      weeklySessions: classItem.weeklySessions
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingClass = null;
  }

  saveClass(): void {
    // Prepare the data for submission
    const submitData: any = {
      level: this.formData.level,
      name: this.formData.name,
      subject: this.formData.subject,
      weeklySessions: Number(this.formData.weeklySessions)
    };

    // Only include labId if it's defined and not null
    if (this.formData.labId !== undefined && this.formData.labId !== null) {
      submitData.labId = Number(this.formData.labId);
    }

    if (this.editingClass) {
      // Update existing class
      this.apiService.patch<Class>(`/classes/${this.editingClass.id}`, submitData).subscribe({
        next: () => {
          this.loadClasses();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating class:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تحديث القسم';
          alert(errorMessage);
        }
      });
    } else {
      // Create new class
      this.apiService.post<Class>('/classes', submitData).subscribe({
        next: () => {
          this.loadClasses();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating class:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء إضافة القسم';
          alert(errorMessage);
        }
      });
    }
  }

  deleteClass(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      this.apiService.delete(`/classes/${id}`).subscribe({
        next: () => {
          this.loadClasses();
        },
        error: (error) => {
          console.error('Error deleting class:', error);
          alert('حدث خطأ أثناء حذف القسم');
        }
      });
    }
  }

  getLevelLabel(level: string): string {
    const found = this.classLevels.find(l => l.value === level);
    return found ? found.label : level;
  }

  getLabName(labId?: number): string {
    if (!labId) return '-';
    const lab = this.labs.find(l => l.id === labId);
    return lab ? lab.name : `مخبر ${labId}`;
  }

  openLabModal(): void {
    this.labFormData = {
      name: '',
      description: '',
      location: '',
      isAvailable: true
    };
    this.showLabModal = true;
  }

  closeLabModal(): void {
    this.showLabModal = false;
  }

  saveLab(): void {
    const submitData: CreateLabDto = {
      name: this.labFormData.name,
      description: this.labFormData.description || undefined,
      location: this.labFormData.location || undefined,
      isAvailable: this.labFormData.isAvailable !== undefined ? this.labFormData.isAvailable : true
    };

    this.apiService.post<Lab>('/labs', submitData).subscribe({
      next: (newLab) => {
        this.loadLabs();
        this.closeLabModal();
        // Automatically select the newly created lab
        this.formData.labId = newLab.id;
        alert('تم إضافة المخبر بنجاح');
      },
      error: (error) => {
        console.error('Error creating lab:', error);
        const errorMessage = error?.error?.message || 
                           (error?.error?.error && Array.isArray(error.error.error) 
                             ? error.error.error.join(', ') 
                             : error.error?.error) ||
                           error?.message || 
                           'حدث خطأ أثناء إضافة المخبر';
        alert(errorMessage);
      }
    });
  }

  // Group Management
  openGroupModal(classItem: Class): void {
    this.currentClassForGroups = classItem;
    this.selectedStudents.clear();
    this.loadClassStudents(classItem.id);
    this.showGroupModal = true;
  }

  closeGroupModal(): void {
    this.showGroupModal = false;
    this.currentClassForGroups = null;
    this.classStudents = [];
    this.selectedStudents.clear();
  }

  loadClassStudents(classId: number): void {
    this.apiService.get<Student[]>('/students').subscribe({
      next: (allStudents) => {
        // Filter students by class
        this.classStudents = allStudents.filter(s => s.classId === classId);
        // Sort by name for better display
        this.classStudents.sort((a, b) => {
          const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
          const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.classStudents = [];
      }
    });
  }

  // Automatic Division
  divideByFirstName(): void {
    const sorted = [...this.classStudents].sort((a, b) => 
      (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase())
    );
    this.assignGroupsByHalf(sorted);
  }

  divideByLastName(): void {
    const sorted = [...this.classStudents].sort((a, b) => 
      (a.lastName || '').toLowerCase().localeCompare((b.lastName || '').toLowerCase())
    );
    this.assignGroupsByHalf(sorted);
  }

  divideByGender(): void {
    const males = this.classStudents.filter(s => s.gender === 'male');
    const females = this.classStudents.filter(s => s.gender === 'female');
    const unknown = this.classStudents.filter(s => !s.gender);
    
    // Sort each group alphabetically by last name
    males.sort((a, b) => (a.lastName || '').toLowerCase().localeCompare((b.lastName || '').toLowerCase()));
    females.sort((a, b) => (a.lastName || '').toLowerCase().localeCompare((b.lastName || '').toLowerCase()));
    unknown.sort((a, b) => (a.lastName || '').toLowerCase().localeCompare((b.lastName || '').toLowerCase()));
    
    // Combine: first half of males, first half of females, then second halves
    const allStudents: Student[] = [];
    const maleMid = Math.ceil(males.length / 2);
    const femaleMid = Math.ceil(females.length / 2);
    const unknownMid = Math.ceil(unknown.length / 2);
    
    // First halves → Group 1
    allStudents.push(...males.slice(0, maleMid));
    allStudents.push(...females.slice(0, femaleMid));
    allStudents.push(...unknown.slice(0, unknownMid));
    
    // Second halves → Group 2
    allStudents.push(...males.slice(maleMid));
    allStudents.push(...females.slice(femaleMid));
    allStudents.push(...unknown.slice(unknownMid));
    
    // Assign groups
    const totalFirstHalf = maleMid + femaleMid + unknownMid;
    allStudents.forEach((student, index) => {
      student.group = (index < totalFirstHalf) ? 1 : 2;
    });
    
    this.saveGroupAssignments();
  }

  assignGroupsByHalf(students: Student[]): void {
    const midPoint = Math.ceil(students.length / 2);
    students.forEach((student, index) => {
      student.group = (index < midPoint) ? 1 : 2;
    });
    this.saveGroupAssignments();
  }

  // Manual Assignment
  toggleStudentSelection(studentId: number): void {
    if (this.selectedStudents.has(studentId)) {
      this.selectedStudents.delete(studentId);
    } else {
      this.selectedStudents.add(studentId);
    }
  }

  assignSelectedToGroup(group: 1 | 2): void {
    if (this.selectedStudents.size === 0) {
      alert('يرجى اختيار تلاميذ أولاً');
      return;
    }

    this.selectedStudents.forEach(studentId => {
      const student = this.classStudents.find(s => s.id === studentId);
      if (student) {
        student.group = group;
      }
    });

    this.selectedStudents.clear();
    this.saveGroupAssignments();
  }

  removeFromGroup(studentId: number): void {
    const student = this.classStudents.find(s => s.id === studentId);
    if (student) {
      student.group = null;
      this.saveGroupAssignments();
    }
  }

  saveGroupAssignments(): void {
    const updates = this.classStudents.map(student => ({
      id: student.id,
      group: student.group
    }));

    let completed = 0;
    let errors = 0;

    if (updates.length === 0) {
      return;
    }

    updates.forEach(update => {
      const student = this.classStudents.find(s => s.id === update.id);
      if (!student) return;

      const updateData: any = { group: update.group };
      
      this.apiService.patch<Student>(`/students/${update.id}`, updateData).subscribe({
        next: () => {
          completed++;
          if (completed + errors === updates.length) {
            if (errors === 0) {
              alert('تم حفظ تقسيم المجموعات بنجاح');
            } else {
              alert(`تم حفظ ${completed} تلميذ، فشل ${errors}`);
            }
          }
        },
        error: (error) => {
          console.error(`Error updating student ${update.id}:`, error);
          errors++;
          if (completed + errors === updates.length) {
            alert(`تم حفظ ${completed} تلميذ، فشل ${errors}`);
          }
        }
      });
    });
  }

  getGroup1Students(): Student[] {
    return this.classStudents.filter(s => s.group === 1);
  }

  getGroup2Students(): Student[] {
    return this.classStudents.filter(s => s.group === 2);
  }

  getUngroupedStudents(): Student[] {
    return this.classStudents.filter(s => !s.group || s.group === null);
  }

  isStudentSelected(studentId: number): boolean {
    return this.selectedStudents.has(studentId);
  }

  async openClassReportModal(classItem: Class): Promise<void> {
    this.currentClassForReport = classItem;
    this.showClassReportModal = true;
    
    // Load all detailed data
    await this.loadDetailedClassReportData();
  }

  async loadDetailedClassReportData(): Promise<void> {
    if (!this.currentClassForReport) return;
    
    try {
      // Load assessments first (async)
      this.loadAssessments();
      
      // Load students
      this.apiService.get<Student[]>(`/students?classId=${this.currentClassForReport.id}`).subscribe({
        next: (students) => {
          this.classReportStudents = students || [];
          // Initialize average to 0 for all students
          this.classReportStudents.forEach(s => {
            s.average = 0;
          });
          // Load grades after students are loaded
          this.loadClassReportGrades();
        },
        error: (error) => {
          console.error('Error loading students:', error);
          this.classReportStudents = [];
        }
      });
      
      // Load attendance
      this.apiService.get<any[]>(`/attendance?classId=${this.currentClassForReport.id}`).subscribe({
        next: (attendance) => {
          this.classReportAttendance = attendance;
          this.updateAttendanceCharts();
          this.calculateTopAttendanceStudents();
        },
        error: (error) => {
          console.error('Error loading attendance:', error);
          this.classReportAttendance = [];
        }
      });
      
      // Load behavior events
      this.apiService.get<any[]>(`/behavior-events?classId=${this.currentClassForReport.id}`).subscribe({
        next: (events) => {
          this.classReportBehaviorEvents = events;
          this.loadBehaviors();
          this.updateBehaviorCharts();
          this.calculateTopBehaviorStudents();
        },
        error: (error) => {
          console.error('Error loading behavior:', error);
          this.classReportBehaviorEvents = [];
        }
      });
      
      // Load summary report data
    try {
      const reportData = await this.apiService
          .get<any>(`/classes/${this.currentClassForReport.id}/summary-report`)
        .toPromise();
        this.classReportData = reportData;
      } catch (error) {
        console.error('Error loading summary report:', error);
        // Continue without summary data
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      alert('حدث خطأ أثناء تحميل بيانات التقرير');
    }
  }

  loadClassReportGrades(): void {
    if (!this.currentClassForReport) return;
    
    this.apiService.get<any[]>(`/grades?classId=${this.currentClassForReport.id}`).subscribe({
      next: (grades) => {
        this.classReportGrades = grades || [];
        // Wait a bit for assessments to load, then calculate
        // Try multiple times to ensure assessments are loaded
        let attempts = 0;
        const maxAttempts = 5;
        const calculateWithRetry = () => {
          attempts++;
          if (this.allAssessments.length > 0 || attempts >= maxAttempts) {
            this.calculateStudentAverages();
            this.calculateAssessmentStats();
          } else {
            setTimeout(calculateWithRetry, 100);
          }
        };
        setTimeout(calculateWithRetry, 100);
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        this.classReportGrades = [];
        // Still calculate with empty grades
        this.calculateStudentAverages();
        this.calculateAssessmentStats();
      }
    });
  }

  loadAssessments(): void {
    this.apiService.get<any[]>('/assessments').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allAssessments = data;
        } else {
          this.allAssessments = [];
        }
        // Recalculate stats after loading assessments
        if (this.classReportGrades.length > 0) {
          this.calculateStudentAverages();
          this.calculateAssessmentStats();
        }
      },
      error: (error) => {
        console.error('Error loading assessments:', error);
        this.allAssessments = [];
        // Still calculate with empty assessments
        if (this.classReportGrades.length > 0) {
          this.calculateStudentAverages();
          this.calculateAssessmentStats();
        }
      }
    });
  }

  loadBehaviors(): void {
    this.apiService.get<any[]>('/behaviors').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allBehaviors = data;
        } else {
          this.allBehaviors = [
            { id: 1, type: 'positive', nameAr: 'سلوك عام جيد' },
            { id: 2, type: 'positive', nameAr: 'تقدم جيد' },
            { id: 3, type: 'positive', nameAr: 'متعاون' },
            { id: 4, type: 'positive', nameAr: 'إنجاز الواجب في الوقت المحدد' },
            { id: 5, type: 'positive', nameAr: 'مشارك' },
            { id: 6, type: 'negative', nameAr: 'سلوك عام سيء' },
            { id: 7, type: 'negative', nameAr: 'استخدام الهاتف بشكل مفرط' },
            { id: 8, type: 'negative', nameAr: 'شجار' },
            { id: 9, type: 'negative', nameAr: 'مشاكل في الواجب' },
            { id: 10, type: 'negative', nameAr: 'ثرثرة' }
          ];
        }
      },
      error: () => {
        this.allBehaviors = [];
      }
    });
  }

  closeClassReportModal(): void {
    this.showClassReportModal = false;
    this.currentClassForReport = null;
    this.classReportData = null;
    this.classReportStudents = [];
    this.classReportAttendance = [];
    this.classReportBehaviorEvents = [];
    this.classReportGrades = [];
    this.classReportAssessments = [];
  }
  
  // Helper properties for template
  get topAttendanceStudents() {
    return this.calculateTopAttendanceStudents();
  }
  
  get topBehaviorStudents() {
    return this.calculateTopBehaviorStudents();
  }
  
  get studentsAtRisk() {
    return this.getStudentsAtRisk();
  }
  
  get topPerformingStudents() {
    return this.getTopPerformingStudents();
  }

  getTotalPositiveBehavior(): number {
    if (!this.topBehaviorStudents || !this.topBehaviorStudents.positive) {
      return 0;
    }
    return this.topBehaviorStudents.positive.reduce((sum: number, s: { name: string, positive: number, negative: number }) => sum + (s.positive || 0), 0);
  }

  getTotalNegativeBehavior(): number {
    if (!this.topBehaviorStudents || !this.topBehaviorStudents.negative) {
      return 0;
    }
    return this.topBehaviorStudents.negative.reduce((sum: number, s: { name: string, positive: number, negative: number }) => sum + (s.negative || 0), 0);
  }

  async exportClassReportToPDF(): Promise<void> {
    if (!this.classReportContent || !this.currentClassForReport || !this.classReportData) {
      alert('يرجى التأكد من تحميل بيانات التقرير');
      return;
    }

    this.isExportingPDF = true;
    const contentElement = this.classReportContent.nativeElement;
    const exportButton = document.querySelector('[data-export-class-pdf]') as HTMLElement;
    
    // Disable export button temporarily
    if (exportButton) {
      (exportButton as HTMLButtonElement).disabled = true;
    }

    // Store original styles
    const originalMaxHeight = contentElement.style.maxHeight;
    const originalOverflow = contentElement.style.overflow;
    const originalHeight = contentElement.style.height;

    // Make content fully visible for capture
    contentElement.style.maxHeight = 'none';
    contentElement.style.overflow = 'visible';
    contentElement.style.height = 'auto';

    // Scroll to top
    const scrollableContent = contentElement.querySelector('.overflow-y-auto');
    if (scrollableContent) {
      (scrollableContent as HTMLElement).scrollTop = 0;
    }

    // Wait a bit for the layout to update and charts to render
    setTimeout(async () => {
      try {
        // Wait a bit more for charts to fully render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use html2canvas to capture the content
        const canvas = await html2canvas(contentElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: contentElement.scrollWidth,
          windowHeight: contentElement.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          allowTaint: true
        });

        // Restore original styles
        contentElement.style.maxHeight = originalMaxHeight;
        contentElement.style.overflow = originalOverflow;
        contentElement.style.height = originalHeight;

        // Enable the button again
        if (exportButton) {
          (exportButton as HTMLButtonElement).disabled = false;
        }

        this.isExportingPDF = false;

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const doc = new jsPDF('p', 'mm', 'a4');
        let position = 0;

        // Add first page
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Generate file name
        if (!this.currentClassForReport) {
          throw new Error('Missing class data');
        }
        
        const className = this.currentClassForReport.name.replace(/\s+/g, '_');
        const date = new Date().toISOString().split('T')[0];
        const fileName = `تقرير_القسم_${className}_${date}.pdf`;

        // Save the PDF
        doc.save(fileName);
      } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('حدث خطأ أثناء تصدير التقرير إلى PDF');
        this.isExportingPDF = false;
        
        // Restore styles in case of error
        contentElement.style.maxHeight = originalMaxHeight;
        contentElement.style.overflow = originalOverflow;
        contentElement.style.height = originalHeight;
        if (exportButton) {
          (exportButton as HTMLButtonElement).disabled = false;
        }
      }
    }, 300);
  }

  // Keep the old method for backward compatibility (if needed)
  async exportClassSummaryReport(classItem: Class): Promise<void> {
    // Redirect to modal view
    await this.openClassReportModal(classItem);
  }

  calculateStudentAverages(): void {
    if (!this.classReportStudents || this.classReportStudents.length === 0) return;
    if (!this.classReportGrades || this.classReportGrades.length === 0) {
      // No grades, set all averages to 0
      this.classReportStudents.forEach(student => {
        student.average = 0;
      });
      return;
    }
    
    // Calculate average for each student
    this.classReportStudents.forEach(student => {
      const studentGrades = this.classReportGrades.filter(g => g.studentId === student.id);
      if (studentGrades.length > 0) {
        let totalWeightedScore = 0;
        let totalWeight = 0;
        
        studentGrades.forEach(grade => {
          // Ensure we have valid numbers
          const score = parseFloat(grade.score) || 0;
          const maxScore = parseFloat(grade.maxScore) || 1;
          
          // Normalize score to 10
          const normalizedScore = maxScore > 0 ? (score / maxScore) * 10 : 0;
          
          // Get weight from assessment, default to 1
          const assessment = this.allAssessments.find(a => a.id === grade.assessmentId);
          const weight = (assessment?.weight && assessment.weight > 0) ? assessment.weight : 1;
          
          totalWeightedScore += normalizedScore * weight;
          totalWeight += weight;
        });
        
        student.average = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
      } else {
        student.average = 0;
      }
    });
    
    // Sort students by average descending
    this.classReportStudents.sort((a, b) => (b.average || 0) - (a.average || 0));
  }

  updateAttendanceCharts(): void {
    // Calculate attendance counts
    const counts = {
      present: 0,
      absent: 0,
      excused: 0,
      late: 0,
      leftEarly: 0
    };
    
    this.classReportAttendance.forEach(record => {
      if (record.status === 'present') counts.present++;
      else if (record.status === 'absent') counts.absent++;
      else if (record.status === 'excused') counts.excused++;
      else if (record.status === 'late') counts.late++;
      else if (record.status === 'left_early') counts.leftEarly++;
    });
    
    // Update donut chart
    this.attendanceDonutChartData = {
      ...this.attendanceDonutChartData,
      datasets: [{
        ...this.attendanceDonutChartData.datasets[0],
        data: [counts.present, counts.absent, counts.excused, counts.late, counts.leftEarly]
      }]
    };
    
    // Update weekly chart
    const weeklyData = this.calculateWeeklyAttendance();
    this.attendanceWeeklyChartData = {
      labels: weeklyData.labels,
      datasets: [
        { label: 'غائب', data: weeklyData.absent, backgroundColor: '#ef4444' },
        { label: 'معذور', data: weeklyData.excused, backgroundColor: '#2563eb' },
        { label: 'متأخر', data: weeklyData.late, backgroundColor: '#f97316' },
        { label: 'حاضر', data: weeklyData.present, backgroundColor: '#22c55e' },
        { label: 'مغادر مبكراً', data: weeklyData.leftEarly, backgroundColor: '#eab308' }
      ]
    };
  }

  calculateWeeklyAttendance(): any {
    const periods: { [key: string]: { present: number, absent: number, excused: number, late: number, leftEarly: number } } = {};
    const labels: string[] = [];
    
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - (i * 7));
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      
      const label = this.formatDate(periodStart);
      labels.push(label);
      periods[label] = { present: 0, absent: 0, excused: 0, late: 0, leftEarly: 0 };
      
      this.classReportAttendance.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate >= periodStart && recordDate <= periodEnd) {
          if (record.status === 'present') periods[label].present++;
          else if (record.status === 'absent') periods[label].absent++;
          else if (record.status === 'excused') periods[label].excused++;
          else if (record.status === 'late') periods[label].late++;
          else if (record.status === 'left_early') periods[label].leftEarly++;
        }
      });
    }
    
    return {
      labels,
      present: labels.map(l => periods[l].present),
      absent: labels.map(l => periods[l].absent),
      excused: labels.map(l => periods[l].excused),
      late: labels.map(l => periods[l].late),
      leftEarly: labels.map(l => periods[l].leftEarly)
    };
  }

  calculateTopAttendanceStudents(): any {
    const studentCounts: { [studentId: number]: { name: string, present: number, absent: number, excused: number, late: number, leftEarly: number } } = {};
    
    this.classReportAttendance.forEach(record => {
      if (!studentCounts[record.studentId]) {
        const student = this.classReportStudents.find(s => s.id === record.studentId);
        studentCounts[record.studentId] = {
          name: student ? `${student.firstName} ${student.lastName}` : `Student ${record.studentId}`,
          present: 0,
          absent: 0,
          excused: 0,
          late: 0,
          leftEarly: 0
        };
      }
      
      if (record.status === 'present') studentCounts[record.studentId].present++;
      else if (record.status === 'absent') studentCounts[record.studentId].absent++;
      else if (record.status === 'excused') studentCounts[record.studentId].excused++;
      else if (record.status === 'late') studentCounts[record.studentId].late++;
      else if (record.status === 'left_early') studentCounts[record.studentId].leftEarly++;
    });
    
    return {
      present: Object.values(studentCounts).sort((a, b) => b.present - a.present).slice(0, 5),
      absent: Object.values(studentCounts).sort((a, b) => b.absent - a.absent).slice(0, 5),
      excused: Object.values(studentCounts).sort((a, b) => b.excused - a.excused).slice(0, 5),
      late: Object.values(studentCounts).sort((a, b) => b.late - a.late).slice(0, 5),
      leftEarly: Object.values(studentCounts).sort((a, b) => b.leftEarly - a.leftEarly).slice(0, 5)
    };
  }

  updateBehaviorCharts(): void {
    const weeklyData = this.calculateWeeklyBehavior();
    this.behaviorLineChartData = {
      labels: weeklyData.labels,
      datasets: [
        { 
          label: 'إيجابي', 
          data: weeklyData.positive, 
          borderColor: '#22c55e', 
          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
          tension: 0.4 
        },
        { 
          label: 'سلبي', 
          data: weeklyData.negative, 
          borderColor: '#ef4444', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          tension: 0.4 
        }
      ]
    };
  }

  calculateWeeklyBehavior(): any {
    const periods: { [key: string]: { positive: number, negative: number } } = {};
    const labels: string[] = [];
    
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - (i * 7));
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      
      const label = this.formatDate(periodStart);
      labels.push(label);
      periods[label] = { positive: 0, negative: 0 };
      
      this.classReportBehaviorEvents.forEach(event => {
        const eventDate = new Date(event.date);
        if (eventDate >= periodStart && eventDate <= periodEnd) {
          const behavior = this.allBehaviors.find(b => b.id === event.behaviorId);
          if (behavior?.type === 'positive') {
            periods[label].positive++;
          } else if (behavior?.type === 'negative') {
            periods[label].negative++;
          }
        }
      });
    }
    
    return {
      labels,
      positive: labels.map(l => periods[l].positive),
      negative: labels.map(l => periods[l].negative)
    };
  }

  calculateTopBehaviorStudents(): any {
    const studentCounts: { [studentId: number]: { name: string, positive: number, negative: number } } = {};
    
    this.classReportBehaviorEvents.forEach(event => {
      if (!studentCounts[event.studentId]) {
        const student = this.classReportStudents.find(s => s.id === event.studentId);
        studentCounts[event.studentId] = {
          name: student ? `${student.firstName} ${student.lastName}` : `Student ${event.studentId}`,
          positive: 0,
          negative: 0
        };
      }
      
      const behavior = this.allBehaviors.find(b => b.id === event.behaviorId);
      if (behavior?.type === 'positive') {
        studentCounts[event.studentId].positive++;
      } else if (behavior?.type === 'negative') {
        studentCounts[event.studentId].negative++;
      }
    });
    
    return {
      positive: Object.values(studentCounts).sort((a, b) => b.positive - a.positive).slice(0, 5),
      negative: Object.values(studentCounts).sort((a, b) => b.negative - a.negative).slice(0, 5)
    };
  }

  calculateAssessmentStats(): void {
    if (!this.classReportGrades || this.classReportGrades.length === 0) {
      this.classReportAssessments = [];
      return;
    }
    
    // Group grades by assessmentId
    const assessmentGroups: { [assessmentId: number]: { scores: number[], maxScore: number, name: string, weight: number } } = {};
    
    this.classReportGrades.forEach(grade => {
      const assessmentId = grade.assessmentId;
      if (!assessmentGroups[assessmentId]) {
        const assessment = this.allAssessments.find(a => a.id === assessmentId);
        assessmentGroups[assessmentId] = {
          scores: [],
          maxScore: parseFloat(grade.maxScore) || 10,
          name: assessment?.nameAr || assessment?.name || `Assessment ${assessmentId}`,
          weight: (assessment?.weight && assessment.weight > 0) ? assessment.weight : 0
        };
      }
      
      // Ensure we have valid numbers
      const score = parseFloat(grade.score) || 0;
      const maxScore = parseFloat(grade.maxScore) || 1;
      
      // Normalize score to 10
      const normalizedScore = maxScore > 0 ? (score / maxScore) * 10 : 0;
      assessmentGroups[assessmentId].scores.push(normalizedScore);
    });
    
    // Calculate total weight for percentage calculation
    const totalWeight = Object.values(assessmentGroups).reduce((sum, group) => sum + (group.weight || 0), 0);
    
    // Calculate stats for each assessment
    this.classReportAssessments = Object.keys(assessmentGroups).map(assessmentId => {
      const group = assessmentGroups[parseInt(assessmentId)];
      const scores = group.scores;
      
      if (scores.length === 0) {
        return {
          id: parseInt(assessmentId),
          name: group.name,
          max: 0,
          min: 0,
          average: 0,
          median: 0,
          weight: 0,
          weightPercent: 0
        };
      }
      
      const sorted = [...scores].sort((a, b) => a - b);
      const weightPercent = totalWeight > 0 ? ((group.weight || 0) / totalWeight) * 100 : 0;
      
      return {
        id: parseInt(assessmentId),
        name: group.name,
        max: Math.max(...scores),
        min: Math.min(...scores),
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
        median: sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)],
        weight: group.weight || 0,
        weightPercent: weightPercent
      };
    });
  }

  getStudentsAtRisk(): any[] {
    // Students with average below 5
    return this.classReportStudents.filter(s => (s.average || 0) < 5).slice(0, 10);
  }

  getTopPerformingStudents(): any[] {
    // Students with average above 8
    return this.classReportStudents.filter(s => (s.average || 0) >= 8).slice(0, 10);
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  }

  // Exam Packaging Report Methods
  openExamPackagingModal(classItem: Class): void {
    this.currentClassForExamPackaging = classItem;
    
    // Load teacher and school info
    const user = this.authService.getCurrentUser();
    if (user) {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      this.teacherName = `${firstName} ${lastName}`.trim() || user.email || '';
    }

    // Try to get school info from localStorage (teacher card)
    if (user) {
      // Try with user-specific key first
      const userSpecificKey = `teacherCard_${user.id}`;
      let storedCard = localStorage.getItem(userSpecificKey);
      
      // Fallback to general key
      if (!storedCard) {
        storedCard = localStorage.getItem('teacherCard');
      }
      
      if (storedCard) {
        try {
          const cardData = JSON.parse(storedCard);
          if (cardData.schoolName) {
            this.schoolName = cardData.schoolName;
          }
          if (cardData.wilayaDirectorate) {
            this.wilaya = cardData.wilayaDirectorate;
          } else if (cardData.wilaya) {
            this.wilaya = cardData.wilaya;
          }
        } catch (e) {
          console.error('Error parsing teacher card', e);
        }
      }
    }

    // Get current academic year (assuming it starts in September)
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const academicYearStart = month >= 8 ? currentYear : currentYear - 1; // September = 8
    const academicYearEnd = academicYearStart + 1;

    // Initialize form with class data
    this.examPackagingForm = {
      academicYearStart: academicYearStart.toString(),
      academicYearEnd: academicYearEnd.toString(),
      subject: classItem.subject || '',
      level: this.getLevelLabel(classItem.level),
      branch: '', // Optional field
      className: classItem.name || '',
      studentCount: classItem.studentCount || 0,
      paperCount: '',
      procedureDate: this.formatDateForInput(now),
      preparedBy: this.teacherName,
      preparedDate: this.formatDateForInput(now),
      notes: ''
    };

    this.showExamPackagingModal = true;
  }

  closeExamPackagingModal(): void {
    this.showExamPackagingModal = false;
    this.currentClassForExamPackaging = null;
    this.examPackagingForm = {
      academicYearStart: '',
      academicYearEnd: '',
      subject: '',
      level: '',
      branch: '',
      className: '',
      studentCount: 0,
      paperCount: '',
      procedureDate: '',
      preparedBy: '',
      preparedDate: '',
      notes: ''
    };
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '';
    }
  }

  parseNumber(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const parsed = parseInt(value.toString(), 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  isPaperCountValid(): boolean {
    if (!this.examPackagingForm.paperCount) return true;
    const paperCount = this.parseNumber(this.examPackagingForm.paperCount);
    return paperCount <= this.examPackagingForm.studentCount;
  }

  async exportExamPackagingToPDF(): Promise<void> {
    if (!this.currentClassForExamPackaging) return;

    this.isExportingExamPackagingPDF = true;

    try {
      // Reload teacher card data before export
      const user = this.authService.getCurrentUser();
      if (user) {
        // Try to get school info from localStorage (teacher card)
        const userSpecificKey = `teacherCard_${user.id}`;
        let storedCard = localStorage.getItem(userSpecificKey);
        
        // Fallback to general key
        if (!storedCard) {
          storedCard = localStorage.getItem('teacherCard');
        }
        
        if (storedCard) {
          try {
            const cardData = JSON.parse(storedCard);
            if (cardData.schoolName) {
              this.schoolName = cardData.schoolName;
            }
            if (cardData.wilayaDirectorate) {
              this.wilaya = cardData.wilayaDirectorate;
            } else if (cardData.wilaya) {
              this.wilaya = cardData.wilaya;
            }
          } catch (e) {
            console.error('Error parsing teacher card', e);
          }
        }
      }

      // Create a temporary container for the PDF content - optimized for single page
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.height = '297mm'; // Fixed height for single page
      container.style.padding = '15mm'; // Reduced padding
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
      container.style.direction = 'rtl';
      container.style.textAlign = 'right';
      container.style.boxSizing = 'border-box';
      container.style.overflow = 'hidden'; // Prevent overflow
      document.body.appendChild(container);

      // Header - reduced margins
      const header = document.createElement('div');
      header.style.marginBottom = '15px';
      header.style.textAlign = 'center';
      header.innerHTML = `
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">الجمهورية الجزائرية الديمقراطية الشعبية</div>
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">وزارة التربية الوطنية</div>
        <div style="font-size: 12px; margin-bottom: 3px;">مديرية التربية لولاية : ${this.wilaya || '…………………'}</div>
        <div style="font-size: 12px; margin-bottom: 10px;">المؤسسة التعليمية : ${this.schoolName || '……………………………………'}</div>
      `;
      container.appendChild(header);

      // Title - reduced margins
      const title = document.createElement('div');
      title.style.fontSize = '16px';
      title.style.fontWeight = 'bold';
      title.style.textAlign = 'center';
      title.style.marginBottom = '15px';
      title.style.textDecoration = 'underline';
      title.textContent = 'محضر تغليف أوراق امتحان';
      container.appendChild(title);

      // Form fields - reduced line height and margins
      const fieldsContainer = document.createElement('div');
      fieldsContainer.style.fontSize = '12px';
      fieldsContainer.style.lineHeight = '1.6';
      
      const fields = [
        { label: 'السنة الدراسية:', value: `${this.examPackagingForm.academicYearStart} / ${this.examPackagingForm.academicYearEnd}` },
        { label: 'المادة :', value: this.examPackagingForm.subject || '……………………………………………' },
        { label: 'المستوى :', value: this.examPackagingForm.level || '………………………………………' },
        { label: 'الشعبة (إن وجدت):', value: this.examPackagingForm.branch || '………………………………' },
        { label: 'القسم :', value: this.examPackagingForm.className || '……………………………………………' },
        { label: 'عدد تلاميذ القسم :', value: this.examPackagingForm.studentCount.toString() || '.................................' },
        { label: 'عدد الأوراق :', value: this.examPackagingForm.paperCount || '……………………………………' },
        { label: 'تاريخ الإجراء :', value: this.formatDateForDisplay(this.examPackagingForm.procedureDate) || '……. / ……. / ……..' }
      ];

      fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.style.marginBottom = '8px';
        fieldDiv.style.display = 'flex';
        fieldDiv.style.justifyContent = 'space-between';
        fieldDiv.innerHTML = `
          <span style="font-weight: bold;">${field.label}</span>
          <span>${field.value}</span>
        `;
        fieldsContainer.appendChild(fieldDiv);
      });

      container.appendChild(fieldsContainer);

      // Separator - reduced margins
      const separator = document.createElement('div');
      separator.style.borderTop = '1px solid #000';
      separator.style.marginTop = '15px';
      separator.style.marginBottom = '15px';
      container.appendChild(separator);

      // Footer text - reduced margins
      const footerText = document.createElement('div');
      footerText.style.fontSize = '12px';
      footerText.style.marginBottom = '10px';
      footerText.textContent = 'تم تصحيح أوراق هذا الامتحان وإرجاعها إلى الإدارة بعد الاطلاع عليها من طرف التلاميذ.';
      container.appendChild(footerText);

      // Prepared by and date - reduced margins
      const preparedDiv = document.createElement('div');
      preparedDiv.style.fontSize = '12px';
      preparedDiv.style.marginBottom = '10px';
      preparedDiv.innerHTML = `
        <div style="margin-bottom: 5px;">حرر بـ : ${this.examPackagingForm.preparedBy || '………………………'}</div>
        <div>في : ${this.formatDateForDisplay(this.examPackagingForm.preparedDate) || '……. / ……. / ……..'}</div>
      `;
      container.appendChild(preparedDiv);

      // Notes section - reduced margins
      if (this.examPackagingForm.notes) {
        const notesDiv = document.createElement('div');
        notesDiv.style.fontSize = '11px';
        notesDiv.style.marginBottom = '10px';
        notesDiv.style.padding = '5px';
        notesDiv.style.border = '1px solid #ccc';
        notesDiv.style.borderRadius = '4px';
        notesDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 3px;">ملاحظات:</div>
          <div>${this.examPackagingForm.notes}</div>
        `;
        container.appendChild(notesDiv);
      }

      // Signatures - reduced margins
      const signaturesDiv = document.createElement('div');
      signaturesDiv.style.marginTop = '20px';
      signaturesDiv.style.display = 'flex';
      signaturesDiv.style.justifyContent = 'space-between';
      signaturesDiv.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 30px;">إمضاء الإدارة:</div>
          <div style="border-top: 1px solid #000; width: 120px; margin: 0 auto;"></div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 30px;">إمضاء الأستاذ(ة):</div>
          <div style="border-top: 1px solid #000; width: 120px; margin: 0 auto;"></div>
        </div>
      `;
      container.appendChild(signaturesDiv);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force layout recalculation
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.offsetHeight; // Force reflow

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: container.scrollWidth,
        height: container.scrollHeight,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight
      });

      // Remove container
      document.body.removeChild(container);

      // Create PDF - single page only
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const pageWidth = 210;
      
      // Calculate scale to fit in one page
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      // Scale down if content is taller than page
      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        finalHeight = pageHeight;
        finalWidth = imgWidth * scale;
      }
      
      // Center horizontally if scaled down
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = 0;
      
      // Add image to single page only
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Save PDF
      const fileName = `محضر_تغليف_أوراق_امتحان_${this.examPackagingForm.className}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      this.isExportingExamPackagingPDF = false;
    } catch (error) {
      console.error('Error exporting exam packaging PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
      this.isExportingExamPackagingPDF = false;
    }
  }
}

