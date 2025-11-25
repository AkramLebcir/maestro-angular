import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

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
  selector: 'app-labs',
  templateUrl: './labs.component.html',
  styleUrls: ['./labs.component.css']
})
export class LabsComponent implements OnInit {
  labs: Lab[] = [];
  showModal = false;
  editingLab: Lab | null = null;
  formData: CreateLabDto = {
    name: '',
    description: '',
    location: '',
    isAvailable: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadLabs();
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
    this.editingLab = null;
    this.formData = {
      name: '',
      description: '',
      location: '',
      isAvailable: true
    };
    this.showModal = true;
  }

  openEditModal(labItem: Lab): void {
    this.editingLab = labItem;
    this.formData = {
      name: labItem.name,
      description: labItem.description || '',
      location: labItem.location || '',
      isAvailable: labItem.isAvailable
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingLab = null;
  }

  saveLab(): void {
    const submitData: CreateLabDto = {
      name: this.formData.name,
      description: this.formData.description || undefined,
      location: this.formData.location || undefined,
      isAvailable: this.formData.isAvailable !== undefined ? this.formData.isAvailable : true
    };

    if (this.editingLab) {
      // Update existing lab
      this.apiService.patch<Lab>(`/labs/${this.editingLab.id}`, submitData).subscribe({
        next: () => {
          this.loadLabs();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating lab:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تحديث المخبر';
          alert(errorMessage);
        }
      });
    } else {
      // Create new lab
      this.apiService.post<Lab>('/labs', submitData).subscribe({
        next: () => {
          this.loadLabs();
          this.closeModal();
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

  deleteLab(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا المخبر؟')) {
      this.apiService.delete(`/labs/${id}`).subscribe({
        next: () => {
          this.loadLabs();
        },
        error: (error) => {
          console.error('Error deleting lab:', error);
          alert('حدث خطأ أثناء حذف المخبر');
        }
      });
    }
  }
}


