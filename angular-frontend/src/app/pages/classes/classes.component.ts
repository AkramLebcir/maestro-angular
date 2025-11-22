import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

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
  editingClass: Class | null = null;
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
}

