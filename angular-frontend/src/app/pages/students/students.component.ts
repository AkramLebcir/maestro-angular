import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import * as XLSX from 'xlsx';

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
  classId?: number;
  email?: string;
  studentNumber?: string;
}

export interface Class {
  id: number;
  name: string;
  level: string;
}

@Component({
  selector: 'app-students',
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {
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
  
  // Excel import
  isImporting: boolean = false;
  importProgress: { total: number; success: number; failed: number; errors: string[] } = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };
  showImportModal: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadClasses();
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
      isRepeater: false
    };
    this.photoPreview = null;
    this.selectedFile = null;
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
      classId: student.classId,
      email: student.email,
      studentNumber: student.studentNumber
    };
    this.photoPreview = student.photo || null;
    this.selectedFile = null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingStudent = null;
    this.photoPreview = null;
    this.selectedFile = null;
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
      classId: this.formData.classId || undefined,
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

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG');
  }

  // Excel Import
  onExcelFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
        
        if (jsonData.length === 0) {
          alert('الملف فارغ أو لا يحتوي على بيانات');
          return;
        }

        this.processExcelData(jsonData);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('حدث خطأ أثناء قراءة ملف Excel. يرجى التحقق من صحة الملف.');
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    event.target.value = '';
  }

  processExcelData(jsonData: any[]): void {
    this.isImporting = true;
    this.showImportModal = true;
    this.importProgress = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Column mapping - supports multiple possible column names
    const columnMap: { [key: string]: string[] } = {
      idNumber: ['رقم الهوية', 'رقم الهوية / الكود', 'idNumber', 'id_number', 'رقم_الهوية'],
      lastName: ['اللقب', 'lastName', 'last_name', 'اسم العائلة', 'family_name'],
      firstName: ['الاسم', 'firstName', 'first_name', 'الاسم الأول'],
      dateOfBirth: ['تاريخ الميلاد', 'dateOfBirth', 'date_of_birth', 'تاريخ_الميلاد', 'birth_date'],
      placeOfBirth: ['مكان الميلاد', 'placeOfBirth', 'place_of_birth', 'مكان_الميلاد', 'birth_place'],
      gender: ['الجنس', 'gender', 'sex', 'النوع'],
      isRepeater: ['معيد', 'مكرر', 'isRepeater', 'is_repeater', 'repeater', 'هل التلميذ معيد'],
      studentId: ['رقم التلميذ', 'studentId', 'student_id', 'رقم_التلميذ'],
      email: ['البريد الإلكتروني', 'email', 'e-mail', 'البريد'],
      studentNumber: ['رقم الطالب', 'studentNumber', 'student_number', 'رقم_الطالب'],
      className: ['القسم', 'class', 'className', 'class_name', 'department', 'القسم/الفصل'],
      generalNotes: ['ملاحظات', 'ملاحظات عامة', 'generalNotes', 'general_notes', 'notes', 'ملاحظات_عامة']
    };

    let processed = 0;
    const processNext = () => {
      if (processed >= jsonData.length) {
        this.isImporting = false;
        return;
      }

      const row = jsonData[processed];
      const studentData = this.mapRowToStudent(row, columnMap);
      
      if (!studentData.lastName || !studentData.firstName) {
        this.importProgress.failed++;
        this.importProgress.errors.push(`الصف ${processed + 2}: الاسم واللقب مطلوبان`);
        processed++;
        setTimeout(processNext, 50);
        return;
      }

      this.apiService.post<Student>('/students', studentData).subscribe({
        next: () => {
          this.importProgress.success++;
          processed++;
          setTimeout(processNext, 50);
        },
        error: (error) => {
          this.importProgress.failed++;
          const errorMsg = error?.error?.message || 'خطأ غير معروف';
          this.importProgress.errors.push(`الصف ${processed + 2}: ${errorMsg}`);
          processed++;
          setTimeout(processNext, 50);
        }
      });
    };

    processNext();
  }

  mapRowToStudent(row: any, columnMap: { [key: string]: string[] }): CreateStudentDto {
    const findColumnValue = (keys: string[]): any => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          return row[key];
        }
      }
      return undefined;
    };

    const studentData: CreateStudentDto = {
      idNumber: findColumnValue(columnMap['idNumber']),
      lastName: findColumnValue(columnMap['lastName']) || '',
      firstName: findColumnValue(columnMap['firstName']) || '',
      dateOfBirth: this.parseDate(findColumnValue(columnMap['dateOfBirth'])),
      placeOfBirth: findColumnValue(columnMap['placeOfBirth']),
      gender: this.parseGender(findColumnValue(columnMap['gender'])),
      isRepeater: this.parseBoolean(findColumnValue(columnMap['isRepeater'])),
      studentId: findColumnValue(columnMap['studentId']),
      email: findColumnValue(columnMap['email']),
      studentNumber: findColumnValue(columnMap['studentNumber']),
      generalNotes: findColumnValue(columnMap['generalNotes'])
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
    
    // If it's already a date string in ISO format
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    
    // If it's an Excel serial date number
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      return date.toISOString().split('T')[0];
    }
    
    // Try to parse as date string
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return undefined;
  }

  parseGender(genderValue: any): 'male' | 'female' | undefined {
    if (!genderValue) return undefined;
    
    const genderStr = genderValue.toString().toLowerCase().trim();
    if (genderStr === 'ذكر' || genderStr === 'male' || genderStr === 'm' || genderStr === '1') {
      return 'male';
    }
    if (genderStr === 'أنثى' || genderStr === 'female' || genderStr === 'f' || genderStr === '2') {
      return 'female';
    }
    return undefined;
  }

  parseBoolean(boolValue: any): boolean {
    if (boolValue === undefined || boolValue === null || boolValue === '') return false;
    
    const boolStr = boolValue.toString().toLowerCase().trim();
    if (boolStr === 'نعم' || boolStr === 'yes' || boolStr === 'true' || boolStr === '1' || boolStr === 'معيد') {
      return true;
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

  exportToExcel(): void {
    try {
      const dataToExport = this.filteredStudents.map(student => ({
        'رقم الهوية / الكود': student.idNumber || '',
        'اللقب': student.lastName,
        'الاسم': student.firstName,
        'تاريخ الميلاد': student.dateOfBirth ? this.formatDate(student.dateOfBirth) : '',
        'مكان الميلاد': student.placeOfBirth || '',
        'الجنس': this.getGenderLabel(student.gender),
        'معيد': student.isRepeater ? 'نعم' : 'لا',
        'رقم التلميذ': student.studentId || '',
        'القسم': this.getClassName(student.classId),
        'البريد الإلكتروني': student.email || '',
        'رقم الطالب': student.studentNumber || '',
        'ملاحظات عامة': student.generalNotes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'التلاميذ');
      
      // Generate file name with current date
      const fileName = `التلاميذ_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء تصدير البيانات إلى Excel');
    }
  }
}

