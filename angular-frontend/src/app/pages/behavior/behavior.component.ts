import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface Behavior {
  id: number;
  type: 'positive' | 'negative';
  name: string;
  nameAr: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface BehaviorEvent {
  id: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    photo?: string;
  };
  behaviorId: number;
  behavior?: Behavior;
  date: Date | string;
  description?: string;
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBehaviorEventDto {
  studentId: number;
  behaviorId: number;
  date: string;
  description?: string;
  classId?: number;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  photo?: string;
  gender?: 'male' | 'female';
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
  behaviorCounts?: {
    positive: number;
    negative: number;
  };
}

export interface Class {
  id: number;
  name: string;
  level?: string;
}

export interface BehaviorReport {
  studentId: number;
  studentName: string;
  positiveCount: number;
  negativeCount: number;
  totalEvents: number;
  events: BehaviorEvent[];
}

@Component({
  selector: 'app-behavior',
  templateUrl: './behavior.component.html',
  styleUrls: ['./behavior.component.css']
})
export class BehaviorComponent implements OnInit {
  @ViewChild('studentReportContent') studentReportContent!: ElementRef;
  @ViewChild('classReportContent') classReportContent!: ElementRef;

  students: Student[] = [];
  filteredStudents: Student[] = [];
  classes: Class[] = [];
  behaviorEvents: BehaviorEvent[] = [];
  selectedClass: Class | null = null;
  selectedStudent: Student | null = null;
  showBehaviorModal = false;
  showReportModal = false;
  showStudentReportModal = false;
  selectedReportStudent: Student | null = null;
  reportData: BehaviorReport | null = null;
  
  // Behavior form
  formData: CreateBehaviorEventDto = {
    studentId: 0,
    behaviorId: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  };

  // Predefined behaviors
  positiveBehaviors: Behavior[] = [
    { id: 1, type: 'positive', name: 'Good General Behavior', nameAr: 'سلوك عام جيد', icon: '✓', color: 'green' },
    { id: 2, type: 'positive', name: 'Good Progress', nameAr: 'تقدم جيد', icon: '📈', color: 'green' },
    { id: 3, type: 'positive', name: 'Helpful', nameAr: 'متعاون', icon: '🤝', color: 'green' },
    { id: 4, type: 'positive', name: 'Homework done on time', nameAr: 'إنجاز الواجب في الوقت المحدد', icon: '✅', color: 'green' },
    { id: 5, type: 'positive', name: 'Participating', nameAr: 'مشارك', icon: '✋', color: 'green' }
  ];

  negativeBehaviors: Behavior[] = [
    { id: 6, type: 'negative', name: 'Generally Bad Behavior', nameAr: 'سلوك عام سيء', icon: '✗', color: 'red' },
    { id: 7, type: 'negative', name: 'Uses Mobile Phones Excessively', nameAr: 'استخدام الهاتف بشكل مفرط', icon: '📱', color: 'red' },
    { id: 8, type: 'negative', name: 'Fighting', nameAr: 'شجار', icon: '👊', color: 'red' },
    { id: 9, type: 'negative', name: 'Homework Issues', nameAr: 'مشاكل في الواجب', icon: '📝', color: 'red' },
    { id: 10, type: 'negative', name: 'Chatting', nameAr: 'ثرثرة', icon: '💬', color: 'red' }
  ];

  allBehaviors: Behavior[] = [...this.positiveBehaviors, ...this.negativeBehaviors];
  
  // Warning threshold
  warningThreshold: number = 3; // Default: warn after 3 negative behaviors
  
  // View mode
  viewMode: 'grid' | 'list' = 'grid';
  selectedBehaviorType: 'all' | 'positive' | 'negative' = 'all';

  constructor(
    private apiService: ApiService,
    public languageService: LanguageService
  ) {}

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  private getLocale(): string {
    const lang = this.languageService.getCurrentLanguage();
    switch (lang) {
      case 'FR':
        return 'fr-FR';
      case 'EN':
        return 'en-US';
      case 'ES':
        return 'es-ES';
      case 'IT':
        return 'it-IT';
      case 'DE':
        return 'de-DE';
      case 'TR':
        return 'tr-TR';
      case 'AR':
      default:
        return 'ar-EG';
    }
  }

  ngOnInit(): void {
    this.loadClasses();
    this.loadBehaviors();
  }

  loadClasses(): void {
    this.apiService.get<Class[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
        // Automatically select first class and load students
        if (data.length > 0) {
          if (!this.selectedClass || !data.find(c => c.id === this.selectedClass?.id)) {
            this.selectedClass = data[0];
            this.loadStudentsForClass(data[0].id);
          } else if (this.selectedClass) {
            // Reload students for currently selected class
            this.loadStudentsForClass(this.selectedClass.id);
          }
        }
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.classes = [];
      }
    });
  }

  loadStudentsForClass(classId: number): void {
    // Try to load students from class endpoint first
    this.apiService.get<Student[]>(`/classes/${classId}/students`).subscribe({
      next: (data) => {
        this.students = data;
        this.loadBehaviorCounts();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading students from class endpoint, trying students endpoint:', error);
        // Fallback: load all students and filter by classId
        this.apiService.get<Student[]>('/students').subscribe({
          next: (allStudents) => {
            // Filter students by classId
            this.students = allStudents.filter(s => s.classId === classId);
            this.loadBehaviorCounts();
            this.applyFilters();
          },
          error: (error2) => {
            console.error('Error loading students:', error2);
            this.students = [];
            this.filteredStudents = [];
          }
        });
      }
    });
  }

  loadBehaviors(): void {
    // Try to load from API, fallback to predefined
    this.apiService.get<Behavior[]>('/behaviors').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allBehaviors = data;
          this.positiveBehaviors = data.filter(b => b.type === 'positive');
          this.negativeBehaviors = data.filter(b => b.type === 'negative');
        }
      },
      error: (error) => {
        console.error('Error loading behaviors:', error);
        // Use predefined behaviors
      }
    });
  }

  loadBehaviorCounts(): void {
    if (!this.selectedClass) return;
    
    this.apiService.get<BehaviorEvent[]>(`/behavior-events?classId=${this.selectedClass.id}`).subscribe({
      next: (data) => {
        this.behaviorEvents = data;
        // Calculate counts for each student
        this.students.forEach(student => {
          const studentEvents = data.filter(e => e.studentId === student.id);
          const positive = studentEvents.filter(e => {
            const behavior = this.allBehaviors.find(b => b.id === e.behaviorId);
            return behavior?.type === 'positive';
          }).length;
          const negative = studentEvents.filter(e => {
            const behavior = this.allBehaviors.find(b => b.id === e.behaviorId);
            return behavior?.type === 'negative';
          }).length;
          
          student.behaviorCounts = { positive, negative };
        });
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading behavior events:', error);
        this.behaviorEvents = [];
      }
    });
  }

  onClassChange(): void {
    if (this.selectedClass) {
      this.loadStudentsForClass(this.selectedClass.id);
    } else {
      this.students = [];
      this.filteredStudents = [];
    }
  }

  openBehaviorModal(student: Student): void {
    this.selectedStudent = student;
    this.formData = {
      studentId: student.id,
      behaviorId: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      classId: this.selectedClass?.id
    };
    this.showBehaviorModal = true;
  }

  closeBehaviorModal(): void {
    this.showBehaviorModal = false;
    this.selectedStudent = null;
  }

  saveBehaviorEvent(): void {
    if (!this.formData.behaviorId) {
      alert(this.translate('behavior.selectTypeRequired'));
      return;
    }

    this.apiService.post<BehaviorEvent>('/behavior-events', this.formData).subscribe({
      next: () => {
        this.loadBehaviorCounts();
        this.closeBehaviorModal();
      },
      error: (error) => {
        console.error('Error saving behavior event:', error);
        const errorMessage = error?.error?.message || 
                           (error?.error?.error && Array.isArray(error.error.error) 
                             ? error.error.error.join(', ') 
                             : error.error?.error) ||
                           error?.message || 
                           this.translate('behavior.errorSave');
        alert(errorMessage);
      }
    });
  }

  deleteBehaviorEvent(eventId: number): void {
  if (confirm(this.translate('behavior.confirmDelete'))) {
      this.apiService.delete(`/behavior-events/${eventId}`).subscribe({
        next: () => {
          this.loadBehaviorCounts();
          if (this.reportData) {
            this.loadStudentReport(this.selectedReportStudent!);
          }
        },
        error: (error) => {
          console.error('Error deleting behavior event:', error);
        alert(this.translate('behavior.errorDelete'));
        }
      });
    }
  }

  selectBehavior(behavior: Behavior): void {
    this.formData.behaviorId = behavior.id;
  }

  openStudentReport(student: Student): void {
    this.selectedReportStudent = student;
    this.loadStudentReport(student);
    this.showStudentReportModal = true;
  }

  loadStudentReport(student: Student): void {
    this.apiService.get<BehaviorEvent[]>(`/behavior-events?studentId=${student.id}`).subscribe({
      next: (events) => {
        const positiveEvents = events.filter(e => {
          const behavior = this.allBehaviors.find(b => b.id === e.behaviorId);
          return behavior?.type === 'positive';
        });
        const negativeEvents = events.filter(e => {
          const behavior = this.allBehaviors.find(b => b.id === e.behaviorId);
          return behavior?.type === 'negative';
        });

        this.reportData = {
          studentId: student.id,
          studentName: `${student.lastName} ${student.firstName}`,
          positiveCount: positiveEvents.length,
          negativeCount: negativeEvents.length,
          totalEvents: events.length,
          events: events.sort((a, b) => {
            const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
            const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
            return dateB.getTime() - dateA.getTime();
          })
        };

        // Check for warnings
        if (this.reportData.negativeCount >= this.warningThreshold) {
          alert(
            this.translate('behavior.warningExceeded')
              .replace('{{studentName}}', this.reportData.studentName)
              .replace('{{negativeCount}}', String(this.reportData.negativeCount))
              .replace('{{threshold}}', String(this.warningThreshold))
          );
        }
      },
      error: (error) => {
        console.error('Error loading student report:', error);
        this.reportData = null;
      }
    });
  }

  closeStudentReportModal(): void {
    this.showStudentReportModal = false;
    this.selectedReportStudent = null;
    this.reportData = null;
  }

  openClassReport(): void {
    if (!this.selectedClass) {
      alert(this.translate('behavior.selectClassFirst'));
      return;
    }
    this.showReportModal = true;
  }

  closeClassReportModal(): void {
    this.showReportModal = false;
  }

  getClassReportData(): BehaviorReport[] {
    if (!this.selectedClass) return [];
    
    return this.students.map(student => {
      const studentEvents = this.behaviorEvents.filter(e => e.studentId === student.id);
      const positiveEvents = studentEvents.filter(e => {
        const behavior = this.allBehaviors.find(b => b.id === e.behaviorId);
        return behavior?.type === 'positive';
      });
      const negativeEvents = studentEvents.filter(e => {
        const behavior = this.allBehaviors.find(b => b.id === e.behaviorId);
        return behavior?.type === 'negative';
      });

      return {
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        positiveCount: positiveEvents.length,
        negativeCount: negativeEvents.length,
        totalEvents: studentEvents.length,
        events: studentEvents
      };
    }).sort((a, b) => b.negativeCount - a.negativeCount); // Sort by negative count
  }

  getStudentById(studentId: number): Student | undefined {
    return this.students.find(s => s.id === studentId) || this.filteredStudents.find(s => s.id === studentId);
  }

  getBehaviorName(behaviorId: number): string {
    const behavior = this.allBehaviors.find(b => b.id === behaviorId);
    if (!behavior) {
      // Fallback to a generic "unknown" label if available
      return this.translate('common.unknown') || 'Unknown';
    }
    // Use Arabic name when UI language is Arabic, otherwise default to non-Arabic name
    return this.languageService.getCurrentLanguage() === 'AR'
      ? (behavior.nameAr || behavior.name)
      : (behavior.name || behavior.nameAr);
  }

  getBehaviorType(behaviorId: number): 'positive' | 'negative' | null {
    const behavior = this.allBehaviors.find(b => b.id === behaviorId);
    return behavior ? behavior.type : null;
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(this.getLocale(), { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDateTime(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(this.getLocale(), { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  applyFilters(): void {
    let filtered = [...this.students];
    this.filteredStudents = filtered;
  }

  getStudentPhoto(student: Student): string {
    return student.photo || '';
  }

  hasPhoto(student: Student): boolean {
    return !!student.photo;
  }

  getDefaultIcon(student: Student): string {
    if (student.gender === 'female') {
      return '👩'; // Female icon
    }
    return '👨'; // Male icon (default)
  }

  checkWarnings(): void {
    this.students.forEach(student => {
      if (student.behaviorCounts && student.behaviorCounts.negative >= this.warningThreshold) {
        // Warning is shown when opening student report
      }
    });
  }

  exportStudentReportToPDF(student: Student): void {
    if (!this.reportData || !this.studentReportContent) {
      alert(this.translate('behavior.noDataToExport'));
      return;
    }

    const contentElement = this.studentReportContent.nativeElement;
    const scrollableContent = contentElement.querySelector('.flex-1.overflow-y-auto');
    
    // Store original styles
    const originalMaxHeight = contentElement.style.maxHeight;
    const originalOverflow = scrollableContent ? scrollableContent.style.overflow : '';
    const originalHeight = scrollableContent ? scrollableContent.style.height : '';

    // Hide the export button and delete buttons temporarily
    const exportButton = contentElement.querySelector('button[class*="bg-red-600"]');
    const deleteButtons = contentElement.querySelectorAll('button[class*="text-red-600"]');
    if (exportButton) {
      exportButton.style.display = 'none';
    }
    deleteButtons.forEach((btn: HTMLElement) => {
      btn.style.display = 'none';
    });

    // Remove height restrictions to show all content
    contentElement.style.maxHeight = 'none';
    if (scrollableContent) {
      scrollableContent.style.overflow = 'visible';
      scrollableContent.style.height = 'auto';
    }

    // Scroll to top to ensure we capture from the beginning
    if (scrollableContent) {
      scrollableContent.scrollTop = 0;
    }

    // Wait a bit for the layout to update
    setTimeout(() => {
      // Use html2canvas to capture the content
      html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: contentElement.scrollWidth,
        windowHeight: contentElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      }).then((canvas) => {
        // Restore original styles
        contentElement.style.maxHeight = originalMaxHeight;
        if (scrollableContent) {
          scrollableContent.style.overflow = originalOverflow;
          scrollableContent.style.height = originalHeight;
        }

        // Show the buttons again
        if (exportButton) {
          exportButton.style.display = '';
        }
        deleteButtons.forEach((btn: HTMLElement) => {
          btn.style.display = '';
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const doc = new jsPDF('p', 'mm', 'a4');
        let position = 0;

        // Add first page
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save PDF
        const baseName = this.translate('behavior.studentReportTitle').replace(/\s+/g, '_');
        const studentName = this.reportData?.studentName || 'student';
        const fileName = `${baseName}_${studentName}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      }).catch((error) => {
        console.error('Error generating PDF:', error);
        alert(this.translate('behavior.errorExportPdf'));
        
        // Restore original styles on error
        contentElement.style.maxHeight = originalMaxHeight;
        if (scrollableContent) {
          scrollableContent.style.overflow = originalOverflow;
          scrollableContent.style.height = originalHeight;
        }
        if (exportButton) {
          exportButton.style.display = '';
        }
        deleteButtons.forEach((btn: HTMLElement) => {
          btn.style.display = '';
        });
      });
    }, 100);
  }

  exportClassReportToPDF(): void {
    if (!this.selectedClass || !this.classReportContent) {
      alert(this.translate('behavior.selectClassFirst'));
      return;
    }

    const reportData = this.getClassReportData();
    if (reportData.length === 0) {
      alert(this.translate('behavior.noDataToExport'));
      return;
    }

    const contentElement = this.classReportContent.nativeElement;
    const scrollableContent = contentElement.querySelector('.flex-1.overflow-y-auto');
    
    // Store original styles
    const originalMaxHeight = contentElement.style.maxHeight;
    const originalOverflow = scrollableContent ? scrollableContent.style.overflow : '';
    const originalHeight = scrollableContent ? scrollableContent.style.height : '';

    // Hide the export button temporarily
    const exportButton = contentElement.querySelector('button[class*="bg-red-600"]');
    if (exportButton) {
      exportButton.style.display = 'none';
    }

    // Remove height restrictions to show all content
    contentElement.style.maxHeight = 'none';
    if (scrollableContent) {
      scrollableContent.style.overflow = 'visible';
      scrollableContent.style.height = 'auto';
    }

    // Scroll to top to ensure we capture from the beginning
    if (scrollableContent) {
      scrollableContent.scrollTop = 0;
    }

    // Wait a bit for the layout to update
    setTimeout(() => {
      // Use html2canvas to capture the content
      html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: contentElement.scrollWidth,
        windowHeight: contentElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      }).then((canvas) => {
        // Restore original styles
        contentElement.style.maxHeight = originalMaxHeight;
        if (scrollableContent) {
          scrollableContent.style.overflow = originalOverflow;
          scrollableContent.style.height = originalHeight;
        }

        // Show the button again
        if (exportButton) {
          exportButton.style.display = '';
        }

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 297; // A4 landscape width in mm
        const pageHeight = 210; // A4 landscape height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        let position = 0;

        // Add first page
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save PDF
        const baseName = this.translate('behavior.classReportTitle').replace(/\s+/g, '_');
        const className = this.selectedClass?.name || 'class';
        const fileName = `${baseName}_${className}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      }).catch((error) => {
        console.error('Error generating PDF:', error);
        alert(this.translate('behavior.errorExportPdf'));
        
        // Restore original styles on error
        contentElement.style.maxHeight = originalMaxHeight;
        if (scrollableContent) {
          scrollableContent.style.overflow = originalOverflow;
          scrollableContent.style.height = originalHeight;
        }
        if (exportButton) {
          exportButton.style.display = '';
        }
      });
    }, 100);
  }
}

