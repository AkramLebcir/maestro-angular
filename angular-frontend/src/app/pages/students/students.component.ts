import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
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
  pendingExcelData: Array<{ students: any[], className: string, startRow: number, rawData: any[][] }> = [];
  selectedHeaderRow: { [sheetName: string]: number } = {};
  detectedHeaderRow: { [sheetName: string]: number } = {};

  constructor(
    private apiService: ApiService,
    public languageService: LanguageService
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

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
      isRepeater: false,
      group: null
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
      group: student.group || null,
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
  onExcelFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Process all sheets - each sheet represents a class
        const allStudentsData: Array<{ students: any[], className: string, startRow: number }> = [];
        let totalStudents = 0;

        // First pass: Check all sheets and detect header rows
        const sheetsInfo: Array<{ sheetName: string; detectedRow: number; rawData: any[][] }> = [];
        let hasUndetectedSheets = false;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          
          if (rawData.length === 0) continue;

          const detectedRow = this.findHeaderRow(rawData);
          this.detectedHeaderRow[sheetName] = detectedRow;
          
          sheetsInfo.push({
            sheetName,
            detectedRow,
            rawData
          });

          if (detectedRow === -1) {
            hasUndetectedSheets = true;
          }
        }

        // If some sheets need manual header row selection, show modal
        if (hasUndetectedSheets) {
          this.pendingExcelData = sheetsInfo.map(info => ({
            students: [], // Will be populated after user selects header row
            className: info.sheetName.trim(),
            startRow: 0,
            rawData: info.rawData
          }));
          this.showHeaderRowModal = true;
          return;
        }

        // All sheets have detected header rows, process them
        for (const info of sheetsInfo) {
          if (info.detectedRow === -1) continue;

          const headers = info.rawData[info.detectedRow];
          const dataRows = info.rawData.slice(info.detectedRow + 1).filter(row => 
            row.some(cell => cell !== '' && cell !== null && cell !== undefined)
          );

          if (dataRows.length === 0) continue;

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

          allStudentsData.push({
            students: jsonData,
            className: info.sheetName.trim(),
            startRow: info.detectedRow + 2
          });
          
          totalStudents += jsonData.length;
        }

        if (allStudentsData.length === 0) {
          alert('لم يتم العثور على بيانات صحيحة في أي ورقة عمل');
          return;
        }

        // Process all sheets with their class names
        this.processExcelDataWithClasses(allStudentsData, totalStudents);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('حدث خطأ أثناء قراءة ملف Excel. يرجى التحقق من صحة الملف.');
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    event.target.value = '';
  }

  findHeaderRow(rawData: any[][]): number {
    // Column names to search for (in Arabic and English)
    // Prioritize exact matches from grade sheet format
    const keyColumns = [
      // ID number - most important for grade sheet format
      'رقم التعريف', 'رقم الهوية', 'رقم الهوية / الكود', 'idNumber', 'id_number', 'رقم_الهوية', 'رقم_التعريف',
      // First name variations
      'الاسم', 'firstName', 'first_name', 'الاسم الأول', 'first name', 'name',
      // Last name variations
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

    // Search through all rows (check first 20 rows to avoid checking too many)
    const maxRowsToCheck = Math.min(20, rawData.length);
    for (let i = 0; i < maxRowsToCheck; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      // Convert row to strings for comparison
      const rowStrings = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        return String(cell).trim();
      });

      // Check if this row contains key column names (exact match preferred)
      let foundCount = 0;
      let exactMatches = 0;
      
      for (const keyColumn of keyColumns) {
        const keyLower = keyColumn.toLowerCase().trim();
        const found = rowStrings.some(cell => {
          const cellLower = cell.toLowerCase().trim();
          // Exact match gets higher priority
          if (cellLower === keyLower) {
            exactMatches++;
            return true;
          }
          // Partial match
          return cellLower.includes(keyLower) || keyLower.includes(cellLower);
        });
        
        if (found) {
          foundCount++;
        }
      }

      // If we found at least 2 key columns (with at least 1 exact match preferred), this is likely the header row
      // For grade sheet format, we should find at least: رقم التعريف, اللقب, الاسم, تاريخ الميلاد
      if (foundCount >= 2) {
        // Prefer rows with more exact matches
        if (exactMatches >= 1 || foundCount >= 3) {
          return i;
        }
      }
    }

    return -1; // Header row not found
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
    // رقم التعريف = رقم الهوية / الكود
    // مكان الميلاد = مكان الازدياد
    // تاريخ الميلاد = تاريخ الازدياد
    const columnMap: { [key: string]: string[] } = {
      idNumber: ['رقم التعريف', 'رقم الهوية / الكود', 'رقم الهوية', 'idNumber', 'id_number', 'رقم_الهوية', 'رقم_التعريف', 'identification number'],
      lastName: ['اللقب', 'lastName', 'last_name', 'اسم العائلة', 'family_name', 'surname'],
      firstName: ['الاسم', 'firstName', 'first_name', 'الاسم الأول', 'first name'],
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
            errors.push(`ورقة "${sheet.className}" - الصف ${currentRowNumber}: الاسم واللقب مطلوبان`);
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

  processExcelData(jsonData: any[], startRowNumber: number = 2): void {
    // Legacy method - kept for backward compatibility
    // This method is now replaced by processExcelDataWithClasses
    this.processExcelDataWithClasses([{ students: jsonData, className: '', startRow: startRowNumber }], jsonData.length);
  }

  mapRowToStudent(row: any, columnMap: { [key: string]: string[] }): CreateStudentDto {
    const findColumnValue = (keys: string[], convertToString: boolean = false): any => {
      for (const key of keys) {
        // Check exact match first (case-sensitive for Arabic)
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          const value = row[key];
          if (convertToString && typeof value === 'number') {
            return String(value);
          }
          return value;
        }
        // Check exact match with trim
        const rowKeys = Object.keys(row);
        const matchedKey = rowKeys.find(rk => {
          const rkTrimmed = String(rk).trim();
          const keyTrimmed = String(key).trim();
          // Exact match (case-sensitive for Arabic text)
          if (rkTrimmed === keyTrimmed) {
            return true;
          }
          // Case-insensitive match for English
          if (rkTrimmed.toLowerCase() === keyTrimmed.toLowerCase()) {
            return true;
          }
          // Partial match for flexibility
          return rkTrimmed.includes(keyTrimmed) || keyTrimmed.includes(rkTrimmed);
        });
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
          const value = row[matchedKey];
          // Convert to string if needed
          if (convertToString && typeof value === 'number') {
            return String(value);
          }
          // Convert to string and trim if it's a string
          if (typeof value === 'string') {
            return value.trim();
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

    const studentData: CreateStudentDto = {
      // idNumber must be string - convert from number if needed
      idNumber: toString(findColumnValue(columnMap['idNumber'], true)),
      lastName: findColumnValue(columnMap['lastName']) || '',
      firstName: findColumnValue(columnMap['firstName']) || '',
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

