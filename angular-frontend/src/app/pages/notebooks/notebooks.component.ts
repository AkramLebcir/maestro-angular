import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
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
  elements: TopicElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTopicDto {
  title: string;
  description?: string;
}

export interface CreateTopicElementDto {
  content: string;
  topicId: number;
  order?: number;
}

export interface CourseEntry {
  id: number;
  title: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  notebookId: number;
  topicId?: number;
  topic?: Topic;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseEntryDto {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  notebookId: number;
  topicId?: number;
  order?: number;
}

export interface Notebook {
  id: number;
  title: string;
  description?: string;
  content?: string;
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
  courseEntries?: CourseEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotebookDto {
  title: string;
  description?: string;
  content?: string;
  classId?: number;
}

export interface Class {
  id: number;
  name: string;
  level: string;
}

@Component({
  selector: 'app-notebooks',
  templateUrl: './notebooks.component.html',
  styleUrls: ['./notebooks.component.css']
})
export class NotebooksComponent implements OnInit {
  notebooks: Notebook[] = [];
  filteredNotebooks: Notebook[] = [];
  classes: Class[] = [];
  showModal = false;
  editingNotebook: Notebook | null = null;
  showReportModal = false;
  selectedNotebookForReport: Notebook | null = null;
  showCourseModal = false;
  editingCourse: CourseEntry | null = null;
  currentNotebookForCourse: Notebook | null = null;
  topics: Topic[] = [];
  
  // Search and filter
  searchTerm: string = '';
  selectedClassFilter: number | null = null;
  
  // Form data
  formData: CreateNotebookDto = {
    title: '',
    description: '',
    content: ''
  };

  // Course form data
  courseFormData: CreateCourseEntryDto = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '09:00',
    notebookId: 0
  };


  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadNotebooks();
    this.loadClasses();
    this.loadTopics();
  }

  loadNotebooks(): void {
    this.apiService.get<Notebook[]>('/notebooks').subscribe({
      next: (data) => {
        this.notebooks = data;
        // Load course entries for each notebook
        this.notebooks.forEach(notebook => {
          this.loadCourseEntries(notebook.id);
        });
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading notebooks:', error);
        // If endpoint doesn't exist, initialize with empty array
        this.notebooks = [];
        this.filteredNotebooks = [];
      }
    });
  }

  loadCourseEntries(notebookId: number): void {
    this.apiService.get<CourseEntry[]>(`/notebooks/${notebookId}/courses`).subscribe({
      next: (data) => {
        const notebook = this.notebooks.find(n => n.id === notebookId);
        if (notebook) {
          notebook.courseEntries = data.sort((a, b) => {
            // Sort by date, then by start time
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
          });
        }
      },
      error: (error) => {
        console.error('Error loading course entries:', error);
        const notebook = this.notebooks.find(n => n.id === notebookId);
        if (notebook) {
          notebook.courseEntries = [];
        }
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

  loadTopics(): void {
    this.apiService.get<Topic[]>('/topics').subscribe({
      next: (data) => {
        // Load elements for each topic
        this.topics = data;
        this.topics.forEach(topic => {
          this.loadTopicElements(topic.id);
        });
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.topics = [];
      }
    });
  }

  loadTopicElements(topicId: number): void {
    this.apiService.get<TopicElement[]>(`/topics/${topicId}/elements`).subscribe({
      next: (data) => {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
          topic.elements = data.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      },
      error: (error) => {
        console.error('Error loading topic elements:', error);
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
          topic.elements = [];
        }
      }
    });
  }

  openAddModal(): void {
    this.editingNotebook = null;
    this.formData = {
      title: '',
      description: '',
      content: ''
    };
    this.showModal = true;
  }

  openEditModal(notebook: Notebook): void {
    this.editingNotebook = notebook;
    this.formData = {
      title: notebook.title,
      description: notebook.description || '',
      content: notebook.content || '',
      classId: notebook.classId
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingNotebook = null;
  }

  saveNotebook(): void {
    const submitData: any = {
      title: this.formData.title,
      description: this.formData.description || undefined,
      content: this.formData.content || undefined,
      classId: this.formData.classId || undefined
    };

    if (this.editingNotebook) {
      this.apiService.patch<Notebook>(`/notebooks/${this.editingNotebook.id}`, submitData).subscribe({
        next: () => {
          this.loadNotebooks();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating notebook:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تحديث الدفتر';
          alert(errorMessage);
        }
      });
    } else {
      this.apiService.post<Notebook>('/notebooks', submitData).subscribe({
        next: () => {
          this.loadNotebooks();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating notebook:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء إضافة الدفتر';
          alert(errorMessage);
        }
      });
    }
  }

  deleteNotebook(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا الدفتر؟')) {
      this.apiService.delete(`/notebooks/${id}`).subscribe({
        next: () => {
          this.loadNotebooks();
        },
        error: (error) => {
          console.error('Error deleting notebook:', error);
          alert('حدث خطأ أثناء حذف الدفتر');
        }
      });
    }
  }

  // Search and Filter
  applyFilters(): void {
    let filtered = [...this.notebooks];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(notebook => 
        notebook.title?.toLowerCase().includes(term) ||
        notebook.description?.toLowerCase().includes(term) ||
        notebook.content?.toLowerCase().includes(term)
      );
    }

    // Class filter
    if (this.selectedClassFilter !== null) {
      filtered = filtered.filter(notebook => notebook.classId === this.selectedClassFilter);
    }

    this.filteredNotebooks = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onClassFilterChange(): void {
    this.applyFilters();
  }

  getClassName(classId?: number): string {
    if (!classId) return '-';
    const classItem = this.classes.find(c => c.id === classId);
    return classItem ? classItem.name : '-';
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG');
  }

  truncateText(text: string | undefined, maxLength: number = 100): string {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Course Entry Management
  openAddCourseModal(notebook: Notebook): void {
    this.currentNotebookForCourse = notebook;
    this.editingCourse = null;
    this.courseFormData = {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '09:00',
      notebookId: notebook.id,
      topicId: undefined
    };
    this.showCourseModal = true;
  }

  openEditCourseModal(course: CourseEntry, notebook: Notebook): void {
    this.currentNotebookForCourse = notebook;
    this.editingCourse = course;
    this.courseFormData = {
      title: course.title,
      description: course.description,
      date: course.date,
      startTime: course.startTime,
      endTime: course.endTime,
      notebookId: course.notebookId,
      topicId: course.topicId
    };
    this.showCourseModal = true;
  }

  closeCourseModal(): void {
    this.showCourseModal = false;
    this.editingCourse = null;
    this.currentNotebookForCourse = null;
  }

  saveCourse(): void {
    if (!this.courseFormData.title || !this.courseFormData.description) {
      alert('يرجى إدخال العنوان والوصف');
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

    const normalizedStartTime = normalizeTime(this.courseFormData.startTime);
    let normalizedEndTime = normalizeTime(this.courseFormData.endTime);

    // Convert times to minutes for proper comparison
    let startMinutes = this.timeToMinutes(normalizedStartTime);
    let endMinutes = this.timeToMinutes(normalizedEndTime);
    
    if (isNaN(startMinutes) || isNaN(endMinutes)) {
      alert('خطأ في تنسيق الوقت. يرجى التأكد من إدخال الوقت بشكل صحيح');
      return;
    }
    
    // Handle edge case: if end time is 00:00 (midnight) and start time is in the morning (8:00-11:59),
    // the user likely meant 12:00 PM (noon) instead of 12:00 AM (midnight)
    if (endMinutes === 0 && startMinutes >= 480 && startMinutes < 720) {
      // Convert 00:00 to 12:00 (noon) - 720 minutes
      normalizedEndTime = '12:00';
      endMinutes = 720;
      // Update formData to reflect the correction
      this.courseFormData.endTime = normalizedEndTime;
    }
    
    if (startMinutes >= endMinutes) {
      alert('وقت البداية يجب أن يكون قبل وقت النهاية');
      return;
    }

    const submitData: any = {
      title: this.courseFormData.title,
      description: this.courseFormData.description,
      date: this.courseFormData.date,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      notebookId: this.courseFormData.notebookId,
      topicId: this.courseFormData.topicId || undefined
    };

    if (this.editingCourse) {
      this.apiService.patch<CourseEntry>(`/notebooks/${this.courseFormData.notebookId}/courses/${this.editingCourse.id}`, submitData).subscribe({
        next: () => {
          this.loadCourseEntries(this.courseFormData.notebookId);
          // Refresh report if it's open
          if (this.selectedNotebookForReport && this.selectedNotebookForReport.id === this.courseFormData.notebookId) {
            this.loadCourseEntries(this.selectedNotebookForReport.id);
          }
          this.closeCourseModal();
        },
        error: (error) => {
          console.error('Error updating course entry:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء تحديث الحصة';
          alert(errorMessage);
        }
      });
    } else {
      this.apiService.post<CourseEntry>(`/notebooks/${this.courseFormData.notebookId}/courses`, submitData).subscribe({
        next: () => {
          this.loadCourseEntries(this.courseFormData.notebookId);
          // Refresh report if it's open
          if (this.selectedNotebookForReport && this.selectedNotebookForReport.id === this.courseFormData.notebookId) {
            this.loadCourseEntries(this.selectedNotebookForReport.id);
          }
          this.closeCourseModal();
        },
        error: (error) => {
          console.error('Error creating course entry:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء إضافة الحصة';
          alert(errorMessage);
        }
      });
    }
  }

  deleteCourse(notebookId: number, courseId: number): void {
    if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      this.apiService.delete(`/notebooks/${notebookId}/courses/${courseId}`).subscribe({
        next: () => {
          this.loadCourseEntries(notebookId);
          // Refresh report if it's open
          if (this.selectedNotebookForReport && this.selectedNotebookForReport.id === notebookId) {
            this.loadCourseEntries(this.selectedNotebookForReport.id);
          }
        },
        error: (error) => {
          console.error('Error deleting course entry:', error);
          alert('حدث خطأ أثناء حذف الحصة');
        }
      });
    }
  }

  // Report View
  openReportModal(notebook: Notebook): void {
    this.selectedNotebookForReport = notebook;
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.selectedNotebookForReport = null;
  }

  getCourseEntriesForReport(notebook: Notebook): CourseEntry[] {
    if (!notebook.courseEntries) return [];
    return notebook.courseEntries.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  formatDateForReport(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatTimeRange(startTime: string, endTime: string): string {
    return `من ${startTime} إلى ${endTime}`;
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

  getTopicTitle(topicId?: number): string {
    if (!topicId) return '';
    const topic = this.topics.find(t => t.id === topicId);
    return topic ? topic.title : '';
  }

  getTopicSubtitle(topicId?: number): string {
    if (!topicId) return '';
    const topic = this.topics.find(t => t.id === topicId);
    return topic?.subtitle || '';
  }

  getTopicElements(topicId?: number): TopicElement[] {
    if (!topicId) return [];
    const topic = this.topics.find(t => t.id === topicId);
    return topic ? topic.elements : [];
  }

  onTopicChange(): void {
    // When topic is selected, user can still edit the description manually
    // The topic elements are shown as a preview but description remains editable
  }

  async exportReportToPDF(notebook: Notebook): Promise<void> {
    try {
      // Get the report table element
      const tableElement = document.getElementById('report-table');
      if (!tableElement) {
        alert('لا يمكن العثور على جدول التقرير');
        return;
      }

      // Create a container for the export
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
      title.textContent = `تقرير: ${notebook.title}`;
      title.style.textAlign = 'center';
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '15px';
      title.style.color = '#1f2937';
      exportContainer.appendChild(title);

      // Clone the table
      const clonedTable = tableElement.cloneNode(true) as HTMLElement;
      clonedTable.style.width = '100%';
      clonedTable.style.borderCollapse = 'collapse';
      
      // Remove action buttons from cloned table (edit/delete buttons)
      const actionButtons = clonedTable.querySelectorAll('button');
      actionButtons.forEach(button => {
        button.remove();
      });
      
      // Adjust font sizes for better PDF fit
      const allCells = clonedTable.querySelectorAll('td, th');
      allCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        const currentFontSize = window.getComputedStyle(htmlCell).fontSize;
        const fontSizeNum = parseFloat(currentFontSize);
        htmlCell.style.fontSize = `${Math.max(10, fontSizeNum * 0.9)}px`;
        htmlCell.style.padding = '6px';
      });
      
      exportContainer.appendChild(clonedTable);

      // Use html2canvas to capture the table with proper Arabic rendering
      const canvas = await html2canvas(exportContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.offsetHeight
      });

      // Clean up
      document.body.removeChild(exportContainer);

      // Calculate PDF dimensions (portrait A4)
      const imgWidth = 210; // A4 width in mm (portrait)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Calculate scale to fit on page(s)
      const pageHeight = 297; // A4 height in mm (portrait)
      const pageWidth = 210; // A4 width in mm (portrait)
      const margin = 10; // Margin on all sides
      const availableHeight = pageHeight - (2 * margin);
      const availableWidth = pageWidth - (2 * margin);
      
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      // Scale down if content is too large
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
      
      // Position content from top
      const xOffset = (pageWidth - finalWidth) / 2; // Center horizontally
      const yOffset = margin; // Start from top with margin

      // Add to PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Save PDF
      const fileName = `report_${notebook.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF. يرجى التأكد من تثبيت المكتبات المطلوبة.');
    }
  }
}

