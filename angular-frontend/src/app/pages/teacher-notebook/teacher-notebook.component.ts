import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

export type StickyColor = 'yellow' | 'pink' | 'blue' | 'green';

export interface StickyNote {
  id: number;
  text: string;
  color: StickyColor;
  x: number;
  y: number;
  z: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  dueDate?: Date | string;
  reminderText?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  standalone: false,
  selector: 'app-teacher-notebook',
  templateUrl: './teacher-notebook.component.html',
  styleUrls: ['./teacher-notebook.component.css']
})
export class TeacherNotebookComponent implements OnInit, AfterViewInit {
  constructor(
    public languageService: LanguageService,
    private authService: AuthService,
    private apiService: ApiService
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

  // To-Do List properties
  tasks: Task[] = [];
  newTaskTitle = '';
  newTaskCategory = '';
  customCategory = '';
  newTaskDueDate = '';
  newTaskReminderText = '';
  showTaskForm = false;
  taskCategories = [
    'تحضير مذكرة',
    'تصحيح أوراق',
    'صب النقاط في الرقمية',
    'ندوة تربوية'
  ];

  ngOnInit(): void {
    this.loadFromStorage();
    this.loadTasks();
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

  // To-Do List Methods
  loadTasks(): void {
    this.apiService.get<Task[]>('/tasks').subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasks = [];
      }
    });
  }

  addTask(): void {
    if (!this.newTaskTitle.trim()) {
      return;
    }

    const taskData: any = {
      title: this.newTaskTitle.trim()
    };

    // completed هو optional في DTO، لذا لا نرسله إذا كان false
    // لكن يمكن إرساله إذا أردنا
    // taskData.completed = false;

    if (this.newTaskCategory === 'custom' && this.customCategory) {
      taskData.category = this.customCategory.trim();
    } else if (this.newTaskCategory && this.newTaskCategory !== 'custom') {
      taskData.category = this.newTaskCategory;
    }

    if (this.newTaskDueDate) {
      // input type="date" يعطي تنسيق YYYY-MM-DD مباشرة
      // لكن نتحقق من أنه صحيح
      const dateStr = this.newTaskDueDate.trim();
      if (dateStr) {
        // التحقق من أن التاريخ صحيح
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          // استخدام تنسيق ISO date (YYYY-MM-DD) بدون الوقت
          taskData.dueDate = date.toISOString().split('T')[0];
        } else {
          // إذا كان التنسيق غير صحيح، نستخدم القيمة كما هي
          taskData.dueDate = dateStr;
        }
      }
    }

    if (this.newTaskReminderText && this.newTaskReminderText.trim()) {
      taskData.reminderText = this.newTaskReminderText.trim();
    }

    console.log('Sending task data:', taskData);

    this.apiService.post<Task>('/tasks', taskData).subscribe({
      next: (task) => {
        this.tasks.unshift(task);
        this.resetTaskForm();
      },
      error: (error) => {
        console.error('Error creating task:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        let errorMessage = this.translate('teacherNotebook.taskCreateError');
        
        // عرض رسالة الخطأ التفصيلية إن وجدت
        if (error?.error?.message) {
          errorMessage += '\n' + error.error.message;
        } else if (error?.error?.error) {
          if (Array.isArray(error.error.error)) {
            errorMessage += '\n' + error.error.error.join('\n');
          } else if (typeof error.error.error === 'string') {
            errorMessage += '\n' + error.error.error;
          }
        } else if (error?.message) {
          errorMessage += '\n' + error.message;
        }
        
        // إضافة معلومات إضافية للتصحيح
        if (error?.status) {
          errorMessage += `\n(Status: ${error.status})`;
        }
        
        alert(errorMessage);
      }
    });
  }

  toggleTask(task: Task): void {
    const updatedTask = { ...task, completed: !task.completed };
    this.apiService.patch<Task>(`/tasks/${task.id}`, { completed: updatedTask.completed }).subscribe({
      next: (updated) => {
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updated;
        }
      },
      error: (error) => {
        console.error('Error updating task:', error);
        alert(this.translate('teacherNotebook.taskUpdateError'));
      }
    });
  }

  deleteTask(taskId: number): void {
    if (confirm(this.translate('teacherNotebook.taskDeleteConfirm'))) {
      this.apiService.delete(`/tasks/${taskId}`).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          alert(this.translate('teacherNotebook.taskDeleteError'));
        }
      });
    }
  }

  resetTaskForm(): void {
    this.newTaskTitle = '';
    this.newTaskCategory = '';
    this.customCategory = '';
    this.newTaskDueDate = '';
    this.newTaskReminderText = '';
    this.showTaskForm = false;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) return false;
    const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
}


