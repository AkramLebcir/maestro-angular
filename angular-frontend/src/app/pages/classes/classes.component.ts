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
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.css']
})
export class ClassesComponent implements OnInit {
  classes: Class[] = [];
  labs: Lab[] = [];
  showModal = false;
  showLabModal = false;
  showGroupModal = false;
  editingClass: Class | null = null;
  currentClassForGroups: Class | null = null;
  classStudents: Student[] = [];
  selectedStudents: Set<number> = new Set();
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

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadLabs();
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
}

