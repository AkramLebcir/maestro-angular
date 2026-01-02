import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface TopicElement {
  id: number;
  content: string;
  order: number;
  topicId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  level?: string;
  track?: string;
  elements?: TopicElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: number;
  name: string;
  level: string;
  subject?: string;
  section?: string;
}

export interface TimetableEntry {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  classId: number;
  class?: Class;
}

export interface DailyJournalEntry {
  id: number;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  classId: number;
  class?: Class;
  level?: string;
  section?: string;
  topicId?: number;
  topic?: Topic;
  subtitle?: string;
  activity?: string;
  homework?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDailyJournalEntryDto {
  date: string;
  startTime: string;
  endTime: string;
  classId: number;
  level?: string;
  section?: string;
  topicId?: number;
  subtitle?: string;
  activity?: string;
  homework?: string;
  notes?: string;
}

@Component({
  standalone: false,
  selector: 'app-daily-journal',
  templateUrl: './daily-journal.component.html',
  styleUrls: ['./daily-journal.component.css']
})
export class DailyJournalComponent implements OnInit {
  // Data
  journalEntries: DailyJournalEntry[] = [];
  classes: Class[] = [];
  topics: Topic[] = [];
  timetableEntries: TimetableEntry[] = [];
  
  // UI State
  selectedDate: Date = new Date();
  showEntryModal = false;
  editingEntry: DailyJournalEntry | null = null;
  
  // Form data
  entryFormData: CreateDailyJournalEntryDto = {
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '09:00',
    classId: 0,
    level: '',
    section: '',
    topicId: undefined,
    subtitle: '',
    activity: '',
    homework: '',
    notes: ''
  };

  // Filtered topics based on selected class
  filteredTopics: Topic[] = [];
  
  // Available options for dropdowns
  availableSubtitles: string[] = [];
  availableActivities: Array<{ value: string; label: string }> = [];
  
  // Sections list
  sections: string[] = [
    'جذع مشترك آداب',
    'جذع مشترك علوم وتكنولوجيا',
    'شعبة العلوم التجريبية',
    'شعبة الرياضيات',
    'شعبة التقني رياضي',
    'شعبة التسيير والاقتصاد',
    'شعبة الآداب والفلسفة',
    'شعبة اللغات الأجنبية'
  ];

  // Days of week for calendar
  weekDays: Date[] = [];
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private apiService: ApiService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.initializeWeekDays();
    this.loadClasses();
    this.loadTopics();
    this.loadTimetableEntries();
    this.loadJournalEntries();
    this.updateSelectedDate(this.selectedDate);
    // Initialize filtered topics with all topics
    this.updateFilteredTopics();
  }

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  initializeWeekDays(): void {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay); // Start from Sunday
    
    this.weekDays = [];
    for (let i = 0; i < 14; i++) { // Show 2 weeks
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.weekDays.push(date);
    }
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

  loadTopics(): void {
    this.apiService.get<Topic[]>('/topics').subscribe({
      next: (data) => {
        this.topics = data || [];
        // Load elements for each topic
        this.topics.forEach(topic => {
          if (topic.id) {
            this.loadTopicElements(topic.id);
          }
        });
        // Update filtered topics after loading
        this.updateFilteredTopics();
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.topics = [];
        this.filteredTopics = [];
      }
    });
  }

  loadTopicElements(topicId: number): void {
    this.apiService.get<TopicElement[]>(`/topics/${topicId}/elements`).subscribe({
      next: (elements) => {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
          topic.elements = elements.sort((a, b) => (a.order || 0) - (b.order || 0));
          // Update filtered topics if this topic is in the list
          const filteredTopic = this.filteredTopics.find(t => t.id === topicId);
          if (filteredTopic) {
            filteredTopic.elements = elements.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
          // Update dropdowns if this is the selected topic
          if (this.entryFormData.topicId === topicId) {
            this.updateDropdownOptions();
          }
        }
      },
      error: (error) => {
        console.error('Error loading topic elements:', error);
      }
    });
  }

  loadTimetableEntries(): void {
    this.apiService.get<TimetableEntry[]>('/timetable').subscribe({
      next: (data) => {
        this.timetableEntries = data;
      },
      error: (error) => {
        console.error('Error loading timetable entries:', error);
        this.timetableEntries = [];
      }
    });
  }

  loadJournalEntries(): void {
    this.isLoading = true;
    // We'll use a custom endpoint or filter by date range
    // For now, we'll use a generic endpoint and filter client-side
    this.apiService.get<DailyJournalEntry[]>('/daily-journal').subscribe({
      next: (data) => {
        this.journalEntries = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading journal entries:', error);
        // If endpoint doesn't exist, initialize with empty array
        this.journalEntries = [];
        this.isLoading = false;
      }
    });
  }

  updateSelectedDate(date: Date): void {
    this.selectedDate = date;
    this.entryFormData.date = this.formatDateForInput(date);
    
    // Try to auto-fill from timetable
    this.autoFillFromTimetable(date);
  }

  autoFillFromTimetable(date: Date): void {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    // Find matching timetable entry
    const matchingEntry = this.timetableEntries.find(entry => {
      if (entry.dayOfWeek !== dayOfWeek) return false;
      
      const entryStartMinutes = this.timeToMinutes(entry.startTime);
      const entryEndMinutes = this.timeToMinutes(entry.endTime);
      const currentMinutes = this.timeToMinutes(currentTimeString);
      
      // Check if current time is within the timetable entry time range
      return currentMinutes >= entryStartMinutes && currentMinutes <= entryEndMinutes;
    });

    if (matchingEntry && matchingEntry.class) {
      this.entryFormData.classId = matchingEntry.classId;
      this.onClassChange();
      this.entryFormData.startTime = matchingEntry.startTime;
      this.entryFormData.endTime = matchingEntry.endTime;
    }
  }

  onClassChange(): void {
    const selectedClass = this.classes.find(c => c.id === this.entryFormData.classId);
    if (selectedClass) {
      // Auto-fill level from class
      this.entryFormData.level = selectedClass.level;
      
      // Auto-fill section if available
      if (selectedClass.section) {
        this.entryFormData.section = selectedClass.section;
      }
      
      // Update filtered topics based on class level
      this.updateFilteredTopics();
    }
  }

  updateFilteredTopics(): void {
    // If no level is selected, show all topics
    if (!this.entryFormData.level) {
      this.filteredTopics = [...this.topics];
      return;
    }
    
    // Filter topics by level - show topics that match the level OR have no level specified
    this.filteredTopics = this.topics.filter(topic => {
      return !topic.level || topic.level === this.entryFormData.level;
    });
  }

  onTopicChange(): void {
    this.updateDropdownOptions();
    // Auto-select first option if available
    const selectedTopic = this.getSelectedTopic();
    if (selectedTopic) {
      // Auto-select subtitle if available
      if (selectedTopic.subtitle && this.availableSubtitles.length > 0) {
        this.entryFormData.subtitle = selectedTopic.subtitle;
      } else {
        this.entryFormData.subtitle = '';
      }
      // Auto-select first activity if available
      if (this.availableActivities.length > 0) {
        this.entryFormData.activity = this.availableActivities[0].value;
      } else if (selectedTopic.description) {
        this.entryFormData.activity = selectedTopic.description;
      } else {
        this.entryFormData.activity = '';
      }
    } else {
      this.entryFormData.subtitle = '';
      this.entryFormData.activity = '';
    }
  }

  updateDropdownOptions(): void {
    const selectedTopic = this.getSelectedTopic();
    if (!selectedTopic) {
      this.availableSubtitles = [];
      this.availableActivities = [];
      return;
    }

    // Update subtitles dropdown - show the topic's subtitle if available
    this.availableSubtitles = [];
    if (selectedTopic.subtitle) {
      this.availableSubtitles.push(selectedTopic.subtitle);
    }

    // Update activities dropdown - show elements first, then description
    this.availableActivities = [];
    if (selectedTopic.elements && selectedTopic.elements.length > 0) {
      selectedTopic.elements.forEach((element, index) => {
        this.availableActivities.push({
          value: element.content,
          label: `عنصر ${index + 1}: ${element.content.substring(0, 50)}${element.content.length > 50 ? '...' : ''}`
        });
      });
    }
    // Add description as an option if available and not already in elements
    if (selectedTopic.description) {
      const descriptionExists = this.availableActivities.some(a => a.value === selectedTopic.description);
      if (!descriptionExists) {
        this.availableActivities.push({
          value: selectedTopic.description,
          label: `الوصف: ${selectedTopic.description.substring(0, 50)}${selectedTopic.description.length > 50 ? '...' : ''}`
        });
      }
    }
  }

  getEntriesForDate(date: Date): DailyJournalEntry[] {
    const dateString = this.formatDateForInput(date);
    return this.journalEntries
      .filter(entry => entry.date === dateString)
      .sort((a, b) => {
        const timeA = this.timeToMinutes(a.startTime);
        const timeB = this.timeToMinutes(b.startTime);
        return timeA - timeB;
      });
  }

  openAddEntryModal(date?: Date): void {
    const targetDate = date || this.selectedDate;
    this.editingEntry = null;
    this.entryFormData = {
      date: this.formatDateForInput(targetDate),
      startTime: '08:00',
      endTime: '09:00',
      classId: 0,
      level: '',
      section: '',
      topicId: undefined,
      subtitle: '',
      activity: '',
      homework: '',
      notes: ''
    };
    
    // Reset dropdowns
    this.availableSubtitles = [];
    this.availableActivities = [];
    
    // Update filtered topics to show all topics initially
    this.updateFilteredTopics();
    
    // Auto-fill from timetable
    this.autoFillFromTimetable(targetDate);
    
    this.showEntryModal = true;
  }

  openEditEntryModal(entry: DailyJournalEntry): void {
    this.editingEntry = entry;
    this.entryFormData = {
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      classId: entry.classId,
      level: entry.level || '',
      section: entry.section || '',
      topicId: entry.topicId,
      subtitle: entry.subtitle || '',
      activity: entry.activity || '',
      homework: entry.homework || '',
      notes: entry.notes || ''
    };
    this.onClassChange();
    // Load topic elements if topic is selected
    if (entry.topicId) {
      const topic = this.topics.find(t => t.id === entry.topicId);
      if (topic && (!topic.elements || topic.elements.length === 0)) {
        this.loadTopicElements(entry.topicId);
      }
    }
    // Update dropdowns after a short delay to ensure topic is loaded
    setTimeout(() => {
      this.updateDropdownOptions();
    }, 100);
    this.showEntryModal = true;
  }

  closeEntryModal(): void {
    this.showEntryModal = false;
    this.editingEntry = null;
  }

  saveEntry(): void {
    if (!this.entryFormData.classId || !this.entryFormData.date || 
        !this.entryFormData.startTime || !this.entryFormData.endTime) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Validate time range
    const startMinutes = this.timeToMinutes(this.entryFormData.startTime);
    const endMinutes = this.timeToMinutes(this.entryFormData.endTime);
    
    if (startMinutes >= endMinutes) {
      alert('وقت البداية يجب أن يكون قبل وقت النهاية');
      return;
    }

    const submitData: any = {
      ...this.entryFormData,
      topicId: this.entryFormData.topicId || undefined,
      subtitle: this.entryFormData.subtitle || undefined,
      activity: this.entryFormData.activity || undefined,
      homework: this.entryFormData.homework || undefined,
      notes: this.entryFormData.notes || undefined
    };

    if (this.editingEntry) {
      this.apiService.patch<DailyJournalEntry>(`/daily-journal/${this.editingEntry.id}`, submitData).subscribe({
        next: () => {
          this.loadJournalEntries();
          this.closeEntryModal();
          this.successMessage = 'تم تحديث المدخل بنجاح';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error updating journal entry:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تحديث المدخل';
          alert(errorMessage);
        }
      });
    } else {
      this.apiService.post<DailyJournalEntry>('/daily-journal', submitData).subscribe({
        next: () => {
          this.loadJournalEntries();
          this.closeEntryModal();
          this.successMessage = 'تم إضافة المدخل بنجاح';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error creating journal entry:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء إضافة المدخل';
          alert(errorMessage);
        }
      });
    }
  }

  deleteEntry(entry: DailyJournalEntry): void {
    if (confirm('هل أنت متأكد من حذف هذا المدخل؟')) {
      this.apiService.delete(`/daily-journal/${entry.id}`).subscribe({
        next: () => {
          this.loadJournalEntries();
          this.successMessage = 'تم حذف المدخل بنجاح';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting journal entry:', error);
          alert('حدث خطأ أثناء حذف المدخل');
        }
      });
    }
  }

  copyFromPreviousDay(entry: DailyJournalEntry): void {
    // Copy entry data to form for new date
    this.entryFormData = {
      date: this.formatDateForInput(this.selectedDate),
      startTime: entry.startTime,
      endTime: entry.endTime,
      classId: entry.classId,
      level: entry.level || '',
      section: entry.section || '',
      topicId: entry.topicId,
      subtitle: entry.subtitle || '',
      activity: entry.activity || '',
      homework: entry.homework || '',
      notes: entry.notes || ''
    };
    this.onClassChange();
    this.showEntryModal = true;
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateDisplay(date: Date): string {
    const lang = this.languageService.getCurrentLanguage();
    const locale = lang === 'AR' ? 'ar-EG' : (lang === 'FR' ? 'fr-FR' : 'en-US');
    return date.toLocaleDateString(locale, { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  formatTimeRange(startTime: string, endTime: string): string {
    return `من ${startTime} إلى ${endTime}`;
  }

  timeToMinutes(time: string): number {
    if (!time || typeof time !== 'string') {
      return 0;
    }
    const parts = time.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  }

  getClassName(classId: number): string {
    const classItem = this.classes.find(c => c.id === classId);
    return classItem ? classItem.name : '-';
  }

  getTopicTitle(topicId?: number): string {
    if (!topicId) return '';
    const topic = this.topics.find(t => t.id === topicId);
    return topic ? topic.title : '';
  }

  getSelectedTopic(): Topic | undefined {
    if (!this.entryFormData.topicId || !this.topics) {
      return undefined;
    }
    return this.topics.find(t => t.id === this.entryFormData.topicId);
  }

  getSubtitlePlaceholder(): string {
    if (!this.entryFormData.topicId) {
      return 'اختر موضوع الدرس أولاً';
    }
    if (this.availableSubtitles.length === 0) {
      return 'لا يوجد عنوان فرعي متاح';
    }
    return 'اختر العنوان الفرعي';
  }

  getActivityPlaceholder(): string {
    if (!this.entryFormData.topicId) {
      return 'اختر موضوع الدرس أولاً';
    }
    if (this.availableActivities.length === 0) {
      return 'لا يوجد نشاط متاح';
    }
    return 'اختر النشاط/المحتوى';
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  async exportToPDF(startDate?: Date, endDate?: Date): Promise<void> {
    try {
      const start = startDate || this.weekDays[0];
      const end = endDate || this.weekDays[this.weekDays.length - 1];
      
      // Filter entries by date range
      const entriesToExport = this.journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      }).sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
      });

      if (entriesToExport.length === 0) {
        alert('لا توجد مدخلات للتصدير');
        return;
      }

      // Create export container
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.width = '800px';
      exportContainer.style.backgroundColor = 'white';
      exportContainer.style.padding = '20px';
      exportContainer.style.direction = 'rtl';
      document.body.appendChild(exportContainer);

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'الكراس اليومي - تقرير';
      title.style.textAlign = 'center';
      title.style.fontSize = '20px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '20px';
      title.style.color = '#1f2937';
      exportContainer.appendChild(title);

      // Add date range
      const dateRange = document.createElement('div');
      dateRange.textContent = `من ${this.formatDateDisplay(start)} إلى ${this.formatDateDisplay(end)}`;
      dateRange.style.textAlign = 'center';
      dateRange.style.marginBottom = '20px';
      dateRange.style.color = '#6b7280';
      exportContainer.appendChild(dateRange);

      // Create table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '11px';
      table.style.tableLayout = 'fixed';

      // Table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#2563eb';
      headerRow.style.color = 'white';
      
      const headers = [
        { text: 'التاريخ', width: '12%' },
        { text: 'التوقيت', width: '15%' },
        { text: 'القسم', width: '20%' },
        { text: 'موضوع الدرس', width: '38%' },
        { text: 'الملاحظات', width: '15%' }
      ];
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.text;
        th.style.padding = '8px';
        th.style.border = '1px solid #1e40af';
        th.style.textAlign = 'right';
        th.style.verticalAlign = 'top';
        th.style.width = header.width;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      entriesToExport.forEach(entry => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #e5e7eb';
        
        // Column 1: Date
        const tdDate = document.createElement('td');
        tdDate.textContent = this.formatDateDisplay(new Date(entry.date));
        tdDate.style.padding = '6px';
        tdDate.style.border = '1px solid #d1d5db';
        tdDate.style.textAlign = 'right';
        tdDate.style.verticalAlign = 'top';
        row.appendChild(tdDate);
        
        // Column 2: Time
        const tdTime = document.createElement('td');
        tdTime.textContent = this.formatTimeRange(entry.startTime, entry.endTime);
        tdTime.style.padding = '6px';
        tdTime.style.border = '1px solid #d1d5db';
        tdTime.style.textAlign = 'right';
        tdTime.style.verticalAlign = 'top';
        row.appendChild(tdTime);
        
        // Column 3: Class (with level and section below)
        const tdClass = document.createElement('td');
        const classParts = [];
        const className = this.getClassName(entry.classId);
        if (className && className !== '-') {
          classParts.push(`<strong>${className}</strong>`);
        }
        if (entry.level) {
          classParts.push(entry.level);
        }
        if (entry.section) {
          classParts.push(entry.section);
        }
        tdClass.innerHTML = classParts.length > 0 
          ? classParts.join('<br>') 
          : '-';
        tdClass.style.padding = '6px';
        tdClass.style.border = '1px solid #d1d5db';
        tdClass.style.textAlign = 'right';
        tdClass.style.verticalAlign = 'top';
        tdClass.style.lineHeight = '1.6';
        tdClass.style.wordWrap = 'break-word';
        row.appendChild(tdClass);
        
        // Column 4: Topic (with subtitle, activity, and homework below)
        const tdTopic = document.createElement('td');
        const topicParts = [];
        const topicTitle = this.getTopicTitle(entry.topicId);
        if (topicTitle) {
          topicParts.push(`<strong>${topicTitle}</strong>`);
        }
        if (entry.subtitle) {
          topicParts.push(`<em>${entry.subtitle}</em>`);
        }
        if (entry.activity) {
          topicParts.push(entry.activity);
        }
        if (entry.homework) {
          topicParts.push(`<strong>الواجبات:</strong> ${entry.homework}`);
        }
        tdTopic.innerHTML = topicParts.length > 0 
          ? topicParts.join('<br>') 
          : '-';
        tdTopic.style.padding = '6px';
        tdTopic.style.border = '1px solid #d1d5db';
        tdTopic.style.textAlign = 'right';
        tdTopic.style.verticalAlign = 'top';
        tdTopic.style.lineHeight = '1.6';
        tdTopic.style.wordWrap = 'break-word';
        row.appendChild(tdTopic);
        
        // Column 5: Notes
        const tdNotes = document.createElement('td');
        tdNotes.textContent = entry.notes || '-';
        tdNotes.style.padding = '6px';
        tdNotes.style.border = '1px solid #d1d5db';
        tdNotes.style.textAlign = 'right';
        tdNotes.style.verticalAlign = 'top';
        tdNotes.style.wordWrap = 'break-word';
        row.appendChild(tdNotes);
        
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      exportContainer.appendChild(table);

      // Generate PDF
      const canvas = await html2canvas(exportContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(exportContainer);

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageHeight = 297;
      const pageWidth = 210;
      const margin = 10;
      const availableHeight = pageHeight - (2 * margin);
      const availableWidth = pageWidth - (2 * margin);

      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

      if (imgHeight > availableHeight) {
        const scale = availableHeight / imgHeight;
        finalHeight = availableHeight;
        finalWidth = imgWidth * scale;
      }

      if (finalWidth > availableWidth) {
        const scale = availableWidth / finalWidth;
        finalWidth = availableWidth;
        finalHeight = finalHeight * scale;
      }

      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      const fileName = `daily_journal_${this.formatDateForInput(start)}_${this.formatDateForInput(end)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  }
}

