import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'left_early' | 'unrecorded';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    photo?: string;
    gender?: 'male' | 'female';
  };
  classId: number;
  class?: {
    id: number;
    name: string;
  };
  date: string; // Format: YYYY-MM-DD
  status: AttendanceStatus;
  lessonTime?: string; // Format: HH:mm-HH:mm (e.g., "08:00-09:00")
  lessonSubject?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceRecordDto {
  studentId: number;
  classId: number;
  date: string;
  status: AttendanceStatus;
  lessonTime?: string;
  lessonSubject?: string;
  notes?: string;
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
  attendanceStatus?: AttendanceStatus;
}

export interface Class {
  id: number;
  name: string;
  level?: string;
  subject?: string;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  left_early: number;
  unrecorded: number;
  total: number;
}

export interface AttendanceStatistics {
  studentId: number;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  leftEarlyDays: number;
  attendanceRate: number;
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit {
  students: Student[] = [];
  classes: Class[] = [];
  selectedClass: Class | null = null;
  selectedDate: Date = new Date();
  selectedLessonTime: string = '08:00-09:00';
  selectedLessonSubject: string = '';
  attendanceRecords: AttendanceRecord[] = [];
  showReportModal = false;
  showStatisticsModal = false;
  reportType: 'absences' | 'statistics' | 'class' = 'absences';
  
  // Attendance statuses
  attendanceStatuses = [
    { value: 'present', label: 'حاضر', labelAr: 'حاضر', color: 'green', icon: '✓' },
    { value: 'absent', label: 'غائب', labelAr: 'غائب', color: 'red', icon: '✗' },
    { value: 'late', label: 'متأخر', labelAr: 'متأخر', color: 'blue', icon: '⏰' },
    { value: 'excused', label: 'معذور', labelAr: 'معذور', color: 'purple', icon: '📝' },
    { value: 'left_early', label: 'غادر مبكراً', labelAr: 'غادر مبكراً', color: 'orange', icon: '🚪' },
    { value: 'unrecorded', label: 'غير مسجل', labelAr: 'غير مسجل', color: 'gray', icon: '○' }
  ];

  // Weekly view
  weekDays: Date[] = [];
  showWeeklyView = false;

  constructor(private apiService: ApiService) {
    this.updateWeekDays();
  }

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.apiService.get<Class[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
        if (data.length > 0 && !this.selectedClass) {
          this.selectedClass = data[0];
          this.selectedLessonSubject = data[0].subject || '';
          this.loadStudentsForClass(data[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.classes = [];
      }
    });
  }

  loadStudentsForClass(classId: number): void {
    this.apiService.get<Student[]>(`/classes/${classId}/students`).subscribe({
      next: (data) => {
        this.students = data;
        this.loadAttendanceForDate();
      },
      error: (error) => {
        console.error('Error loading students:', error);
        // Fallback: load all students and filter
        this.apiService.get<Student[]>('/students').subscribe({
          next: (allStudents) => {
            this.students = allStudents.filter(s => s.classId === classId);
            this.loadAttendanceForDate();
          },
          error: (error2) => {
            console.error('Error loading students:', error2);
            this.students = [];
          }
        });
      }
    });
  }

  loadAttendanceForDate(): void {
    if (!this.selectedClass || !this.selectedDate) return;

    const dateStr = this.formatDateForAPI(this.selectedDate);
    this.apiService.get<AttendanceRecord[]>(`/attendance?classId=${this.selectedClass.id}&date=${dateStr}`).subscribe({
      next: (data) => {
        this.attendanceRecords = data;
        // Map attendance status to students
        this.students.forEach(student => {
          const record = data.find(r => r.studentId === student.id);
          student.attendanceStatus = record ? record.status : 'unrecorded';
        });
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.attendanceRecords = [];
        // Set all students to unrecorded
        this.students.forEach(student => {
          student.attendanceStatus = 'unrecorded';
        });
      }
    });
  }

  onClassChange(): void {
    if (this.selectedClass) {
      this.loadStudentsForClass(this.selectedClass.id);
    } else {
      this.students = [];
    }
  }

  onDateChange(): void {
    this.loadAttendanceForDate();
  }

  navigateDate(direction: 'prev' | 'next'): void {
    const days = direction === 'next' ? 1 : -1;
    this.selectedDate = new Date(this.selectedDate.getTime() + days * 24 * 60 * 60 * 1000);
    this.loadAttendanceForDate();
  }

  goToToday(): void {
    this.selectedDate = new Date();
    this.loadAttendanceForDate();
  }

  updateWeekDays(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
    
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.weekDays.push(date);
    }
  }

  navigateWeek(direction: 'prev' | 'next'): void {
    const days = direction === 'next' ? 7 : -7;
    this.weekDays = this.weekDays.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + days);
      return newDate;
    });
  }

  recordAttendance(student: Student, status: AttendanceStatus | string): void {
    if (!this.selectedClass) return;
    
    // Validate and convert string to AttendanceStatus
    const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'left_early', 'unrecorded'];
    const attendanceStatus = (validStatuses.includes(status as AttendanceStatus)) 
      ? status as AttendanceStatus 
      : 'unrecorded';

    const dateStr = this.formatDateForAPI(this.selectedDate);
    const existingRecord = this.attendanceRecords.find(r => 
      r.studentId === student.id && 
      r.date === dateStr &&
      r.classId === this.selectedClass!.id
    );

    const recordData: CreateAttendanceRecordDto = {
      studentId: student.id,
      classId: this.selectedClass.id,
      date: dateStr,
      status: attendanceStatus,
      lessonTime: this.selectedLessonTime,
      lessonSubject: this.selectedLessonSubject || undefined
    };

    if (existingRecord) {
      // Update existing record
      this.apiService.patch<AttendanceRecord>(`/attendance/${existingRecord.id}`, recordData).subscribe({
        next: () => {
          student.attendanceStatus = attendanceStatus;
          this.loadAttendanceForDate();
        },
        error: (error) => {
          console.error('Error updating attendance:', error);
          alert('حدث خطأ أثناء تحديث الحضور');
        }
      });
    } else {
      // Create new record
      this.apiService.post<AttendanceRecord>('/attendance', recordData).subscribe({
        next: () => {
          student.attendanceStatus = attendanceStatus;
          this.loadAttendanceForDate();
        },
        error: (error) => {
          console.error('Error creating attendance:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء تسجيل الحضور';
          alert(errorMessage);
        }
      });
    }
  }

  recordAttendanceForWeek(): void {
    if (!this.selectedClass || this.students.length === 0) {
      alert('يرجى اختيار قسم وتحميل التلاميذ');
      return;
    }

    if (confirm('هل تريد تسجيل الحضور لجميع أيام الأسبوع للتلاميذ المحددين؟')) {
      // Record attendance for each day of the week
      this.weekDays.forEach(date => {
        const dateStr = this.formatDateForAPI(date);
        this.students.forEach(student => {
          if (student.attendanceStatus && student.attendanceStatus !== 'unrecorded') {
            const recordData: CreateAttendanceRecordDto = {
              studentId: student.id,
              classId: this.selectedClass!.id,
              date: dateStr,
              status: student.attendanceStatus,
              lessonTime: this.selectedLessonTime,
              lessonSubject: this.selectedLessonSubject || undefined
            };

            this.apiService.post<AttendanceRecord>('/attendance', recordData).subscribe({
              error: (error) => {
                console.error(`Error recording attendance for ${student.firstName} on ${dateStr}:`, error);
              }
            });
          }
        });
      });
      
      alert('تم تسجيل الحضور للأسبوع بنجاح');
      this.loadAttendanceForDate();
    }
  }

  getAttendanceSummary(): AttendanceSummary {
    const summary: AttendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      left_early: 0,
      unrecorded: 0,
      total: this.students.length
    };

    this.students.forEach(student => {
      const status = student.attendanceStatus || 'unrecorded';
      if (status === 'present') summary.present++;
      else if (status === 'absent') summary.absent++;
      else if (status === 'late') summary.late++;
      else if (status === 'excused') summary.excused++;
      else if (status === 'left_early') summary.left_early++;
      else summary.unrecorded++;
    });

    return summary;
  }

  getStatusColor(status: AttendanceStatus): string {
    const statusObj = this.attendanceStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'gray';
  }

  getStatusLabel(status: AttendanceStatus): string {
    const statusObj = this.attendanceStatuses.find(s => s.value === status);
    return statusObj ? statusObj.labelAr : 'غير معروف';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDateShort(date: Date): string {
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString('ar-EG', { weekday: 'long' });
  }

  getStudentPhoto(student: Student): string {
    return student.photo || '';
  }

  hasPhoto(student: Student): boolean {
    return !!student.photo;
  }

  getDefaultIcon(student: Student): string {
    if (student.gender === 'female') {
      return '👩';
    }
    return '👨';
  }

  // Reports
  openReportModal(type: 'absences' | 'statistics' | 'class'): void {
    this.reportType = type;
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
  }

  getHighestAbsencesReport(): AttendanceStatistics[] {
    if (!this.selectedClass) return [];

    // Load all attendance records for the class
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // Last 3 months
    const endDate = new Date();

    // This would need to be implemented with proper API call
    // For now, return mock data structure
    return this.students.map(student => {
      const studentRecords = this.attendanceRecords.filter(r => r.studentId === student.id);
      const absentDays = studentRecords.filter(r => r.status === 'absent').length;
      const presentDays = studentRecords.filter(r => r.status === 'present').length;
      const totalDays = studentRecords.length || 1;
      const attendanceRate = (presentDays / totalDays) * 100;

      return {
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        totalDays: totalDays,
        presentDays: presentDays,
        absentDays: absentDays,
        lateDays: studentRecords.filter(r => r.status === 'late').length,
        excusedDays: studentRecords.filter(r => r.status === 'excused').length,
        leftEarlyDays: studentRecords.filter(r => r.status === 'left_early').length,
        attendanceRate: attendanceRate
      };
    }).sort((a, b) => b.absentDays - a.absentDays);
  }

  getAttendanceStatistics(): any {
    // Statistics by class, day, and month
    // This would need proper API implementation
    return {
      byClass: {},
      byDay: {},
      byMonth: {}
    };
  }

  getClassAttendanceReport(): AttendanceRecord[] {
    if (!this.selectedClass) return [];
    return this.attendanceRecords.filter(r => r.classId === this.selectedClass!.id);
  }

  getAttendanceForStudentAndDate(studentId: number, date: Date): AttendanceStatus {
    const dateStr = this.formatDateForAPI(date);
    const record = this.attendanceRecords.find(r => 
      r.studentId === studentId && 
      r.date === dateStr
    );
    return record ? record.status : 'unrecorded';
  }

  async exportReportToPDF(): Promise<void> {
    if (this.reportType !== 'absences') {
      alert('تصدير PDF متاح فقط لتقرير الغيابات');
      return;
    }

    try {
      // Wait a bit for Angular to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Find the absences report table
      const reportTable = document.querySelector('#absences-report-table') as HTMLElement;
      
      if (!reportTable) {
        alert('لا يمكن العثور على جدول التقرير. يرجى التأكد من فتح تقرير الغيابات');
        return;
      }

      // Create a container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '800px';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Clone the table
      const clonedTable = reportTable.cloneNode(true) as HTMLElement;
      
      // Style the cloned table for better PDF rendering
      clonedTable.style.width = '100%';
      clonedTable.style.borderCollapse = 'collapse';
      clonedTable.style.fontSize = '12px';
      
      // Style all cells
      const allCells = clonedTable.querySelectorAll('td, th');
      allCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.border = '1px solid #e5e7eb';
        htmlCell.style.padding = '8px';
        htmlCell.style.textAlign = 'right';
      });
      
      // Style header cells
      const headerCells = clonedTable.querySelectorAll('th');
      headerCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.backgroundColor = '#f3f4f6';
        htmlCell.style.fontWeight = 'bold';
        htmlCell.style.color = '#374151';
      });
      
      // Add title
      const title = document.createElement('h2');
      title.textContent = 'تقرير الغيابات';
      title.style.textAlign = 'right';
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '15px';
      title.style.color = '#111827';
      
      // Add class name and date if available
      const info = document.createElement('div');
      info.style.textAlign = 'right';
      info.style.marginBottom = '15px';
      info.style.fontSize = '12px';
      info.style.color = '#6b7280';
      
      const classInfo = this.selectedClass ? `القسم: ${this.selectedClass.name}` : '';
      const dateInfo = `التاريخ: ${new Date().toLocaleDateString('ar-EG')}`;
      info.innerHTML = `${classInfo}<br>${dateInfo}`;
      
      exportContainer.appendChild(title);
      exportContainer.appendChild(info);
      exportContainer.appendChild(clonedTable);
      
      document.body.appendChild(exportContainer);
      
      // Use html2canvas to capture the table
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
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
      
      // Add additional pages if needed
      let heightLeft = imgHeight - availableHeight;
      let position = -availableHeight;
      
      while (heightLeft > 0) {
        position = position - availableHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, position, finalWidth, finalHeight);
        heightLeft -= availableHeight;
      }
      
      // Save PDF
      const fileName = `تقرير_الغيابات_${this.selectedClass?.name || 'قسم'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير إلى PDF');
    }
  }

  // Helper methods for template
  getAttendanceSummaryValue(statusValue: string): number {
    const summary = this.getAttendanceSummary();
    const key = statusValue === 'left_early' ? 'left_early' : statusValue as keyof AttendanceSummary;
    return summary[key] || 0;
  }

  onDateInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.value) {
      this.selectedDate = new Date(target.value);
      this.onDateChange();
    }
  }

  onWeeklyAttendanceChange(day: Date, student: Student, event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.selectedDate = day;
      const status = target.value as AttendanceStatus;
      this.recordAttendance(student, status);
    }
  }

  formatDateFromString(dateString: string): string {
    const date = new Date(dateString);
    return this.formatDate(date);
  }
}

