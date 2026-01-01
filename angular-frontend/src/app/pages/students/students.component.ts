import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { ChartConfiguration, ChartOptions, ChartData } from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface SpecialCase {
  category: 'health' | 'exemption' | 'learning_difficulty';
  details: string;
  requiredAction: string;
  attachments?: string[];
  startDate?: string;
  endDate?: string;
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
  specialCases?: SpecialCase[] | null;
  classId?: number;
  group?: 1 | 2 | null;
  class?: {
    id: number;
    name: string;
  };
  email?: string;
  studentNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentDto {
  idNumber?: string;
  lastName: string;
  firstName: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: 'male' | 'female';
  isRepeater?: boolean;
  studentId?: string;
  photo?: string;
  generalNotes?: string;
  specialCases?: SpecialCase[];
  classId?: number;
  group?: 1 | 2 | null;
  email?: string;
  studentNumber?: string;
}

export interface Class {
  id: number;
  name: string;
  level: string;
}

@Component({
  standalone: false,
  selector: 'app-students',
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;
  
  students: Student[] = [];
  filteredStudents: Student[] = [];
  classes: Class[] = [];
  showModal = false;
  editingStudent: Student | null = null;
  
  // Search and filter
  searchTerm: string = '';
  selectedClassFilter: number | null = null;
  selectedGenderFilter: 'male' | 'female' | null = null;
  selectedRepeaterFilter: boolean | null = null;
  selectedGroupFilter: 1 | 2 | null = null;
  
  // Sort
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Form data
  formData: CreateStudentDto = {
    lastName: '',
    firstName: '',
    isRepeater: false
  };
  
  // File upload
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  
  // Special Cases Management
  showPrivacyMode: boolean = false; // Privacy toggle for hiding sensitive cases
  editingSpecialCaseIndex: number | null = null;
  currentSpecialCase: Partial<SpecialCase> = {};
  specialCaseAttachmentFiles: File[] = [];
  specialCaseAttachmentPreviews: string[] = [];
  
  // Excel import
  isImporting: boolean = false;
  importProgress: { total: number; success: number; failed: number; errors: string[] } = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };
  showImportModal: boolean = false;
  showHeaderRowModal: boolean = false;
  showSheetSelectorModal: boolean = false;
  pendingExcelData: Array<{ students: any[], className: string, startRow: number, rawData: any[][] }> = [];
  selectedHeaderRow: { [sheetName: string]: number } = {};
  detectedHeaderRow: { [sheetName: string]: number } = {};
  availableSheets: Array<{ sheetName: string; detectedRow: number; rawData: any[][] }> = [];
  selectedSheetsForImport: string[] = []; // Array of sheet names to import
  importAllSheets: boolean = true; // Default to import all sheets

  // Student Report Modal
  showReportModal: boolean = false;
  reportStudent: Student | null = null;
  reportSelectedClass: Class | null = null;
  reportStudentClasses: Class[] = []; // All classes the student belongs to
  isExportingPDF: boolean = false;
  
  // Report Data
  reportAttendance: any[] = [];
  reportBehaviorEvents: any[] = [];
  reportGrades: any[] = [];
  reportOverallGrade: number = 0;
  reportSubject: string = '';
  allBehaviors: any[] = [];
  
  // Attendance Chart
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
      legend: {
        position: 'right'
      }
    }
  };
  
  // Attendance Bi-weekly Chart
  attendanceBiWeeklyChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { label: 'غائب', data: [], backgroundColor: '#ef4444' },
      { label: 'معذور', data: [], backgroundColor: '#2563eb' },
      { label: 'متأخر', data: [], backgroundColor: '#f97316' },
      { label: 'حاضر', data: [], backgroundColor: '#22c55e' },
      { label: 'مريض', data: [], backgroundColor: '#eab308' }
    ]
  };
  attendanceBiWeeklyChartOptions: ChartOptions<'bar'> = {
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
  
  // Behavior Line Chart
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
  
  // Grades Bar Chart
  gradesBarChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      label: 'الدرجة',
      data: [],
      backgroundColor: '#2563eb',
      borderColor: '#1e40af',
      borderWidth: 1
    }]
  };
  gradesBarChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 10 }
    }
  };
  
  // Weighted Items Pie Chart
  weightedItemsChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#a855f7', '#22c55e', '#ef4444', '#2563eb', '#f97316', '#06b6d4', '#6b7280'
      ]
    }]
  };
  weightedItemsChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  constructor(
    private apiService: ApiService,
    @Inject(LanguageService) public languageService: LanguageService
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadClasses();
    this.loadBehaviors();
  }

  loadBehaviors(): void {
    // Load behavior definitions to properly categorize positive/negative
    this.apiService.get<any[]>('/behaviors').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allBehaviors = data;
        } else {
          // Fallback to predefined behaviors
          this.allBehaviors = [
            { id: 1, type: 'positive', name: 'Good General Behavior', nameAr: 'سلوك عام جيد' },
            { id: 2, type: 'positive', name: 'Good Progress', nameAr: 'تقدم جيد' },
            { id: 3, type: 'positive', name: 'Helpful', nameAr: 'متعاون' },
            { id: 4, type: 'positive', name: 'Homework done on time', nameAr: 'إنجاز الواجب في الوقت المحدد' },
            { id: 5, type: 'positive', name: 'Participating', nameAr: 'مشارك' },
            { id: 6, type: 'negative', name: 'Generally Bad Behavior', nameAr: 'سلوك عام سيء' },
            { id: 7, type: 'negative', name: 'Uses Mobile Phones Excessively', nameAr: 'استخدام الهاتف بشكل مفرط' },
            { id: 8, type: 'negative', name: 'Fighting', nameAr: 'شجار' },
            { id: 9, type: 'negative', name: 'Homework Issues', nameAr: 'مشاكل في الواجب' },
            { id: 10, type: 'negative', name: 'Chatting', nameAr: 'ثرثرة' }
          ];
        }
      },
      error: (error) => {
        console.error('Error loading behaviors:', error);
        // Fallback to predefined behaviors
        this.allBehaviors = [
          { id: 1, type: 'positive', name: 'Good General Behavior', nameAr: 'سلوك عام جيد' },
          { id: 2, type: 'positive', name: 'Good Progress', nameAr: 'تقدم جيد' },
          { id: 3, type: 'positive', name: 'Helpful', nameAr: 'متعاون' },
          { id: 4, type: 'positive', name: 'Homework done on time', nameAr: 'إنجاز الواجب في الوقت المحدد' },
          { id: 5, type: 'positive', name: 'Participating', nameAr: 'مشارك' },
          { id: 6, type: 'negative', name: 'Generally Bad Behavior', nameAr: 'سلوك عام سيء' },
          { id: 7, type: 'negative', name: 'Uses Mobile Phones Excessively', nameAr: 'استخدام الهاتف بشكل مفرط' },
          { id: 8, type: 'negative', name: 'Fighting', nameAr: 'شجار' },
          { id: 9, type: 'negative', name: 'Homework Issues', nameAr: 'مشاكل في الواجب' },
          { id: 10, type: 'negative', name: 'Chatting', nameAr: 'ثرثرة' }
        ];
      }
    });
  }

  loadStudents(): void {
    this.apiService.get<Student[]>('/students').subscribe({
      next: (data) => {
        this.students = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading students:', error);
        // If endpoint doesn't exist, initialize with empty array
        this.students = [];
        this.filteredStudents = [];
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
        this.classes = [];
      }
    });
  }

  openAddModal(): void {
    this.editingStudent = null;
    this.formData = {
      lastName: '',
      firstName: '',
      isRepeater: false,
      group: null,
      specialCases: []
    };
    this.photoPreview = null;
    this.selectedFile = null;
    this.resetSpecialCaseForm();
    this.showModal = true;
  }

  openEditModal(student: Student): void {
    this.editingStudent = student;
    this.formData = {
      idNumber: student.idNumber,
      lastName: student.lastName,
      firstName: student.firstName,
      dateOfBirth: student.dateOfBirth ? (typeof student.dateOfBirth === 'string' ? student.dateOfBirth.split('T')[0] : (student.dateOfBirth as Date).toISOString().split('T')[0]) : undefined,
      placeOfBirth: student.placeOfBirth,
      gender: student.gender,
      isRepeater: student.isRepeater || false,
      studentId: student.studentId,
      photo: student.photo,
      generalNotes: student.generalNotes,
      specialCases: student.specialCases ? [...student.specialCases] : [],
      classId: student.classId,
      group: student.group || null,
      email: student.email,
      studentNumber: student.studentNumber
    };
    this.photoPreview = student.photo || null;
    this.selectedFile = null;
    this.resetSpecialCaseForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingStudent = null;
    this.photoPreview = null;
    this.selectedFile = null;
    this.resetSpecialCaseForm();
  }

  // Special Cases Management Methods
  resetSpecialCaseForm(): void {
    this.editingSpecialCaseIndex = null;
    this.currentSpecialCase = {};
    this.specialCaseAttachmentFiles = [];
    this.specialCaseAttachmentPreviews = [];
  }

  addSpecialCase(): void {
    if (!this.formData.specialCases) {
      this.formData.specialCases = [];
    }
    this.editingSpecialCaseIndex = this.formData.specialCases.length;
    this.currentSpecialCase = {
      category: 'health',
      details: '',
      requiredAction: '',
      attachments: [],
      startDate: '',
      endDate: ''
    };
  }

  editSpecialCase(index: number): void {
    if (!this.formData.specialCases || !this.formData.specialCases[index]) return;
    this.editingSpecialCaseIndex = index;
    this.currentSpecialCase = { ...this.formData.specialCases[index] };
    this.specialCaseAttachmentPreviews = this.currentSpecialCase.attachments || [];
  }

  saveSpecialCase(): void {
    if (!this.currentSpecialCase.category || !this.currentSpecialCase.details || !this.currentSpecialCase.requiredAction) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!this.formData.specialCases) {
      this.formData.specialCases = [];
    }

    const specialCase: SpecialCase = {
      category: this.currentSpecialCase.category as 'health' | 'exemption' | 'learning_difficulty',
      details: this.currentSpecialCase.details,
      requiredAction: this.currentSpecialCase.requiredAction,
      attachments: this.currentSpecialCase.attachments || [],
      startDate: this.currentSpecialCase.startDate,
      endDate: this.currentSpecialCase.endDate
    };

    if (this.editingSpecialCaseIndex !== null && this.editingSpecialCaseIndex < this.formData.specialCases.length) {
      // Editing existing case
      this.formData.specialCases[this.editingSpecialCaseIndex] = specialCase;
    } else {
      // Adding new case
      this.formData.specialCases.push(specialCase);
    }

    this.resetSpecialCaseForm();
  }

  deleteSpecialCase(index: number): void {
    if (!this.formData.specialCases) return;
    if (confirm('هل أنت متأكد من حذف هذه الحالة الخاصة؟')) {
      this.formData.specialCases.splice(index, 1);
      this.resetSpecialCaseForm();
    }
  }

  cancelSpecialCaseEdit(): void {
    this.resetSpecialCaseForm();
  }

  async onMedicalCertificateSelected(event: any): Promise<void> {
    const files = Array.from(event.target.files) as File[];
    for (const file of files) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        try {
          const response = await this.apiService.uploadMedicalCertificate(file).toPromise();
          
          if (response && response.fileUrl) {
            if (!this.currentSpecialCase.attachments) {
              this.currentSpecialCase.attachments = [];
            }
            this.currentSpecialCase.attachments.push(response.fileUrl);
            
            // Add preview for images
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (e: any) => {
                if (!this.specialCaseAttachmentPreviews.includes(e.target.result)) {
                  this.specialCaseAttachmentPreviews.push(e.target.result);
                }
              };
              reader.readAsDataURL(file);
            } else {
              // For PDFs, add a placeholder
              this.specialCaseAttachmentPreviews.push('/assets/pdf-icon.png');
            }
          }
        } catch (error) {
          console.error('Error uploading medical certificate:', error);
          alert('فشل رفع الملف. يرجى المحاولة مرة أخرى.');
        }
      }
    }
  }

  removeAttachment(index: number): void {
    if (this.currentSpecialCase.attachments) {
      this.currentSpecialCase.attachments.splice(index, 1);
    }
    if (this.specialCaseAttachmentPreviews) {
      this.specialCaseAttachmentPreviews.splice(index, 1);
    }
  }

  togglePrivacyMode(): void {
    this.showPrivacyMode = !this.showPrivacyMode;
  }

  getSpecialCaseIcon(category: string): string {
    switch (category) {
      case 'health':
        return '🏥';
      case 'exemption':
        return '🏃‍♂️';
      case 'learning_difficulty':
        return '⭐';
      default:
        return '📋';
    }
  }

  getSpecialCaseColor(category: string): string {
    switch (category) {
      case 'health':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'exemption':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'learning_difficulty':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getSpecialCaseLabel(category: string): string {
    switch (category) {
      case 'health':
        return 'صحي';
      case 'exemption':
        return 'إعفاء';
      case 'learning_difficulty':
        return 'صعوبات تعلم';
      default:
        return category;
    }
  }

  hasActiveSpecialCase(student: Student, category?: string): boolean {
    if (!student.specialCases || student.specialCases.length === 0) return false;
    const now = new Date();
    
    return student.specialCases.some(sc => {
      if (category && sc.category !== category) return false;
      
      // Check if case is still active (if dates are provided)
      if (sc.endDate) {
        const endDate = new Date(sc.endDate);
        if (endDate < now) return false;
      }
      return true;
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.formData.photo = e.target.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveStudent(): void {
    const submitData: any = {
      lastName: this.formData.lastName,
      firstName: this.formData.firstName,
      idNumber: this.formData.idNumber || undefined,
      dateOfBirth: this.formData.dateOfBirth || undefined,
      placeOfBirth: this.formData.placeOfBirth || undefined,
      gender: this.formData.gender || undefined,
      isRepeater: this.formData.isRepeater || false,
      studentId: this.formData.studentId || undefined,
      photo: this.formData.photo || undefined,
      generalNotes: this.formData.generalNotes || undefined,
      specialCases: this.formData.specialCases && this.formData.specialCases.length > 0 ? this.formData.specialCases : undefined,
      classId: this.formData.classId || undefined,
      group: this.formData.group || undefined,
      email: this.formData.email || undefined,
      studentNumber: this.formData.studentNumber || undefined
    };

    if (this.editingStudent) {
      this.apiService.patch<Student>(`/students/${this.editingStudent.id}`, submitData).subscribe({
        next: () => {
          this.loadStudents();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating student:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تحديث التلميذ';
          alert(errorMessage);
        }
      });
    } else {
      this.apiService.post<Student>('/students', submitData).subscribe({
        next: () => {
          this.loadStudents();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating student:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء إضافة التلميذ';
          alert(errorMessage);
        }
      });
    }
  }

  deleteStudent(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا التلميذ؟')) {
      this.apiService.delete(`/students/${id}`).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: (error) => {
          console.error('Error deleting student:', error);
          alert('حدث خطأ أثناء حذف التلميذ');
        }
      });
    }
  }

  deleteAllStudents(): void {
    const count = this.students.length;
    if (count === 0) {
      alert('لا يوجد تلاميذ للحذف');
      return;
    }
    
    if (confirm(`هل أنت متأكد من حذف جميع التلاميذ (${count} تلميذ)؟\nهذه العملية لا يمكن التراجع عنها!`)) {
      this.apiService.delete('/students').subscribe({
        next: () => {
          alert(`تم حذف جميع التلاميذ بنجاح (${count} تلميذ)`);
          this.loadStudents();
        },
        error: (error) => {
          console.error('Error deleting all students:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء حذف التلاميذ';
          alert(errorMessage);
        }
      });
    }
  }

  // Search and Filter
  applyFilters(): void {
    let filtered = [...this.students];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(student => {
        const firstName = student.firstName?.toLowerCase() || '';
        const lastName = student.lastName?.toLowerCase() || '';
        const dateOfBirth = student.dateOfBirth ? this.formatDate(student.dateOfBirth).toLowerCase() : '';
        const placeOfBirth = student.placeOfBirth?.toLowerCase() || '';
        const idNumber = student.idNumber?.toLowerCase() || '';
        const studentId = student.studentId?.toLowerCase() || '';
        const gender = this.getGenderLabel(student.gender).toLowerCase();
        const isRepeater = student.isRepeater ? 'نعم' : 'لا';
        const className = this.getClassName(student.classId).toLowerCase();
        
        return firstName.includes(term) ||
               lastName.includes(term) ||
               dateOfBirth.includes(term) ||
               placeOfBirth.includes(term) ||
               idNumber.includes(term) ||
               studentId.includes(term) ||
               gender.includes(term) ||
               isRepeater.includes(term) ||
               className.includes(term);
      });
    }

    // Class filter
    if (this.selectedClassFilter !== null) {
      filtered = filtered.filter(student => student.classId === this.selectedClassFilter);
    }

    // Gender filter
    if (this.selectedGenderFilter !== null) {
      filtered = filtered.filter(student => student.gender === this.selectedGenderFilter);
    }

    // Teaching Assistant (isRepeater) filter
    if (this.selectedRepeaterFilter !== null) {
      filtered = filtered.filter(student => (student.isRepeater || false) === this.selectedRepeaterFilter);
    }

    // Group filter
    if (this.selectedGroupFilter !== null) {
      filtered = filtered.filter(student => student.group === this.selectedGroupFilter);
    }

    // Sort
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        
        // Handle special cases for sorting
        if (this.sortField === 'classId') {
          // Sort by class name
          aVal = this.getClassName(a.classId);
          bVal = this.getClassName(b.classId);
        } else if (this.sortField === 'gender') {
          // Sort by gender label
          aVal = this.getGenderLabel(a.gender);
          bVal = this.getGenderLabel(b.gender);
        } else if (this.sortField === 'group') {
          // Sort by group label
          aVal = this.getGroupLabel(a.group);
          bVal = this.getGroupLabel(b.group);
        } else if (this.sortField === 'dateOfBirth') {
          // Sort by date
          aVal = a.dateOfBirth ? (typeof a.dateOfBirth === 'string' ? new Date(a.dateOfBirth) : a.dateOfBirth) : null;
          bVal = b.dateOfBirth ? (typeof b.dateOfBirth === 'string' ? new Date(b.dateOfBirth) : b.dateOfBirth) : null;
          
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return this.sortDirection === 'asc' ? 1 : -1;
          if (bVal === null) return this.sortDirection === 'asc' ? -1 : 1;
          
          const aTime = aVal.getTime();
          const bTime = bVal.getTime();
          
          if (aTime < bTime) return this.sortDirection === 'asc' ? -1 : 1;
          if (aTime > bTime) return this.sortDirection === 'asc' ? 1 : -1;
          return 0;
        } else {
          aVal = (a as any)[this.sortField];
          bVal = (b as any)[this.sortField];
        }
        
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredStudents = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onClassFilterChange(): void {
    this.applyFilters();
  }

  onGenderFilterChange(): void {
    this.applyFilters();
  }

  onRepeaterFilterChange(): void {
    this.applyFilters();
  }

  onGroupFilterChange(): void {
    this.applyFilters();
  }

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getClassName(classId?: number): string {
    if (!classId) return '-';
    const classItem = this.classes.find(c => c.id === classId);
    return classItem ? classItem.name : '-';
  }

  getGenderLabel(gender?: string): string {
    if (!gender) return '-';
    return gender === 'male' ? 'ذكر' : 'أنثى';
  }

  getGroupLabel(group?: 1 | 2 | null): string {
    if (!group) return '-';
    return group === 1 ? 'المجموعة 1' : 'المجموعة 2';
  }

  formatDate(date: Date | string | undefined): string {
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

  // Excel Import
  async onExcelFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (!file) return;

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

    try {
      // إرسال الملف إلى NestJS للمعالجة
      this.apiService.importStudentsExcel(file).subscribe({
        next: (response) => {
          this.isImporting = false;
          console.log('تمت المعالجة في السرفر بنجاح', response);

          const sheetsInfo = response.sheets;
          let hasUndetectedSheets = false;

          // Store detected rows
          sheetsInfo.forEach(info => {
            this.detectedHeaderRow[info.sheetName] = info.detectedRow;
            if (info.detectedRow === -1) {
              hasUndetectedSheets = true;
            }
          });

          // Store available sheets for selection
          this.availableSheets = sheetsInfo;
          this.selectedSheetsForImport = sheetsInfo.map(s => s.sheetName);
          this.importAllSheets = true;

          // If some sheets need manual header row selection, show modal
          if (hasUndetectedSheets) {
            this.pendingExcelData = sheetsInfo.map(info => ({
              students: [], // Will be populated after user selects header row
              className: info.sheetName.trim(),
              startRow: 0,
              rawData: info.rawData
            }));
            this.showHeaderRowModal = true;
            event.target.value = '';
            return;
          }

          // If multiple sheets, show sheet selector modal
          if (sheetsInfo.length > 1) {
            this.showSheetSelectorModal = true;
            event.target.value = '';
            return;
          }

          // Single sheet or proceed with all sheets
          this.processSelectedSheets(sheetsInfo);
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
    } catch (error) {
      this.isImporting = false;
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء رفع الملف');
      event.target.value = '';
    }
  }

  /**
   * Normalize Arabic text for better matching (handles hamza, taa marbuta, etc.)
   */
  normalizeArabicText(text: string): string {
    if (!text) return '';
    
    let normalized = String(text).trim();
    
    // Normalize hamza variations
    normalized = normalized.replace(/[أإآ]/g, 'ا');
    normalized = normalized.replace(/[ىي]/g, 'ي');
    normalized = normalized.replace(/[ةه]/g, 'ه');
    
    // Remove diacritics (tashkeel)
    normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
    
    // Normalize spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized.toLowerCase();
  }

  findHeaderRow(rawData: any[][]): number {
    // Column names to search for (in Arabic and English)
    // Prioritize exact matches from grade sheet format
    const keyColumns = [
      // ID number - most important for grade sheet format
      'رقم التعريف', 'رقم الهوية', 'رقم الهوية / الكود', 'idNumber', 'id_number', 'رقم_الهوية', 'رقم_التعريف',
      // First name variations - الاسم comes first
      'الاسم', 'firstName', 'first_name', 'الاسم الأول', 'first name', 'name',
      // Last name variations - اللقب comes first
      'اللقب', 'lastName', 'last_name', 'اسم العائلة', 'family_name', 'last name', 'surname',
      // Date of birth variations (including تاريخ الازدياد)
      'تاريخ الميلاد', 'تاريخ الازدياد', 'dateOfBirth', 'date_of_birth', 'تاريخ_الميلاد', 'تاريخ_الازدياد', 'birth_date', 'date of birth', 'dob',
      // Place of birth variations (including مكان الازدياد)
      'مكان الميلاد', 'مكان الازدياد', 'placeOfBirth', 'place_of_birth', 'مكان_الميلاد', 'مكان_الازدياد', 'birth_place', 'place of birth',
      // Gender variations
      'الجنس', 'gender', 'sex', 'sexe', 'النوع', 'الجنس/النوع',
      // Repeater variations
      'معيد', 'مكرر', 'isRepeater', 'is_repeater', 'repeater'
    ];

    // Preferred header row positions (0-indexed, so row 8 = index 7, row 9 = index 8)
    const preferredRows = [7, 8]; // Rows 8 and 9 (0-indexed: 7, 8)
    
    // Search through ALL rows (increased from 20 to 100 to find headers in any row)
    const maxRowsToCheck = Math.min(100, rawData.length);
    
    let bestMatch = { row: -1, score: 0, exactMatches: 0, foundCount: 0, criticalMatches: 0 };
    
    // First, check preferred rows (8 and 9) with higher priority
    for (const preferredRow of preferredRows) {
      if (preferredRow >= rawData.length) continue;
      
      const row = rawData[preferredRow];
      if (!row || row.length === 0) continue;

      // CRITICAL: Must have both lastName (اللقب) and firstName (الاسم) columns
      const hasLastName = this.hasColumnInRow(row, ['اللقب', 'lastName', 'last_name', 'surname', 'اسم العائلة']);
      const hasFirstName = this.hasColumnInRow(row, ['الاسم', 'firstName', 'first_name', 'الاسم الأول']);
      
      if (!hasLastName || !hasFirstName) {
        continue; // Skip this row if it doesn't have both required columns
      }

      const matchResult = this.evaluateRowForHeaders(row, keyColumns);
      if (matchResult.foundCount >= 2) {
        // Give bonus points for being in preferred row
        const preferredBonus = 100;
        const score = matchResult.foundCount * 10 + matchResult.exactMatches * 20 + 
                     matchResult.criticalMatches * 30 + preferredBonus;
        
        if (score > bestMatch.score) {
          bestMatch = { 
            row: preferredRow, 
            score, 
            exactMatches: matchResult.exactMatches, 
            foundCount: matchResult.foundCount,
            criticalMatches: matchResult.criticalMatches
          };
        }
      }
    }
    
    // Then search through all other rows
    for (let i = 0; i < maxRowsToCheck; i++) {
      // Skip preferred rows as we already checked them
      if (preferredRows.includes(i)) continue;
      
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const matchResult = this.evaluateRowForHeaders(row, keyColumns);
      
      // CRITICAL: Must have both lastName (اللقب) and firstName (الاسم) columns
      const hasLastName = this.hasColumnInRow(row, ['اللقب', 'lastName', 'last_name', 'surname', 'اسم العائلة']);
      const hasFirstName = this.hasColumnInRow(row, ['الاسم', 'firstName', 'first_name', 'الاسم الأول']);
      
      // Calculate score: prioritize rows with more exact matches and critical columns
      const score = matchResult.foundCount * 10 + matchResult.exactMatches * 20 + 
                   matchResult.criticalMatches * 30;
      
      // REQUIRE both lastName and firstName to be present
      // If we found at least 2 key columns (with at least 1 exact match preferred), this is likely the header row
      if (hasLastName && hasFirstName && matchResult.foundCount >= 2 && (matchResult.exactMatches >= 1 || matchResult.foundCount >= 3)) {
        if (score > bestMatch.score) {
          bestMatch = { 
            row: i, 
            score, 
            exactMatches: matchResult.exactMatches, 
            foundCount: matchResult.foundCount,
            criticalMatches: matchResult.criticalMatches
          };
        }
      }
    }
    
    // Final verification: ensure the best match has both required columns
    if (bestMatch.row >= 0) {
      const finalRow = rawData[bestMatch.row];
      const hasLastName = this.hasColumnInRow(finalRow, ['اللقب', 'lastName', 'last_name', 'surname', 'اسم العائلة']);
      const hasFirstName = this.hasColumnInRow(finalRow, ['الاسم', 'firstName', 'first_name', 'الاسم الأول']);
      
      if (!hasLastName || !hasFirstName) {
        // If best match doesn't have both, try to find any row that has both
        for (let i = 0; i < maxRowsToCheck; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          
          const hasLastNameCheck = this.hasColumnInRow(row, ['اللقب', 'lastName', 'last_name', 'surname', 'اسم العائلة']);
          const hasFirstNameCheck = this.hasColumnInRow(row, ['الاسم', 'firstName', 'first_name', 'الاسم الأول']);
          
          if (hasLastNameCheck && hasFirstNameCheck) {
            const matchResult = this.evaluateRowForHeaders(row, keyColumns);
            const score = matchResult.foundCount * 10 + matchResult.exactMatches * 20 + 
                         matchResult.criticalMatches * 30;
            if (score > bestMatch.score || bestMatch.row === -1) {
              bestMatch = { 
                row: i, 
                score, 
                exactMatches: matchResult.exactMatches, 
                foundCount: matchResult.foundCount,
                criticalMatches: matchResult.criticalMatches
              };
            }
          }
        }
      }
    }

    return bestMatch.row; // Return the best matching row, or -1 if none found
  }
  
  private hasColumnInRow(row: any[], columnNames: string[]): boolean {
    const rowStrings = row.map(cell => {
      if (cell === null || cell === undefined) return '';
      return String(cell).trim();
    });
    
    // Check if row contains mostly numbers (likely data row, not header)
    const numericCells = rowStrings.filter(cell => {
      if (!cell) return false;
      // Check if cell is a number or contains mostly digits
      const numValue = Number(cell);
      return !isNaN(numValue) && isFinite(numValue) && cell.trim() === String(numValue);
    }).length;
    
    // If more than 50% of cells are pure numbers, this is likely a data row, not a header
    if (numericCells > rowStrings.length * 0.5 && rowStrings.length > 3) {
      return false;
    }
    
    for (const columnName of columnNames) {
      const found = rowStrings.some(cell => {
        if (!cell) return false;
        
        const cellLower = cell.toLowerCase().trim();
        const normalizedCell = this.normalizeArabicText(cell);
        const normalizedKey = this.normalizeArabicText(columnName);
        
        // Exact match (highest priority)
        if (cellLower === columnName.toLowerCase().trim() || normalizedCell === normalizedKey) {
          return true;
        }
        
        // For Arabic columns, be more strict - require the exact word
        if (columnName.includes('الاسم') || columnName.includes('اللقب')) {
          // Must contain the exact Arabic word, not just part of it
          if (normalizedCell === normalizedKey) {
            return true;
          }
          // Allow if it's the exact word with optional spaces
          const exactMatch = new RegExp(`^\\s*${normalizedKey}\\s*$`, 'i').test(normalizedCell);
          if (exactMatch) {
            return true;
          }
          return false; // Don't use partial match for critical Arabic columns
        }
        
        // For English columns, allow partial match but be more careful
        // Only match if the cell starts with or equals the column name
        if (cellLower.startsWith(columnName.toLowerCase().trim()) || 
            columnName.toLowerCase().trim().startsWith(cellLower)) {
          return true;
        }
        
        return false;
      });
      
      if (found) {
        return true;
      }
    }
    
    return false;
  }

  private evaluateRowForHeaders(row: any[], keyColumns: string[]): {
    foundCount: number;
    exactMatches: number;
    criticalMatches: number;
  } {
    // Convert row to strings for comparison
    const rowStrings = row.map(cell => {
      if (cell === null || cell === undefined) return '';
      return String(cell).trim();
    });

    // Check if row contains mostly numbers (likely data row, not header)
    const numericCells = rowStrings.filter(cell => {
      if (!cell) return false;
      const numValue = Number(cell);
      return !isNaN(numValue) && isFinite(numValue) && cell.trim() === String(numValue);
    }).length;
    
    // If more than 50% of cells are pure numbers, this is likely a data row, not a header
    if (numericCells > rowStrings.length * 0.5 && rowStrings.length > 3) {
      return { foundCount: 0, exactMatches: 0, criticalMatches: 0 };
    }

    // Check if this row contains key column names (exact match preferred)
    let foundCount = 0;
    let exactMatches = 0;
    let criticalMatches = 0; // رقم التعريف, اللقب, الاسم
    
    for (const keyColumn of keyColumns) {
      const keyLower = keyColumn.toLowerCase().trim();
      let isExactMatch = false;
      let isCritical = false;
      
      const found = rowStrings.some(cell => {
        if (!cell) return false;
        
        const cellLower = cell.toLowerCase().trim();
        const normalizedCell = this.normalizeArabicText(cell);
        const normalizedKey = this.normalizeArabicText(keyColumn);
        
        // Exact match gets higher priority
        if (cellLower === keyLower || normalizedCell === normalizedKey) {
          isExactMatch = true;
          // Check if it's a critical column (ID, lastName, firstName)
          if (keyColumn.includes('رقم التعريف') || keyColumn.includes('رقم الهوية') || 
              keyColumn.includes('idNumber') || keyColumn.includes('id_number')) {
            isCritical = true;
          } else if (keyColumn.includes('اللقب') || keyColumn.includes('lastName') || 
                     keyColumn.includes('last_name') || keyColumn.includes('surname')) {
            isCritical = true;
          } else if (keyColumn.includes('الاسم') || keyColumn.includes('firstName') || 
                     keyColumn.includes('first_name')) {
            isCritical = true;
          }
          return true;
        }
        
        // For Arabic columns (الاسم, اللقب), be strict - require exact word match
        if (keyColumn.includes('الاسم') || keyColumn.includes('اللقب')) {
          // Only accept exact normalized match for Arabic columns
          return normalizedCell === normalizedKey;
        }
        
        // For other columns, allow partial match but be more careful
        // Only match if the cell starts with or equals the column name
        return cellLower.startsWith(keyLower) || keyLower.startsWith(cellLower) ||
               normalizedCell.startsWith(normalizedKey) || normalizedKey.startsWith(normalizedCell);
      });
      
      if (found) {
        foundCount++;
        if (isExactMatch) {
          exactMatches++;
        }
        if (isCritical) {
          criticalMatches++;
        }
      }
    }

    return { foundCount, exactMatches, criticalMatches };
  }

  processExcelDataWithClasses(sheetsData: Array<{ students: any[], className: string, startRow: number }>, totalStudents: number): void {
    this.isImporting = true;
    this.showImportModal = true;
    this.importProgress = {
      total: totalStudents,
      success: 0,
      failed: 0,
      errors: []
    };

    // Column mapping - supports multiple possible column names
    // Updated to prioritize exact matches from the grade sheet format
    // IMPORTANT: lastName must come from "اللقب" and firstName from "الاسم"
    // رقم التعريف = رقم الهوية / الكود
    // مكان الميلاد = مكان الازدياد
    // تاريخ الميلاد = تاريخ الازدياد
    const columnMap: { [key: string]: string[] } = {
      idNumber: ['رقم التعريف', 'رقم الهوية / الكود', 'رقم الهوية', 'idNumber', 'id_number', 'رقم_الهوية', 'رقم_التعريف', 'identification number'],
      // CRITICAL: lastName comes from "اللقب" (Last Name / Family Name)
      lastName: ['اللقب', 'lastName', 'last_name', 'اسم العائلة', 'family_name', 'surname', 'nom', 'Nom'],
      // CRITICAL: firstName comes from "الاسم" (First Name / Given Name)
      firstName: ['الاسم', 'firstName', 'first_name', 'الاسم الأول', 'first name', 'prenom', 'Prénom'],
      dateOfBirth: ['تاريخ الميلاد', 'تاريخ الازدياد', 'dateOfBirth', 'date_of_birth', 'تاريخ_الميلاد', 'تاريخ_الازدياد', 'birth_date', 'date of birth', 'dob'],
      placeOfBirth: ['مكان الميلاد', 'مكان الازدياد', 'placeOfBirth', 'place_of_birth', 'مكان_الميلاد', 'مكان_الازدياد', 'birth_place', 'lieu de naissance', 'place'],
      gender: ['الجنس', 'gender', 'sex', 'sexe', 'النوع', 'الجنس/النوع', 'sex/gender'],
      isRepeater: ['معيد', 'مكرر', 'isRepeater', 'is_repeater', 'repeater', 'هل التلميذ معيد', 'معيد؟', 'مكرر؟'],
      studentId: ['رقم التلميذ', 'studentId', 'student_id', 'رقم_التلميذ'],
      email: ['البريد الإلكتروني', 'email', 'e-mail', 'البريد'],
      studentNumber: ['رقم الطالب', 'studentNumber', 'student_number', 'رقم_الطالب'],
      className: ['القسم', 'class', 'className', 'class_name', 'department', 'القسم/الفصل'],
      generalNotes: ['ملاحظات', 'ملاحظات عامة', 'generalNotes', 'general_notes', 'notes', 'ملاحظات_عامة']
    };

    let classCache: { [className: string]: number } = {}; // Cache class names to IDs

    // First, ensure all classes exist
    const ensureClassesExist = (callback: () => void) => {
      const classNames = sheetsData.map(s => s.className).filter(name => name && name.trim() !== '');
      const uniqueClassNames = [...new Set(classNames)];
      let classesProcessed = 0;

      if (uniqueClassNames.length === 0) {
        callback();
        return;
      }

      uniqueClassNames.forEach(className => {
        // Check if class already exists
        const existingClass = this.classes.find(c => 
          c.name.toLowerCase().trim() === className.toLowerCase().trim()
        );

        if (existingClass) {
          classCache[className] = existingClass.id;
          classesProcessed++;
          if (classesProcessed === uniqueClassNames.length) {
            callback();
          }
        } else {
          // Try to create class - for now, we'll use a default level
          // In a real scenario, you might want to prompt the user or use a default
          const newClassData: any = {
            name: className,
            level: '1st_year_middle', // Default level - you might want to make this configurable
            subject: 'Computer Science', // Default subject
            weeklySessions: 0
          };

          this.apiService.post<any>('/classes', newClassData).subscribe({
            next: (newClass) => {
              classCache[className] = newClass.id;
              this.classes.push(newClass); // Add to local cache
              classesProcessed++;
              if (classesProcessed === uniqueClassNames.length) {
                callback();
              }
            },
            error: (error) => {
              console.error(`Error creating class "${className}":`, error);
              // Continue anyway - students will be imported without class assignment
              classesProcessed++;
              if (classesProcessed === uniqueClassNames.length) {
                callback();
              }
            }
          });
        }
      });
    };

    // Process all students and prepare for bulk import
    const processBulkImport = () => {
      const allStudentsData: CreateStudentDto[] = [];
      const errors: string[] = [];

      for (const sheet of sheetsData) {
        for (let i = 0; i < sheet.students.length; i++) {
          const row = sheet.students[i];
          const studentData = this.mapRowToStudent(row, columnMap);
          
          // Assign class from sheet name
          const classId = classCache[sheet.className];
          if (classId) {
            studentData.classId = classId;
          }

          const currentRowNumber = sheet.startRow + i;
          
          if (!studentData.lastName || !studentData.firstName) {
            // Get available column names for debugging
            const availableColumns = Object.keys(row).filter(k => row[k] !== '' && row[k] !== null && row[k] !== undefined);
            const columnHint = availableColumns.length > 0 
              ? ` (الأعمدة المتاحة: ${availableColumns.slice(0, 5).join(', ')}${availableColumns.length > 5 ? '...' : ''})`
              : '';
            errors.push(`ورقة "${sheet.className}" - الصف ${currentRowNumber}: الاسم واللقب مطلوبان${columnHint}`);
            continue;
          }

          allStudentsData.push(studentData);
        }
      }

      if (allStudentsData.length === 0) {
        this.isImporting = false;
        this.importProgress.failed = errors.length;
        this.importProgress.errors = errors;
        return;
      }

      // Use bulk import endpoint
      this.apiService.post<{ success: Student[]; failed: Array<{ student: CreateStudentDto; error: string }> }>(
        '/students/bulk',
        { students: allStudentsData }
      ).subscribe({
        next: (response) => {
          this.importProgress.success = response.success.length;
          this.importProgress.failed = response.failed.length + errors.length;
          this.importProgress.errors = [
            ...errors,
            ...response.failed.map(f => {
              const sheetName = sheetsData.find(s => 
                s.students.some((row, idx) => {
                  const mapped = this.mapRowToStudent(row, columnMap);
                  return mapped.firstName === f.student.firstName && 
                         mapped.lastName === f.student.lastName;
                })
              )?.className || 'غير معروف';
              return `ورقة "${sheetName}": ${f.error}`;
            })
          ];
          this.isImporting = false;
          this.loadStudents(); // Refresh the list
        },
        error: (error) => {
          this.isImporting = false;
          const errorMsg = error?.error?.message || error?.message || 'حدث خطأ أثناء الاستيراد';
          this.importProgress.failed = allStudentsData.length;
          this.importProgress.errors = [errorMsg, ...errors];
        }
      });
    };

    // Start by ensuring all classes exist, then process bulk import
    ensureClassesExist(() => {
      processBulkImport();
    });
  }

  processSelectedSheets(sheetsInfo: Array<{ sheetName: string; detectedRow: number; rawData: any[][] }>): void {
    // Filter sheets based on selection
    const sheetsToProcess = this.importAllSheets 
      ? sheetsInfo 
      : sheetsInfo.filter(info => this.selectedSheetsForImport.includes(info.sheetName));

    if (sheetsToProcess.length === 0) {
      alert('يرجى اختيار ورقة واحدة على الأقل للاستيراد');
      return;
    }

    // Process all selected sheets
    const allStudentsData: Array<{ students: any[], className: string, startRow: number }> = [];
    let totalStudents = 0;

    for (const info of sheetsToProcess) {
      // Re-detect header row if not found or if detected row doesn't contain required columns
      let headerRowIndex = info.detectedRow;
      
      if (headerRowIndex === -1 || headerRowIndex >= info.rawData.length) {
        // Try to find header row again
        headerRowIndex = this.findHeaderRow(info.rawData);
      }
      
      // Verify that the detected header row actually contains "الاسم" and "اللقب"
      if (headerRowIndex >= 0 && headerRowIndex < info.rawData.length) {
        const potentialHeaders = info.rawData[headerRowIndex];
        const headerStrings = potentialHeaders.map(cell => {
          if (cell === null || cell === undefined) return '';
          return String(cell).trim();
        });
        
        const hasLastName = headerStrings.some(h => {
          const normalized = this.normalizeArabicText(h);
          return normalized.includes(this.normalizeArabicText('اللقب')) || 
                 h.toLowerCase().includes('lastname') || 
                 h.toLowerCase().includes('last_name') ||
                 h.toLowerCase().includes('surname');
        });
        
        const hasFirstName = headerStrings.some(h => {
          const normalized = this.normalizeArabicText(h);
          return normalized.includes(this.normalizeArabicText('الاسم')) || 
                 h.toLowerCase().includes('firstname') || 
                 h.toLowerCase().includes('first_name') ||
                 (h.toLowerCase().includes('name') && !h.toLowerCase().includes('last'));
        });
        
        // If header row doesn't have required columns, try to find it again
        if (!hasLastName || !hasFirstName) {
          headerRowIndex = this.findHeaderRow(info.rawData);
        }
      }
      
      if (headerRowIndex === -1 || headerRowIndex >= info.rawData.length) {
        console.warn(`Could not find header row for sheet: ${info.sheetName}`);
        continue;
      }

      const headers = info.rawData[headerRowIndex];
      const dataRows = info.rawData.slice(headerRowIndex + 1).filter(row => 
        row.some(cell => cell !== '' && cell !== null && cell !== undefined)
      );

      if (dataRows.length === 0) continue;

      // Convert to object array with proper column mapping
      const jsonData = dataRows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          if (header) {
            // Trim header to remove leading/trailing spaces
            const trimmedHeader = String(header).trim();
            if (trimmedHeader !== '') {
              // Store both trimmed and original header for maximum compatibility
              const cellValue = row[index];
              // Only set if value exists (don't set empty strings for missing values)
              if (cellValue !== undefined && cellValue !== null) {
                // Convert to string and trim if it's a string, but preserve numbers
                if (typeof cellValue === 'string') {
                  const trimmed = cellValue.trim();
                  obj[trimmedHeader] = trimmed || '';
                } else {
                  obj[trimmedHeader] = cellValue;
                }
                // Also store with original header (if different) for backward compatibility
                if (trimmedHeader !== String(header)) {
                  obj[header] = obj[trimmedHeader];
                }
              } else {
                obj[trimmedHeader] = '';
              }
            }
          }
        });
        return obj;
      });

      allStudentsData.push({
        students: jsonData,
        className: info.sheetName.trim(),
        startRow: headerRowIndex + 2
      });
      
      totalStudents += jsonData.length;
    }

    if (allStudentsData.length === 0) {
      alert('لم يتم العثور على بيانات صحيحة في الأوراق المحددة');
      return;
    }

    // Process all sheets with their class names
    this.processExcelDataWithClasses(allStudentsData, totalStudents);
  }

  confirmSheetSelection(): void {
    if (!this.importAllSheets && this.selectedSheetsForImport.length === 0) {
      alert('يرجى اختيار ورقة واحدة على الأقل للاستيراد');
      return;
    }

    this.showSheetSelectorModal = false;
    this.processSelectedSheets(this.availableSheets);
  }

  toggleSheetSelection(sheetName: string): void {
    const index = this.selectedSheetsForImport.indexOf(sheetName);
    if (index > -1) {
      this.selectedSheetsForImport.splice(index, 1);
    } else {
      this.selectedSheetsForImport.push(sheetName);
    }
  }

  onImportAllSheetsChange(): void {
    if (this.importAllSheets) {
      this.selectedSheetsForImport = this.availableSheets.map(s => s.sheetName);
    }
  }

  processExcelData(jsonData: any[], startRowNumber: number = 2): void {
    // Legacy method - kept for backward compatibility
    // This method is now replaced by processExcelDataWithClasses
    this.processExcelDataWithClasses([{ students: jsonData, className: '', startRow: startRowNumber }], jsonData.length);
  }

  mapRowToStudent(row: any, columnMap: { [key: string]: string[] }): CreateStudentDto {
    const findColumnValue = (keys: string[], convertToString: boolean = false, normalize: boolean = false): any => {
      for (const key of keys) {
        // Check exact match first (case-sensitive for Arabic)
        if (row[key] !== undefined && row[key] !== null) {
          const value = row[key];
          // Skip empty strings, but allow numbers including 0
          if (typeof value === 'string' && value.trim() === '') {
            continue;
          }
          if (convertToString && typeof value === 'number') {
            return String(value);
          }
          if (normalize && typeof value === 'string') {
            const normalized = this.normalizeArabicText(value.trim());
            return normalized || undefined;
          }
          if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed || undefined;
          }
          return value;
        }
        // Check exact match with trim and normalization
        const rowKeys = Object.keys(row);
        const matchedKey = rowKeys.find(rk => {
          const rkTrimmed = String(rk).trim();
          const keyTrimmed = String(key).trim();
          const rkNormalized = this.normalizeArabicText(rkTrimmed);
          const keyNormalized = this.normalizeArabicText(keyTrimmed);
          
          // Exact match (case-sensitive for Arabic text)
          if (rkTrimmed === keyTrimmed) {
            return true;
          }
          // Normalized match (handles hamza, taa marbuta, etc.)
          if (rkNormalized === keyNormalized) {
            return true;
          }
          // Case-insensitive match for English
          if (rkTrimmed.toLowerCase() === keyTrimmed.toLowerCase()) {
            return true;
          }
          // Partial match for flexibility (but prioritize longer matches)
          const rkIncludesKey = rkTrimmed.includes(keyTrimmed);
          const keyIncludesRk = keyTrimmed.includes(rkTrimmed);
          const rkNormIncludesKey = rkNormalized.includes(keyNormalized);
          const keyNormIncludesRk = keyNormalized.includes(rkNormalized);
          return rkIncludesKey || keyIncludesRk || rkNormIncludesKey || keyNormIncludesRk;
        });
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          const value = row[matchedKey];
          // Skip empty strings
          if (typeof value === 'string' && value.trim() === '') {
            continue;
          }
          // Convert to string if needed
          if (convertToString && typeof value === 'number') {
            return String(value);
          }
          // Convert to string and trim if it's a string
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) {
              continue;
            }
            if (normalize) {
              const normalized = this.normalizeArabicText(trimmed);
              return normalized || undefined;
            }
            return trimmed;
          }
          return value;
        }
      }
      return undefined;
    };

    // Helper function to convert value to string if needed
    const toString = (value: any): string | undefined => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || undefined;
      }
      // Convert number to string (important for idNumber, studentId, studentNumber)
      if (typeof value === 'number') {
        return String(value);
      }
      return String(value);
    };

    // CRITICAL: Ensure lastName comes from "اللقب" and firstName from "الاسم"
    // Use normalization for better matching
    let lastNameRaw = findColumnValue(columnMap['lastName'], false, true);
    let firstNameRaw = findColumnValue(columnMap['firstName'], false, true);
    
    // If not found with normalization, try without normalization
    if (!lastNameRaw) {
      lastNameRaw = findColumnValue(columnMap['lastName'], false, false);
    }
    if (!firstNameRaw) {
      firstNameRaw = findColumnValue(columnMap['firstName'], false, false);
    }
    
    // Note: We require separate "الاسم" and "اللقب" columns - no combined column support
    // This ensures accurate data mapping and prevents confusion
    
    // Convert to strings and trim properly
    const lastName = toString(lastNameRaw);
    const firstName = toString(firstNameRaw);
    
    const studentData: CreateStudentDto = {
      // idNumber must be string - convert from number if needed
      idNumber: toString(findColumnValue(columnMap['idNumber'], true)),
      // IMPORTANT: lastName from "اللقب" column
      lastName: lastName || '',
      // IMPORTANT: firstName from "الاسم" column
      firstName: firstName || '',
      dateOfBirth: this.parseDate(findColumnValue(columnMap['dateOfBirth'])),
      placeOfBirth: toString(findColumnValue(columnMap['placeOfBirth'])),
      gender: this.parseGender(findColumnValue(columnMap['gender'])),
      isRepeater: this.parseBoolean(findColumnValue(columnMap['isRepeater'])),
      studentId: toString(findColumnValue(columnMap['studentId'], true)),
      email: toString(findColumnValue(columnMap['email'])),
      studentNumber: toString(findColumnValue(columnMap['studentNumber'], true)),
      generalNotes: toString(findColumnValue(columnMap['generalNotes']))
    };

    // Try to find class by name
    const className = findColumnValue(columnMap['className']);
    if (className) {
      const foundClass = this.classes.find(c => 
        c.name.toLowerCase().trim() === className.toString().toLowerCase().trim()
      );
      if (foundClass) {
        studentData.classId = foundClass.id;
      }
    }

    return studentData;
  }

  parseDate(dateValue: any): string | undefined {
    if (!dateValue) return undefined;
    
    // If it's already a date string in ISO format (YYYY-MM-DD)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    
    // If it's already in YYYY-MM-DD format (from the grade sheet)
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's an Excel serial date number
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      return date.toISOString().split('T')[0];
    }
    
    // Try to parse various date formats
    if (typeof dateValue === 'string') {
      // Handle DD/MM/YYYY or DD-MM-YYYY
      const ddmmyyyy = dateValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (ddmmyyyy) {
        const day = ddmmyyyy[1].padStart(2, '0');
        const month = ddmmyyyy[2].padStart(2, '0');
        const year = ddmmyyyy[3];
        return `${year}-${month}-${day}`;
      }
      
      // Handle YYYY/MM/DD or YYYY-MM-DD
      const yyyymmdd = dateValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (yyyymmdd) {
        const year = yyyymmdd[1];
        const month = yyyymmdd[2].padStart(2, '0');
        const day = yyyymmdd[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Try standard Date parsing
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return undefined;
  }

  parseGender(genderValue: any): 'male' | 'female' | undefined {
    if (genderValue === null || genderValue === undefined || genderValue === '') return undefined;
    
    const genderStr = genderValue.toString().toLowerCase().trim();
    
    // Male variations
    if (genderStr === 'ذكر' || genderStr === 'male' || genderStr === 'm' || genderStr === '1' || 
        genderStr === 'homme' || genderStr === 'h' || genderStr === 'masculin' || genderStr === 'ذكر') {
      return 'male';
    }
    
    // Female variations
    if (genderStr === 'أنثى' || genderStr === 'female' || genderStr === 'f' || genderStr === '2' || 
        genderStr === 'femme' || genderStr === 'féminin' || genderStr === 'feminin' || genderStr === 'أنثى') {
      return 'female';
    }
    
    return undefined;
  }

  parseBoolean(boolValue: any): boolean {
    if (boolValue === undefined || boolValue === null || boolValue === '') return false;
    
    const boolStr = boolValue.toString().toLowerCase().trim();
    
    // True variations
    if (boolStr === 'نعم' || boolStr === 'yes' || boolStr === 'true' || boolStr === '1' || 
        boolStr === 'معيد' || boolStr === 'مكرر' || boolStr === 'oui' || boolStr === 'vrai' ||
        boolStr === 'y' || boolStr === '✓' || boolStr === '✔' || boolStr === 'true') {
      return true;
    }
    
    // False variations
    if (boolStr === 'لا' || boolStr === 'no' || boolStr === 'false' || boolStr === '0' || 
        boolStr === 'non' || boolStr === 'faux' || boolStr === 'n' || boolStr === '✗' || 
        boolStr === '✘' || boolStr === 'false') {
      return false;
    }
    
    return false;
  }

  closeImportModal(): void {
    this.showImportModal = false;
    if (!this.isImporting) {
      this.loadStudents();
      this.importProgress = { total: 0, success: 0, failed: 0, errors: [] };
    }
  }

  closeHeaderRowModal(): void {
    this.showHeaderRowModal = false;
    this.pendingExcelData = [];
    this.selectedHeaderRow = {};
    this.detectedHeaderRow = {};
  }

  confirmHeaderRows(): void {
    // Validate that all sheets have header row numbers
    const missingRows: string[] = [];
    for (const sheetData of this.pendingExcelData) {
      const sheetName = sheetData.className;
      const hasSelected = this.selectedHeaderRow[sheetName] !== undefined && this.selectedHeaderRow[sheetName] > 0;
      const hasDetected = this.detectedHeaderRow[sheetName] !== undefined && this.detectedHeaderRow[sheetName] !== -1;
      
      if (!hasSelected && !hasDetected) {
        missingRows.push(sheetName);
      }
    }

    if (missingRows.length > 0) {
      alert(`يرجى تحديد رقم الصف لرؤوس الأعمدة في الأوراق التالية:\n${missingRows.join('\n')}`);
      return;
    }

    // Process all sheets with user-selected or detected header rows
    const processedSheets: Array<{ students: any[], className: string, startRow: number }> = [];

    for (const sheetData of this.pendingExcelData) {
      const sheetName = sheetData.className;
      const headerRowIndex = this.selectedHeaderRow[sheetName] !== undefined && this.selectedHeaderRow[sheetName] > 0
        ? this.selectedHeaderRow[sheetName] - 1  // Convert to 0-based index (user input is 1-based)
        : (this.detectedHeaderRow[sheetName] !== undefined && this.detectedHeaderRow[sheetName] !== -1
          ? this.detectedHeaderRow[sheetName]
          : -1);

      if (headerRowIndex === -1 || headerRowIndex < 0 || headerRowIndex >= sheetData.rawData.length) {
        console.warn(`Sheet "${sheetName}": رقم الصف غير صحيح (${headerRowIndex + 1})`);
        continue;
      }

      // Extract headers and data using the specified row
      const headers = sheetData.rawData[headerRowIndex];
      const dataRows = sheetData.rawData.slice(headerRowIndex + 1).filter(row => 
        row.some(cell => cell !== '' && cell !== null && cell !== undefined)
      );

      if (dataRows.length === 0) {
        console.warn(`Sheet "${sheetName}": لم يتم العثور على بيانات`);
        continue;
      }

      // Convert to object array with proper column mapping
      const jsonData = dataRows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          if (header && header !== '') {
            obj[header] = row[index] !== undefined && row[index] !== null ? row[index] : '';
          }
        });
        return obj;
      });

      processedSheets.push({
        students: jsonData,
        className: sheetName,
        startRow: headerRowIndex + 2  // +2 because Excel rows are 1-based and we add 1 for the header row
      });
    }

    if (processedSheets.length === 0) {
      alert('لم يتم العثور على بيانات صحيحة في أي ورقة عمل');
      this.closeHeaderRowModal();
      return;
    }

    const totalStudents = processedSheets.reduce((sum, sheet) => sum + sheet.students.length, 0);
    this.closeHeaderRowModal();
    this.processExcelDataWithClasses(processedSheets, totalStudents);
  }

  getPreviewRows(sheetName: string, maxRows: number = 15): any[][] {
    const sheetData = this.pendingExcelData.find(s => s.className === sheetName);
    if (!sheetData || !sheetData.rawData) return [];
    // Return rows with at least some content
    return sheetData.rawData
      .slice(0, Math.min(maxRows, sheetData.rawData.length))
      .filter(row => row && row.length > 0);
  }

  async exportToExcel(): Promise<void> {
    try {
      // إرسال طلب التصدير إلى NestJS
      const filters = {
        classId: this.selectedClassFilter || undefined,
        group: this.selectedGroupFilter || undefined,
      };

      this.apiService.exportStudentsExcel(filters.classId, filters.group).subscribe({
        next: (blob: Blob) => {
          // Generate file name with current date
          const fileName = `التلاميذ_${new Date().toISOString().split('T')[0]}.xlsx`;
          
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

  async printSpecialNeedsStudents(): Promise<void> {
    // Filter students with special cases
    const specialNeedsStudents = this.filteredStudents.filter(student => 
      student.specialCases && student.specialCases.length > 0
    );

    if (specialNeedsStudents.length === 0) {
      alert('لا يوجد تلاميذ بحالات خاصة في القائمة المفلترة');
      return;
    }

    try {
      // Create print container
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '210mm';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.padding = '20px';
      printContainer.style.fontFamily = 'Arial, sans-serif';
      printContainer.style.direction = 'rtl';
      printContainer.style.textAlign = 'right';
      document.body.appendChild(printContainer);

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'قائمة تلاميذ الحالات الخاصة';
      title.style.textAlign = 'center';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      printContainer.appendChild(title);

      // Add date
      const dateInfo = document.createElement('p');
      dateInfo.textContent = `التاريخ: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      dateInfo.style.textAlign = 'center';
      dateInfo.style.fontSize = '12px';
      dateInfo.style.color = '#6b7280';
      dateInfo.style.marginBottom = '20px';
      printContainer.appendChild(dateInfo);

      // Add summary
      const summary = document.createElement('p');
      summary.textContent = `إجمالي عدد التلاميذ: ${specialNeedsStudents.length}`;
      summary.style.textAlign = 'center';
      summary.style.fontSize = '14px';
      summary.style.fontWeight = 'bold';
      summary.style.marginBottom = '20px';
      summary.style.color = '#1f2937';
      printContainer.appendChild(summary);

      // Create table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '11px';
      table.style.marginBottom = '20px';
      table.style.border = '1px solid #d1d5db';

      // Table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#f3f4f6';
      
      const headers = ['الحالات الخاصة', 'الإجراء المطلوب', 'التفاصيل', 'المجموعة', 'القسم', 'رقم التلميذ', 'الجنس', 'تاريخ الميلاد', 'الاسم', 'اللقب', 'رقم الهوية'];
      
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '8px';
        th.style.border = '1px solid #d1d5db';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      specialNeedsStudents.forEach(student => {
        // If student has multiple special cases, create a row for each
        const cases = student.specialCases || [];
        if (cases.length === 0) return;

        cases.forEach((specialCase, caseIndex) => {
          const row = document.createElement('tr');
          
          const idNumber = student.idNumber || '-';
          const lastName = student.lastName || '-';
          const firstName = student.firstName || '-';
          const dateOfBirth = student.dateOfBirth ? this.formatDate(student.dateOfBirth) : '-';
          const gender = this.getGenderLabel(student.gender);
          const studentId = student.studentId || '-';
          const className = this.getClassName(student.classId);
          const group = student.group === 1 ? 'المجموعة 1' : student.group === 2 ? 'المجموعة 2' : '-';
          const caseType = this.getSpecialCaseLabel(specialCase.category);
          const details = specialCase.details || '-';
          const requiredAction = specialCase.requiredAction || '-';

          const cells = [
            caseType,
            requiredAction,
            details,
            group,
            className,
            studentId,
            gender,
            dateOfBirth,
            firstName,
            lastName,
            idNumber
          ];
          
          cells.forEach((cellText) => {
            const td = document.createElement('td');
            td.textContent = cellText;
            td.style.padding = '6px';
            td.style.border = '1px solid #d1d5db';
            td.style.textAlign = 'right';
            row.appendChild(td);
          });
          
          tbody.appendChild(row);
        });
      });
      table.appendChild(tbody);
      printContainer.appendChild(table);

      // Print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>قائمة تلاميذ الحالات الخاصة</title>
              <style>
                @media print {
                  @page {
                    size: A4;
                    margin: 1cm;
                  }
                  body {
                    direction: rtl;
                    font-family: Arial, sans-serif;
                  }
                }
              </style>
            </head>
            <body>
              ${printContainer.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }

      // Clean up
      document.body.removeChild(printContainer);
    } catch (error) {
      console.error('Error printing special needs students:', error);
      alert('حدث خطأ أثناء طباعة القائمة');
    }
  }

  openReportModal(student: Student): void {
    this.reportStudent = student;
    this.showReportModal = true;
    this.loadStudentClasses();
  }

  loadStudentClasses(): void {
    if (!this.reportStudent) return;
    
    // Get all classes the student belongs to (from grades and attendance)
    const classIds = new Set<number>();
    
    // Add the student's main class if exists
    if (this.reportStudent.classId) {
      classIds.add(this.reportStudent.classId);
    }
    
    // Load grades to find all classes
    this.apiService.get<any[]>(`/grades?studentId=${this.reportStudent.id}`).subscribe({
      next: (grades) => {
        grades.forEach(grade => {
          if (grade.classId) {
            classIds.add(grade.classId);
          }
        });
        
        // Load attendance to find more classes
        this.apiService.get<any[]>(`/attendance?studentId=${this.reportStudent!.id}`).subscribe({
          next: (attendance) => {
            attendance.forEach(record => {
              if (record.classId) {
                classIds.add(record.classId);
              }
            });
            
            // Filter classes to only those the student belongs to
            this.reportStudentClasses = this.classes.filter(c => classIds.has(c.id));
            
            // Set default selected class
            if (this.reportStudentClasses.length > 0) {
              if (this.reportStudent!.classId) {
                this.reportSelectedClass = this.reportStudentClasses.find(c => c.id === this.reportStudent!.classId) || this.reportStudentClasses[0];
              } else {
                this.reportSelectedClass = this.reportStudentClasses[0];
              }
              this.loadReportData();
            } else {
              this.reportSelectedClass = null;
            }
          },
          error: (error) => {
            console.error('Error loading attendance:', error);
            // Use classes from grades only
            this.reportStudentClasses = this.classes.filter(c => classIds.has(c.id));
            if (this.reportStudentClasses.length > 0) {
              this.reportSelectedClass = this.reportStudentClasses[0];
              this.loadReportData();
            }
          }
        });
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        // Try with attendance only
        this.apiService.get<any[]>(`/attendance?studentId=${this.reportStudent!.id}`).subscribe({
          next: (attendance) => {
            attendance.forEach(record => {
              if (record.classId) {
                classIds.add(record.classId);
              }
            });
            this.reportStudentClasses = this.classes.filter(c => classIds.has(c.id));
            if (this.reportStudentClasses.length > 0) {
              this.reportSelectedClass = this.reportStudentClasses[0];
              this.loadReportData();
            }
          },
          error: () => {
            // Fallback to main class only
            if (this.reportStudent!.classId) {
              const mainClass = this.classes.find(c => c.id === this.reportStudent!.classId);
              if (mainClass) {
                this.reportStudentClasses = [mainClass];
                this.reportSelectedClass = mainClass;
                this.loadReportData();
              }
            }
          }
        });
      }
    });
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportStudent = null;
    this.reportSelectedClass = null;
    this.reportStudentClasses = [];
    this.reportAttendance = [];
    this.reportBehaviorEvents = [];
    this.reportGrades = [];
  }

  onReportClassChange(): void {
    if (this.reportStudent && this.reportSelectedClass) {
      this.loadReportData();
    }
  }

  loadReportData(): void {
    if (!this.reportStudent || !this.reportSelectedClass) return;
    
    this.reportSubject = this.reportSelectedClass.name;
    
    // Load attendance
    this.apiService.get<any[]>(`/attendance?studentId=${this.reportStudent.id}&classId=${this.reportSelectedClass.id}`).subscribe({
      next: (data) => {
        this.reportAttendance = data;
        this.updateAttendanceCharts();
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.reportAttendance = [];
      }
    });
    
    // Load behavior events
    this.apiService.get<any[]>(`/behavior-events?studentId=${this.reportStudent.id}&classId=${this.reportSelectedClass.id}`).subscribe({
      next: (data) => {
        this.reportBehaviorEvents = data;
        this.updateBehaviorCharts();
      },
      error: (error) => {
        console.error('Error loading behavior:', error);
        this.reportBehaviorEvents = [];
      }
    });
    
    // Load grades
    this.apiService.get<any[]>(`/grades?classId=${this.reportSelectedClass.id}`).subscribe({
      next: (data) => {
        // Filter grades for this student
        this.reportGrades = data.filter(g => g.studentId === this.reportStudent!.id);
        this.updateGradesCharts();
        this.calculateOverallGrade();
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        this.reportGrades = [];
      }
    });
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
    
    this.reportAttendance.forEach(record => {
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
    
    // Update bi-weekly chart
    const biWeeklyData = this.calculateBiWeeklyAttendance();
    this.attendanceBiWeeklyChartData = {
      labels: biWeeklyData.labels,
      datasets: [
        { label: 'غائب', data: biWeeklyData.absent, backgroundColor: '#ef4444' },
        { label: 'معذور', data: biWeeklyData.excused, backgroundColor: '#2563eb' },
        { label: 'متأخر', data: biWeeklyData.late, backgroundColor: '#f97316' },
        { label: 'حاضر', data: biWeeklyData.present, backgroundColor: '#22c55e' },
        { label: 'مغادر مبكراً', data: biWeeklyData.leftEarly, backgroundColor: '#eab308' }
      ]
    };
  }

  calculateBiWeeklyAttendance(): any {
    // Group attendance by bi-weekly periods (last 16 weeks = 8 periods)
    const periods: { [key: string]: { present: number, absent: number, excused: number, late: number, leftEarly: number } } = {};
    const labels: string[] = [];
    
    // Get last 16 weeks
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - (i * 14));
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 13);
      
      const label = this.formatDate(periodStart);
      labels.push(label);
      periods[label] = { present: 0, absent: 0, excused: 0, late: 0, leftEarly: 0 };
      
      this.reportAttendance.forEach(record => {
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

  updateBehaviorCharts(): void {
    // Group behavior by bi-weekly periods
    const biWeeklyData = this.calculateBiWeeklyBehavior();
    this.behaviorLineChartData = {
      labels: biWeeklyData.labels,
      datasets: [
        { 
          label: 'إيجابي', 
          data: biWeeklyData.positive, 
          borderColor: '#22c55e', 
          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
          tension: 0.4 
        },
        { 
          label: 'سلبي', 
          data: biWeeklyData.negative, 
          borderColor: '#ef4444', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          tension: 0.4 
        }
      ]
    };
  }

  calculateBiWeeklyBehavior(): any {
    const periods: { [key: string]: { positive: number, negative: number } } = {};
    const labels: string[] = [];
    
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - (i * 14));
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 13);
      
      const label = this.formatDate(periodStart);
      labels.push(label);
      periods[label] = { positive: 0, negative: 0 };
      
      this.reportBehaviorEvents.forEach(event => {
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

  updateGradesCharts(): void {
    // Get assessment names and scores
    // We'll need to load assessments to get names
    const gradeItems: { name: string, score: number, maxScore: number, weight: number }[] = [];
    
    // For now, use assessmentId as name placeholder
    // In a real implementation, you'd fetch assessment details
    this.reportGrades.forEach(grade => {
      gradeItems.push({
        name: `Assessment ${grade.assessmentId}`,
        score: grade.score,
        maxScore: grade.maxScore,
        weight: 0 // Will be calculated if we have assessment weights
      });
    });
    
    // Update bar chart
    this.gradesBarChartData = {
      labels: gradeItems.map(item => item.name),
      datasets: [{
        label: 'الدرجة',
        data: gradeItems.map(item => (item.score / item.maxScore) * 10), // Normalize to 10
        backgroundColor: '#2563eb',
        borderColor: '#1e40af',
        borderWidth: 1
      }]
    };
    
    // Update weighted pie chart (if we have weights)
    // For now, use equal distribution
    const totalWeight = gradeItems.length || 1;
    this.weightedItemsChartData = {
      labels: gradeItems.map(item => item.name),
      datasets: [{
        data: gradeItems.map(() => (100 / totalWeight)),
        backgroundColor: [
          '#a855f7', '#22c55e', '#ef4444', '#2563eb', '#f97316', '#06b6d4', '#6b7280'
        ]
      }]
    };
  }

  calculateOverallGrade(): void {
    if (this.reportGrades.length === 0) {
      this.reportOverallGrade = 0;
      return;
    }
    
    // Calculate weighted average
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    this.reportGrades.forEach(grade => {
      const normalizedScore = (grade.score / grade.maxScore) * 10;
      const weight = 1; // Default weight, should come from assessment
      totalWeightedScore += normalizedScore * weight;
      totalWeight += weight;
    });
    
    this.reportOverallGrade = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
  }

  getBehaviorDetails(): { positive: any[], negative: any[] } {
    const positive: any[] = [];
    const negative: any[] = [];
    
    // Sort by date, get latest
    const sorted = [...this.reportBehaviorEvents].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    sorted.forEach(event => {
      const behavior = this.allBehaviors.find(b => b.id === event.behaviorId);
      if (behavior?.type === 'positive') {
        if (positive.length < 3) {
          positive.push({ ...event, behaviorName: behavior.nameAr || behavior.name });
        }
      } else if (behavior?.type === 'negative') {
        if (negative.length < 3) {
          negative.push({ ...event, behaviorName: behavior.nameAr || behavior.name });
        }
      }
    });
    
    return { positive, negative };
  }

  getGradeLetter(grade: number): string {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  }

  async exportReportToPDF(): Promise<void> {
    if (!this.reportContent || !this.reportStudent || !this.reportSelectedClass) {
      alert('يرجى التأكد من اختيار الطالب والمادة');
      return;
    }

    this.isExportingPDF = true;
    const contentElement = this.reportContent.nativeElement;
    const exportButton = document.querySelector('[data-export-pdf]') as HTMLElement;
    
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
        if (!this.reportStudent || !this.reportSelectedClass) {
          throw new Error('Missing student or class data');
        }
        
        const studentName = `${this.reportStudent.firstName}_${this.reportStudent.lastName}`;
        const className = this.reportSelectedClass.name.replace(/\s+/g, '_');
        const date = new Date().toISOString().split('T')[0];
        const fileName = `تقرير_${studentName}_${className}_${date}.pdf`;

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
}

