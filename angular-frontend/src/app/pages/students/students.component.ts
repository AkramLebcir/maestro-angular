import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

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

    // Note: xlsx library needs to be installed: npm install xlsx
    // For now, we'll show an alert
    alert('ميزة استيراد Excel تتطلب تثبيت مكتبة xlsx. سيتم إضافتها قريباً.');
    
    // TODO: Implement Excel import when xlsx is installed
    // import * as XLSX from 'xlsx';
    // const reader = new FileReader();
    // reader.onload = (e: any) => {
    //   const data = new Uint8Array(e.target.result);
    //   const workbook = XLSX.read(data, { type: 'array' });
    //   const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    //   const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    //   // Process and import students
    // };
    // reader.readAsArrayBuffer(file);
  }

  exportToExcel(): void {
    // TODO: Implement Excel export when xlsx is installed
    alert('ميزة تصدير Excel تتطلب تثبيت مكتبة xlsx. سيتم إضافتها قريباً.');
  }
}

