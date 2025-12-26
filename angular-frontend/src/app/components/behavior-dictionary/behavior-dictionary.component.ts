import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';

export interface Behavior {
  id: number;
  type: 'positive' | 'negative';
  name: string;
  nameAr: string;
  icon?: string;
  points: number;
  color?: string;
  description?: string;
  isDefault: boolean;
}

@Component({
  standalone: false,
  selector: 'app-behavior-dictionary',
  templateUrl: './behavior-dictionary.component.html',
  styleUrls: ['./behavior-dictionary.component.css']
})
export class BehaviorDictionaryComponent implements OnInit {
  positiveBehaviors: Behavior[] = [];
  negativeBehaviors: Behavior[] = [];
  loading = false;
  showAddModal = false;
  showEditModal = false;
  editingBehavior: Behavior | null = null;
  
  formData: Partial<Behavior> = {
    name: '',
    nameAr: '',
    type: 'positive',
    icon: '',
    points: 0.5,
    color: 'green'
  };

  // List of available icons for dropdown
  availableIcons: string[] = [
    '✓', '✗', '⭐', '🎯', '🏆', '👏', '💪', '🔥', '✨', '🌟',
    '👍', '👎', '❤️', '💚', '💙', '💛', '🧡', '💜', '🖤',
    '😊', '😢', '😡', '😴', '🤔', '😎', '🎉', '🎊', '🏅',
    '📚', '✏️', '📝', '📖', '🎓', '💡', '🔔', '⚠️', '❌',
    '✅', '🔄', '⚡', '🎁', '🎈', '🎀', '🏃', '🚀', '💯'
  ];

  constructor(
    private apiService: ApiService,
    public languageService: LanguageService
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnInit(): void {
    this.loadBehaviors();
  }

  loadBehaviors(): void {
    this.loading = true;
    this.apiService.get<Behavior[]>('/behaviors').subscribe({
      next: (data) => {
        this.positiveBehaviors = data.filter(b => b.type === 'positive');
        this.negativeBehaviors = data.filter(b => b.type === 'negative');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading behaviors:', error);
        this.loading = false;
      }
    });
  }

  openAddModal(type: 'positive' | 'negative'): void {
    this.formData = {
      name: '',
      nameAr: '',
      type: type,
      icon: '',
      points: type === 'positive' ? 0.5 : -0.5,
      color: type === 'positive' ? 'green' : 'red'
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.formData = {
      name: '',
      nameAr: '',
      type: 'positive',
      icon: '',
      points: 0.5,
      color: 'green'
    };
  }

  openEditModal(behavior: Behavior): void {
    if (behavior.isDefault) {
      alert(this.translate('behavior.cannotEditDefault'));
      return;
    }
    this.editingBehavior = { ...behavior };
    
    // Ensure current language field is populated (use other language if current is empty)
    const currentLang = this.languageService.getCurrentLanguage();
    let name = behavior.name || '';
    let nameAr = behavior.nameAr || '';
    
    if (currentLang === 'AR' && !nameAr && name) {
      nameAr = name; // Populate Arabic from English if Arabic is empty
    } else if (currentLang !== 'AR' && !name && nameAr) {
      name = nameAr; // Populate English from Arabic if English is empty
    }
    
    this.formData = {
      name: name,
      nameAr: nameAr,
      type: behavior.type,
      icon: behavior.icon || '',
      points: behavior.points,
      color: behavior.color || (behavior.type === 'positive' ? 'green' : 'red')
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingBehavior = null;
    this.formData = {
      name: '',
      nameAr: '',
      type: 'positive',
      icon: '',
      points: 0.5,
      color: 'green'
    };
  }

  saveBehavior(): void {
    // Check name based on current language
    const currentLang = this.languageService.getCurrentLanguage();
    const nameField = currentLang === 'AR' ? this.formData.nameAr : this.formData.name;
    
    if (!nameField) {
      alert(this.translate('behavior.fillRequiredFields'));
      return;
    }
    
    // Ensure both name fields are set (for backward compatibility)
    if (currentLang === 'AR') {
      this.formData.name = this.formData.nameAr || '';
    } else {
      this.formData.nameAr = this.formData.name || '';
    }

    if (this.showEditModal && this.editingBehavior) {
      // Update existing behavior
      this.apiService.put<Behavior>(`/behaviors/${this.editingBehavior.id}`, this.formData).subscribe({
        next: () => {
          this.loadBehaviors();
          this.closeEditModal();
        },
        error: (error) => {
          console.error('Error updating behavior:', error);
          alert(this.translate('behavior.errorUpdate'));
        }
      });
    } else {
      // Create new behavior
      this.apiService.post<Behavior>('/behaviors', this.formData).subscribe({
        next: () => {
          this.loadBehaviors();
          this.closeAddModal();
        },
        error: (error) => {
          console.error('Error creating behavior:', error);
          alert(this.translate('behavior.errorCreate'));
        }
      });
    }
  }

  deleteBehavior(behavior: Behavior): void {
    if (behavior.isDefault) {
      alert(this.translate('behavior.cannotDeleteDefault'));
      return;
    }

    if (confirm(this.translate('behavior.confirmDeleteBehavior'))) {
      this.apiService.delete(`/behaviors/${behavior.id}`).subscribe({
        next: () => {
          this.loadBehaviors();
        },
        error: (error) => {
          console.error('Error deleting behavior:', error);
          alert(this.translate('behavior.errorDelete'));
        }
      });
    }
  }

  resetToDefaults(): void {
    if (confirm(this.translate('behavior.confirmResetDefaults'))) {
      this.apiService.post<Behavior[]>('/behaviors/reset-defaults', {}).subscribe({
        next: () => {
          this.loadBehaviors();
          alert(this.translate('behavior.resetSuccess'));
        },
        error: (error) => {
          console.error('Error resetting defaults:', error);
          alert(this.translate('behavior.errorReset'));
        }
      });
    }
  }

  getBehaviorName(behavior: Behavior): string {
    return this.languageService.getCurrentLanguage() === 'AR'
      ? (behavior.nameAr || behavior.name)
      : (behavior.name || behavior.nameAr);
  }

  formatPoints(points: number | string): string {
    if (points === null || points === undefined) return '0';
    const numPoints = typeof points === 'string' ? parseFloat(points) : Number(points);
    if (isNaN(numPoints)) return '0';
    // Always show one decimal place for consistency
    return numPoints.toFixed(1);
  }
}

