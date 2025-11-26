import { Component, HostListener, OnInit } from '@angular/core';

export type StickyColor = 'yellow' | 'pink' | 'blue' | 'green';

export interface StickyNote {
  id: number;
  text: string;
  color: StickyColor;
  x: number;
  y: number;
  z: number;
}

@Component({
  selector: 'app-teacher-notebook',
  templateUrl: './teacher-notebook.component.html',
  styleUrls: ['./teacher-notebook.component.css']
})
export class TeacherNotebookComponent implements OnInit {
  notes: StickyNote[] = [];
  private zCounter = 1;
  private storageKey = 'teacher-notebook-sticky-notes';
  private activeNote: StickyNote | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  ngOnInit(): void {
    this.loadFromStorage();
  }

  addNote(color: StickyColor): void {
    const newNote: StickyNote = {
      id: Date.now(),
      text: '',
      color,
      x: 40 + (this.notes.length * 12) % 120,
      y: 40 + (this.notes.length * 18) % 120,
      z: ++this.zCounter
    };
    this.notes = [...this.notes, newNote];
    this.saveToStorage();
  }

  bringToFront(note: StickyNote): void {
    note.z = ++this.zCounter;
    this.saveToStorage();
  }

  startDrag(event: MouseEvent, note: StickyNote): void {
    // لا نسحب إذا كان الضغط داخل حقل الكتابة نفسه
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'textarea') {
      return;
    }

    this.activeNote = note;
    this.bringToFront(note);
    this.dragOffsetX = event.clientX - note.x;
    this.dragOffsetY = event.clientY - note.y;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.activeNote) {
      return;
    }
    this.activeNote.x = event.clientX - this.dragOffsetX;
    this.activeNote.y = event.clientY - this.dragOffsetY;
    this.saveToStorage();
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.activeNote = null;
  }

  onTextChange(): void {
    this.saveToStorage();
  }

  deleteNote(noteId: number): void {
    this.notes = this.notes.filter(n => n.id !== noteId);
    this.saveToStorage();
  }

  clearAll(): void {
    if (confirm('هل تريد مسح جميع الملاحظات من السبورة؟')) {
      this.notes = [];
      this.saveToStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        this.notes = [];
        return;
      }
      const parsed = JSON.parse(raw) as StickyNote[];
      this.notes = parsed || [];
      // Restore max z-index
      this.zCounter =
        this.notes.reduce((max, n) => (n.z > max ? n.z : max), 0) || 1;
    } catch {
      this.notes = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notes));
    } catch {
      // Ignore storage errors (e.g., privacy mode)
    }
  }
}


