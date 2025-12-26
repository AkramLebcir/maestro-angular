import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LanguageService } from '../../services/language.service';

interface StudentLike {
  id: string | number;
  firstName: string;
  lastName: string;
  photo?: string;
  gender?: 'male' | 'female';
}

@Component({
  standalone: false,
  selector: 'app-random-picker',
  templateUrl: './random-picker.component.html',
  styleUrls: ['./random-picker.component.css']
})
export class RandomPickerComponent {
  @Input() students: StudentLike[] = [];
  @Input() selectedStudent: StudentLike | null = null;
  @Output() pickRandom = new EventEmitter<void>();
  @Output() clearSelected = new EventEmitter<void>();

  constructor(private languageService: LanguageService) {}

  pickRandomStudent(): void {
    this.pickRandom.emit();
  }

  clearSelectedStudent(): void {
    this.clearSelected.emit();
  }

  hasPhoto(student: StudentLike): boolean {
    return !!student.photo;
  }

  getStudentPhoto(student: StudentLike): string {
    return student.photo || '';
  }

  getDefaultIcon(student: StudentLike): string {
    return student.gender === 'male' ? '👦' : '👧';
  }

  getTranslatedText(key: string): string {
    return this.languageService.translate(key);
  }
}