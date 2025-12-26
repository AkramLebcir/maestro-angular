import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../services/language.service';

export interface TimetableEntry {
  id: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  subject: string;
  classId: number;
  class?: {
    id: number;
    name: string;
  };
  labId?: number;
  lab?: {
    id: number;
    name: string;
  };
  classroom?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimetableEntryDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  classId: number;
  labId?: number;
  classroom?: string;
  notes?: string;
}

export interface Class {
  id: number;
  name: string;
  level: string;
  subject: string;
}

export interface Lab {
  id: number;
  name: string;
  location?: string;
}

type ViewMode = 'weekly' | 'daily' | 'monthly';

@Component({
  standalone: false,
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit {
  timetableEntries: TimetableEntry[] = [];
  classes: Class[] = [];
  labs: Lab[] = [];
  showModal = false;
  editingEntry: TimetableEntry | null = null;
  viewMode: ViewMode = 'weekly';
  currentDate: Date = new Date();
  selectedDate: Date = new Date();
  
  // Form data
  formData: CreateTimetableEntryDto = {
    dayOfWeek: 0,
    startTime: '08:00',
    endTime: '09:00',
    subject: '',
    classId: 0
  };

  // Working days (Sunday to Thursday for Arabic countries)
  workingDays: Array<{ value: number; label: string; short: string }> = [];

  // Time slots (8:00 AM to 5:00 PM)
  timeSlots: string[] = [];
  timeSlotLabels: string[] = [];
  conflicts: Array<{ entry1: TimetableEntry; entry2: TimetableEntry; reason: string }> = [];

  // Drag and drop state
  draggedEntry: TimetableEntry | null = null;
  dragOverDay: number | null = null;
  dragOverTime: string | null = null;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public languageService: LanguageService
  ) {
    // Generate time slots from 8:00 to 16:00 (4:00 PM) - 1 hour intervals
    // Removed 17:00-18:00 (5 PM to 6 PM) slot to fit on one page
    for (let hour = 8; hour <= 16; hour++) {
      const currentTime = `${hour.toString().padStart(2, '0')}:00`;
      const nextHour = hour + 1;
      const nextTime = `${nextHour.toString().padStart(2, '0')}:00`;
      this.timeSlots.push(currentTime);
      this.timeSlotLabels.push(`${hour}h to ${nextHour}h`);
    }
    this.updateWorkingDays();
    this.updateTimeSlotLabels();
    
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(() => {
      this.updateWorkingDays();
      this.updateTimeSlotLabels();
    });
  }

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  updateWorkingDays(): void {
    this.workingDays = [
      { value: 0, label: this.translate('timetable.sunday'), short: this.translate('timetable.sundayShort') },
      { value: 1, label: this.translate('timetable.monday'), short: this.translate('timetable.mondayShort') },
      { value: 2, label: this.translate('timetable.tuesday'), short: this.translate('timetable.tuesdayShort') },
      { value: 3, label: this.translate('timetable.wednesday'), short: this.translate('timetable.wednesdayShort') },
      { value: 4, label: this.translate('timetable.thursday'), short: this.translate('timetable.thursdayShort') }
    ];
  }

  updateTimeSlotLabels(): void {
    this.timeSlotLabels = [];
    for (let hour = 8; hour <= 16; hour++) {
      const nextHour = hour + 1;
      this.timeSlotLabels.push(`${hour}h to ${nextHour}h`);
    }
  }

  ngOnInit(): void {
    this.loadTimetableEntries();
    this.loadClasses();
    this.loadLabs();

    // دعم الفتح من صفحة التقارير مع تنفيذ التصدير مباشرة
    this.route.queryParams.subscribe((params) => {
      const autoExport = params['autoExport'] === '1';
      if (autoExport) {
        setTimeout(() => this.exportToPDF(), 300);
      }
    });
  }

  loadTimetableEntries(): void {
    this.apiService.get<TimetableEntry[]>('/timetable').subscribe({
      next: (data) => {
        this.timetableEntries = data;
        this.detectConflicts();
      },
      error: (error) => {
        console.error('Error loading timetable entries:', error);
        // If endpoint doesn't exist, initialize with empty array
        this.timetableEntries = [];
        this.conflicts = [];
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

  loadLabs(): void {
    this.apiService.get<Lab[]>('/labs').subscribe({
      next: (data) => {
        this.labs = data;
      },
      error: (error) => {
        console.error('Error loading labs:', error);
        this.labs = [];
      }
    });
  }

  // Check if an entry should be displayed in a specific time slot row
  shouldDisplayEntryInSlot(entry: TimetableEntry, timeSlot: string): boolean {
    const slotMinutes = this.timeToMinutes(timeSlot);
    const nextSlotMinutes = slotMinutes + 60; // Next hour
    const entryStartMinutes = this.timeToMinutes(entry.startTime);
    const entryEndMinutes = this.timeToMinutes(entry.endTime);
    
    // Entry should be displayed if it overlaps with this hour slot
    return entryStartMinutes < nextSlotMinutes && entryEndMinutes > slotMinutes;
  }

  openAddModal(): void {
    this.editingEntry = null;
    this.formData = {
      dayOfWeek: 0,
      startTime: '08:00',
      endTime: '09:00',
      subject: '',
      classId: 0
    };
    this.showModal = true;
  }

  openEditModal(entry: TimetableEntry): void {
    this.editingEntry = entry;
    this.formData = {
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subject,
      classId: entry.classId,
      labId: entry.labId,
      classroom: entry.classroom,
      notes: entry.notes
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingEntry = null;
  }

  saveEntry(): void {
    if (!this.formData.classId) {
      alert(this.translate('timetable.selectClassError'));
      return;
    }

    // Validate that times are provided
    if (!this.formData.startTime || !this.formData.endTime) {
      alert(this.translate('timetable.enterTimesError'));
      return;
    }

    // Normalize time format (ensure HH:mm format, remove seconds if present)
    const normalizeTime = (time: string): string => {
      if (!time) return '';
      // Remove seconds if present (HH:mm:ss -> HH:mm)
      const parts = time.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return time;
    };

    const normalizedStartTime = normalizeTime(this.formData.startTime);
    let normalizedEndTime = normalizeTime(this.formData.endTime);

    // Convert times to minutes for proper comparison
    let startMinutes = this.timeToMinutes(normalizedStartTime);
    let endMinutes = this.timeToMinutes(normalizedEndTime);
    
    // Debug logging (can be removed later)
    console.log('Start time:', this.formData.startTime, '-> normalized:', normalizedStartTime, '->', startMinutes, 'minutes');
    console.log('End time:', this.formData.endTime, '-> normalized:', normalizedEndTime, '->', endMinutes, 'minutes');
    
    if (isNaN(startMinutes) || isNaN(endMinutes)) {
      alert(this.translate('timetable.timeFormatError'));
      return;
    }
    
    // Handle edge case: if end time is 00:00 (midnight) and start time is in the morning (8:00-11:59),
    // the user likely meant 12:00 PM (noon) instead of 12:00 AM (midnight)
    if (endMinutes === 0 && startMinutes >= 480 && startMinutes < 720) {
      // Convert 00:00 to 12:00 (noon) - 720 minutes
      normalizedEndTime = '12:00';
      endMinutes = 720;
      // Update formData to reflect the correction
      this.formData.endTime = normalizedEndTime;
    }
    
    if (startMinutes >= endMinutes) {
      alert(`${this.translate('timetable.startBeforeEndError')}: ${normalizedStartTime} - ${normalizedEndTime}`);
      return;
    }

    // Update formData with normalized times
    this.formData.startTime = normalizedStartTime;
    this.formData.endTime = normalizedEndTime;

    const submitData: any = {
      dayOfWeek: this.formData.dayOfWeek,
      startTime: this.formData.startTime,
      endTime: this.formData.endTime,
      subject: this.formData.subject,
      classId: this.formData.classId,
      labId: this.formData.labId || undefined,
      classroom: this.formData.classroom || undefined,
      notes: this.formData.notes || undefined
    };

    if (this.editingEntry) {
      this.apiService.patch<TimetableEntry>(`/timetable/${this.editingEntry.id}`, submitData).subscribe({
        next: () => {
          this.loadTimetableEntries();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating timetable entry:', error);
          const errorMessage = error?.error?.message || error?.message || this.translate('timetable.updateError');
          alert(errorMessage);
        }
      });
    } else {
      this.apiService.post<TimetableEntry>('/timetable', submitData).subscribe({
        next: () => {
          this.loadTimetableEntries();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating timetable entry:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             this.translate('timetable.createError');
          alert(errorMessage);
        }
      });
    }
  }

  deleteEntry(id: number): void {
    if (confirm(this.translate('timetable.deleteConfirm'))) {
      this.apiService.delete(`/timetable/${id}`).subscribe({
        next: () => {
          this.loadTimetableEntries();
        },
        error: (error) => {
          console.error('Error deleting timetable entry:', error);
          alert(this.translate('timetable.deleteError'));
        }
      });
    }
  }

  // Conflict Detection
  detectConflicts(): void {
    this.conflicts = [];
    
    for (let i = 0; i < this.timetableEntries.length; i++) {
      for (let j = i + 1; j < this.timetableEntries.length; j++) {
        const entry1 = this.timetableEntries[i];
        const entry2 = this.timetableEntries[j];
        
        // Check if same day
        if (entry1.dayOfWeek !== entry2.dayOfWeek) continue;
        
        // Check time overlap
        const start1 = this.timeToMinutes(entry1.startTime);
        const end1 = this.timeToMinutes(entry1.endTime);
        const start2 = this.timeToMinutes(entry2.startTime);
        const end2 = this.timeToMinutes(entry2.endTime);
        
        if (this.hasTimeOverlap(start1, end1, start2, end2)) {
          let reason = '';
          
          // Same class conflict
          if (entry1.classId === entry2.classId) {
            reason = `${this.translate('timetable.sameClassConflict')} (${this.getClassName(entry1.classId)}) ${this.translate('timetable.atSameTime')}`;
          }
          // Same lab conflict
          else if (entry1.labId && entry2.labId && entry1.labId === entry2.labId) {
            reason = `${this.translate('timetable.sameLabConflict')} (${this.getLabName(entry1.labId)}) ${this.translate('timetable.atSameTime')}`;
          }
          // Same classroom conflict
          else if (entry1.classroom && entry2.classroom && entry1.classroom === entry2.classroom) {
            reason = `${this.translate('timetable.sameRoomConflict')} (${entry1.classroom}) ${this.translate('timetable.atSameTime')}`;
          }
          // Time overlap
          else {
            reason = this.translate('timetable.timeOverlap');
          }
          
          this.conflicts.push({ entry1, entry2, reason });
        }
      }
    }
  }

  hasTimeOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return (start1 < end2 && end1 > start2);
  }

  timeToMinutes(time: string): number {
    if (!time || typeof time !== 'string') {
      return 0;
    }
    // Handle both "HH:mm" and "HH:mm:ss" formats
    const parts = time.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  }

  // View Management
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  getWeekDays(): Date[] {
    const start = this.getWeekStart(this.currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  }

  getMonthDays(): Date[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    // Add days from previous month to fill first week
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i - 1);
      days.push(date);
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    // Add days from next month to fill last week
    const remaining = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remaining; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days;
  }

  navigateWeek(direction: 'prev' | 'next'): void {
    const days = direction === 'next' ? 7 : -7;
    this.currentDate = new Date(this.currentDate.getTime() + days * 24 * 60 * 60 * 1000);
  }

  navigateMonth(direction: 'prev' | 'next'): void {
    const month = direction === 'next' ? 1 : -1;
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + month, 1);
  }

  navigateDay(direction: 'prev' | 'next'): void {
    const days = direction === 'next' ? 1 : -1;
    this.selectedDate = new Date(this.selectedDate.getTime() + days * 24 * 60 * 60 * 1000);
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
  }

  // Helper methods
  getEntriesForDay(dayOfWeek: number): TimetableEntry[] {
    return this.timetableEntries
      .filter(entry => entry.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  getEntriesForDate(date: Date): TimetableEntry[] {
    const dayOfWeek = date.getDay();
    return this.getEntriesForDay(dayOfWeek);
  }

  getClassName(classId: number): string {
    const classItem = this.classes.find(c => c.id === classId);
    return classItem ? classItem.name : `${this.translate('timetable.classLabel')} ${classId}`;
  }

  getLabName(labId?: number): string {
    if (!labId) return '-';
    const lab = this.labs.find(l => l.id === labId);
    return lab ? lab.name : `${this.translate('timetable.labLabel')} ${labId}`;
  }

  getDayLabel(dayOfWeek: number): string {
    const day = this.workingDays.find(d => d.value === dayOfWeek);
    return day ? day.label : '';
  }

  formatDate(date: Date): string {
    const lang = this.languageService.getCurrentLanguage();
    const localeMap: { [key: string]: string } = {
      'AR': 'ar-EG',
      'FR': 'fr-FR',
      'EN': 'en-US',
      'ES': 'es-ES',
      'IT': 'it-IT',
      'DE': 'de-DE',
      'TR': 'tr-TR'
    };
    const locale = localeMap[lang] || 'en-US';
    return date.toLocaleDateString(locale, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      numberingSystem: 'latn'
    });
  }

  formatTime(time: string): string {
    return time;
  }

  getToday(): Date {
    return new Date();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // PDF Export
  async exportToPDF(): Promise<void> {
    try {
      // Ensure we're in weekly view for the table export
      const originalViewMode = this.viewMode;
      if (this.viewMode !== 'weekly') {
        this.viewMode = 'weekly';
        // Wait for view to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get the table element
      const tableElement = document.querySelector('.overflow-x-auto table');
      if (!tableElement) {
        alert(this.translate('timetable.tableNotFoundError'));
        return;
      }

      // Create a container for the export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.width = '1100px'; // Slightly reduced width for better fit
      exportContainer.style.backgroundColor = 'white';
      exportContainer.style.padding = '15px';
      document.body.appendChild(exportContainer);

      // Clone the table and add title
      const title = document.createElement('h1');
      title.textContent = this.translate('timetable.title');
      title.style.textAlign = 'center';
      title.style.fontSize = '20px'; // Reduced font size
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '15px';
      title.style.color = '#1f2937';
      exportContainer.appendChild(title);

      const clonedTable = tableElement.cloneNode(true) as HTMLElement;
      clonedTable.style.width = '100%';
      clonedTable.style.borderCollapse = 'collapse';
      
      // Reduce font sizes in cloned table to fit on one page
      const allCells = clonedTable.querySelectorAll('td, th');
      allCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        const currentFontSize = window.getComputedStyle(htmlCell).fontSize;
        const fontSizeNum = parseFloat(currentFontSize);
        htmlCell.style.fontSize = `${Math.max(10, fontSizeNum * 0.85)}px`; // Reduce by 15%
        htmlCell.style.padding = '4px'; // Reduce padding
      });
      
      exportContainer.appendChild(clonedTable);

      // Use html2canvas to capture the table with proper Arabic rendering
      const canvas = await html2canvas(exportContainer, {
        scale: 1.5, // Reduced scale for better fit
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.offsetHeight
      });

      // Clean up
      document.body.removeChild(exportContainer);

      // Restore original view mode
      this.viewMode = originalViewMode;

      // Calculate PDF dimensions (landscape A4)
      const imgWidth = 297; // A4 width in mm (landscape)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('l', 'mm', 'a4');

      // Calculate scale to fit on one page
      const pageHeight = 210; // A4 height in mm (landscape)
      const pageWidth = 297; // A4 width in mm (landscape)
      
      // If content is taller than one page, scale it down
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      if (imgHeight > pageHeight) {
        // Scale down to fit height
        const scale = pageHeight / imgHeight;
        finalHeight = pageHeight;
        finalWidth = imgWidth * scale;
      }
      
      // Center the content if it's smaller than the page
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = (pageHeight - finalHeight) / 2;

      // Add to PDF (single page)
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Save PDF
      const fileName = `timetable_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(this.translate('timetable.pdfExportError'));
    }
  }

  getEntryAtTime(dayOfWeek: number, time: string): TimetableEntry | undefined {
    return this.timetableEntries.find(entry => 
      entry.dayOfWeek === dayOfWeek && 
      entry.startTime <= time && 
      entry.endTime > time
    );
  }

  getEntryDuration(entry: TimetableEntry): number {
    const start = this.timeToMinutes(entry.startTime);
    const end = this.timeToMinutes(entry.endTime);
    return end - start;
  }

  // Drag and Drop Methods
  onDragStart(entry: TimetableEntry, event: DragEvent): void {
    this.draggedEntry = entry;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', entry.id.toString());
    }
  }

  onDragEnd(): void {
    this.draggedEntry = null;
    this.dragOverDay = null;
    this.dragOverTime = null;
  }

  onDragOver(day: number, timeSlot: string, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverDay = day;
    this.dragOverTime = timeSlot;
  }

  onDragLeave(): void {
    this.dragOverDay = null;
    this.dragOverTime = null;
  }

  onDrop(day: number, timeSlot: string, event: DragEvent): void {
    event.preventDefault();
    
    if (!this.draggedEntry) {
      return;
    }

    // Calculate new start and end time based on drop position
    const newStartTime = timeSlot;
    const duration = this.getEntryDuration(this.draggedEntry);
    const startMinutes = this.timeToMinutes(newStartTime);
    const endMinutes = startMinutes + duration;
    const newEndTime = this.minutesToTime(endMinutes);

    // Update the entry
    const updateData: any = {
      dayOfWeek: day,
      startTime: newStartTime,
      endTime: newEndTime,
      subject: this.draggedEntry.subject,
      classId: this.draggedEntry.classId,
      labId: this.draggedEntry.labId || undefined,
      classroom: this.draggedEntry.classroom || undefined,
      notes: this.draggedEntry.notes || undefined
    };

    this.apiService.patch<TimetableEntry>(`/timetable/${this.draggedEntry.id}`, updateData).subscribe({
      next: () => {
        this.loadTimetableEntries();
      },
      error: (error) => {
        console.error('Error updating timetable entry:', error);
        const errorMessage = error?.error?.message || error?.message || this.translate('timetable.updateError');
        alert(errorMessage);
      }
    });

    this.draggedEntry = null;
    this.dragOverDay = null;
    this.dragOverTime = null;
  }

  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  formatMonthYear(date: Date): string {
    const lang = this.languageService.getCurrentLanguage();
    const localeMap: { [key: string]: string } = {
      'AR': 'ar-EG',
      'FR': 'fr-FR',
      'EN': 'en-US',
      'ES': 'es-ES',
      'IT': 'it-IT',
      'DE': 'de-DE',
      'TR': 'tr-TR'
    };
    const locale = localeMap[lang] || 'en-US';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', numberingSystem: 'latn' });
  }
}

