import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

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
export class TeacherNotebookComponent implements OnInit, AfterViewInit {
  constructor(
    public languageService: LanguageService,
    private authService: AuthService
  ) {}
  @ViewChild('board', { static: false }) boardElement!: ElementRef<HTMLDivElement>;
  notes: StickyNote[] = [];
  private zCounter = 1;
  private baseStorageKey = 'teacher-notebook-sticky-notes';
  private activeNote: StickyNote | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  Math = Math; // لجعل Math متاحاً في الـ template
  private readonly STICKY_WIDTH = 190;
  private readonly STICKY_MIN_HEIGHT = 130;
  private readonly BOARD_PADDING = 20; // 1.25rem ≈ 20px

  ngOnInit(): void {
    this.loadFromStorage();
  }

  ngAfterViewInit(): void {
    // التأكد من أن الملاحظات الموجودة ضمن الحدود بعد تحميلها
    setTimeout(() => {
      this.constrainAllNotes();
    }, 0);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(): void {
    // إعادة تحديد حدود الملاحظات عند تغيير حجم النافذة
    this.constrainAllNotes();
  }

  addNote(color: StickyColor): void {
    const newNote: StickyNote = {
      id: Date.now(),
      text: '',
      color,
      x: 40 + (this.notes.length * 12) % 120,
      y: 40 + (this.notes.length * 18) % 120,
      z: this.getNextZIndex()
    };
    this.notes = [...this.notes, newNote];
    this.saveToStorage();
  }

  bringToFront(note: StickyNote): void {
    note.z = this.getNextZIndex();
    this.saveToStorage();
  }

  private getNextZIndex(): number {
    // الحد الأقصى لـ z-index هو 20 لضمان عدم ظهور الملاحظات فوق الـ header (z-30) والـ sidebar (z-30)
    const maxZIndex = 20;
    this.zCounter = (this.zCounter % maxZIndex) + 1;
    return this.zCounter;
  }

  startDrag(event: MouseEvent, note: StickyNote): void {
    // لا نسحب إذا كان الضغط داخل حقل الكتابة نفسه
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'textarea') {
      return;
    }

    if (!this.boardElement?.nativeElement) {
      return;
    }

    this.activeNote = note;
    this.bringToFront(note);
    
    // تحويل إحداثيات الشاشة إلى إحداثيات السبورة
    const board = this.boardElement.nativeElement;
    const rect = board.getBoundingClientRect();
    const boardX = event.clientX - rect.left;
    const boardY = event.clientY - rect.top;
    
    this.dragOffsetX = boardX - note.x;
    this.dragOffsetY = boardY - note.y;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.activeNote || !this.boardElement?.nativeElement) {
      return;
    }
    
    // تحويل إحداثيات الشاشة إلى إحداثيات السبورة
    const board = this.boardElement.nativeElement;
    const rect = board.getBoundingClientRect();
    const boardX = event.clientX - rect.left;
    const boardY = event.clientY - rect.top;
    
    const newX = boardX - this.dragOffsetX;
    const newY = boardY - this.dragOffsetY;
    
    // تحديد الحدود لمنع الملاحظات من الخروج عن السبورة
    const bounds = this.getBoardBounds();
    this.activeNote.x = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    this.activeNote.y = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
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
    if (confirm(this.languageService.translate('teacherNotebook.clearConfirm'))) {
      this.notes = [];
      this.saveToStorage();
    }
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${this.baseStorageKey}_${user.id}` : this.baseStorageKey;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
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
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.notes));
    } catch {
      // Ignore storage errors (e.g., privacy mode)
    }
  }

  private getBoardBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    if (!this.boardElement?.nativeElement) {
      // قيم افتراضية في حالة عدم توفر العنصر
      return {
        minX: this.BOARD_PADDING,
        minY: this.BOARD_PADDING,
        maxX: 800 - this.STICKY_WIDTH - this.BOARD_PADDING,
        maxY: 600 - this.STICKY_MIN_HEIGHT - this.BOARD_PADDING
      };
    }

    const board = this.boardElement.nativeElement;
    
    // حساب الحدود بالنسبة لموضع السبورة
    const minX = this.BOARD_PADDING;
    const minY = this.BOARD_PADDING;
    const maxX = board.offsetWidth - this.STICKY_WIDTH - this.BOARD_PADDING;
    const maxY = board.offsetHeight - this.STICKY_MIN_HEIGHT - this.BOARD_PADDING;

    return {
      minX,
      minY,
      maxX: Math.max(minX, maxX),
      maxY: Math.max(minY, maxY)
    };
  }

  private constrainAllNotes(): void {
    if (!this.boardElement?.nativeElement) {
      return;
    }

    const board = this.boardElement.nativeElement;
    const minX = this.BOARD_PADDING;
    const minY = this.BOARD_PADDING;
    const maxX = board.offsetWidth - this.STICKY_WIDTH - this.BOARD_PADDING;
    const maxY = board.offsetHeight - this.STICKY_MIN_HEIGHT - this.BOARD_PADDING;

    let changed = false;
    this.notes.forEach(note => {
      const oldX = note.x;
      const oldY = note.y;
      note.x = Math.max(minX, Math.min(maxX, note.x));
      note.y = Math.max(minY, Math.min(maxY, note.y));
      if (oldX !== note.x || oldY !== note.y) {
        changed = true;
      }
    });

    if (changed) {
      this.saveToStorage();
    }
  }
}


