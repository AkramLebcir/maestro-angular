import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { jsPDF } from 'jspdf';
import { ActivatedRoute } from '@angular/router';
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
  _dirty?: boolean;
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

export interface SpecialCase {
  category: 'health' | 'exemption' | 'learning_difficulty';
  details: string;
  requiredAction: string;
  attachments?: string[];
  startDate?: string;
  endDate?: string;
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
  specialCases?: SpecialCase[] | null;
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

export interface DepartmentAttendanceReport {
  studentId: number;
  studentName: string;
  dailyPresent: number;
  dailyAbsent: number;
  weeklyPresent: number;
  weeklyAbsent: number;
  monthlyPresent: number;
  monthlyAbsent: number;
  attendanceRate: number;
  status: 'excellent' | 'good' | 'needs_attention';
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
  reportType: 'absences' | 'statistics' | 'class' | 'department' = 'absences';
  
  // Attendance statuses
  attendanceStatuses = [
    { value: 'unrecorded', labelKey: 'attendance.status', color: 'gray', icon: '○' },
    { value: 'present', labelKey: 'attendance.present', color: 'green', icon: '✓' },
    { value: 'absent', labelKey: 'attendance.absent', color: 'red', icon: '✗' },
    { value: 'late', labelKey: 'attendance.late', color: 'blue', icon: '⏰' },
    { value: 'excused', labelKey: 'attendance.excused', color: 'purple', icon: '📝' },
    { value: 'left_early', labelKey: 'attendance.leftEarly', color: 'orange', icon: '🚪' }
  ];

  // Weekly view
  weekDays: Date[] = [];
  showWeeklyView = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.updateWeekDays();
  }

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

     // دعم الفتح من صفحة التقارير مع تفعيل تبويب التقارير والتصدير عند الحاجة
     this.route.queryParams.subscribe((params) => {
       const autoExport = params['autoExport'] === '1';
       if (autoExport) {
         // افتح نافذة التقارير على تقرير الغيابات ثم صدّر PDF
         this.openReportModal('absences');
         setTimeout(() => this.exportReportToPDF(), 400);
       }
     });
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
        // تحميل السجلات حسب نوع العرض (يومي أو أسبوعي)
        if (this.showWeeklyView) {
          this.loadAttendanceForWeek();
        } else {
          this.loadAttendanceForDate();
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
        // Fallback: load all students and filter
        this.apiService.get<Student[]>('/students').subscribe({
          next: (allStudents) => {
            this.students = allStudents.filter(s => s.classId === classId);
            // تحميل السجلات حسب نوع العرض (يومي أو أسبوعي)
            if (this.showWeeklyView) {
              this.loadAttendanceForWeek();
            } else {
              this.loadAttendanceForDate();
            }
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
        // الاحتفاظ بالسجلات المعدلة محلياً (سواء كانت جديدة أو محفوظة ومعدلة)
        // والتي لم يتم مزامنتها بعد أو تم تعديلها مؤخراً
        const dirtyRecords = this.attendanceRecords.filter(r => 
          r.date === dateStr && 
          r.classId === this.selectedClass!.id &&
          (r._dirty || !r.id || r.id === 0)
        );
        
        // الاحتفاظ بالسجلات الأخرى (تواريخ أخرى أو فصول أخرى)
        const otherRecords = this.attendanceRecords.filter(r => 
          !(r.date === dateStr && r.classId === this.selectedClass!.id)
        );
        
        // تصفية البيانات القادمة من API: لا نأخذ السجلات التي لدينا نسخة dirty منها محلياً
        const newData = data.filter(apiRecord => 
          !dirtyRecords.some(local => local.studentId === apiRecord.studentId)
        );
        
        // دمج السجلات: الأولوية للسجلات المحلية المعدلة (dirty)
        this.attendanceRecords = [...otherRecords, ...dirtyRecords, ...newData];
        
        // Map attendance status to students for current date
        // أولوية للسجلات المحلية ثم السجلات من API
        this.students.forEach(student => {
          // البحث في المصفوفة المحدثة
          const record = this.attendanceRecords.find(r => 
            r.studentId === student.id && 
            r.date === dateStr &&
            r.classId === this.selectedClass!.id
          );
          student.attendanceStatus = record ? record.status : 'unrecorded';
        });
        
        // إجبار Angular على اكتشاف التغييرات
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        // Set all students to unrecorded for current date
        this.students.forEach(student => {
          student.attendanceStatus = 'unrecorded';
        });
      }
    });
  }

  loadAttendanceForWeek(): void {
    if (!this.selectedClass || this.weekDays.length === 0) return;

    // تحميل سجلات الحضور لجميع أيام الأسبوع
    const weekDates = this.weekDays.map(day => this.formatDateForAPI(day));
    const weekDatesSet = new Set(weekDates);

    // الاحتفاظ بالسجلات المعدلة محلياً (dirty) أو الجديدة للأسبوع الحالي
    const dirtyRecords = this.attendanceRecords.filter(r => 
      r.classId === this.selectedClass!.id &&
      weekDatesSet.has(r.date) &&
      (r._dirty || !r.id || r.id === 0)
    );

    // الاحتفاظ بالسجلات التي خارج الأسبوع الحالي أو لفصل آخر
    const otherRecords = this.attendanceRecords.filter(r => 
      !(r.classId === this.selectedClass!.id && 
        weekDatesSet.has(r.date))
    );

    // تحميل السجلات لكل يوم في الأسبوع
    const loadPromises = weekDates.map(dateStr => {
      return new Promise<AttendanceRecord[]>((resolve) => {
        this.apiService.get<AttendanceRecord[]>(`/attendance?classId=${this.selectedClass!.id}&date=${dateStr}`).subscribe({
          next: (data) => {
            resolve(data);
          },
          error: (error) => {
            console.error(`Error loading attendance for ${dateStr}:`, error);
            resolve([]);
          }
        });
      });
    });

    // انتظار تحميل جميع السجلات
    Promise.all(loadPromises).then((allApiRecordsArrays) => {
      // دمج جميع السجلات من API
      const allApiRecords = allApiRecordsArrays.flat();
      
      // تصفية سجلات API: تجاهل السجلات التي لدينا نسخة dirty منها محلياً
      const validApiRecords = allApiRecords.filter(apiRecord => 
        !dirtyRecords.some(local => 
          local.studentId === apiRecord.studentId && 
          local.date === apiRecord.date
        )
      );
      
      // دمج السجلات: الأولوية لـ dirtyRecords
      this.attendanceRecords = [...otherRecords, ...dirtyRecords, ...validApiRecords];
      
      // إجبار Angular على اكتشاف التغييرات
      this.cdr.markForCheck();
      
      // بعد تحميل جميع السجلات، تحديث حالة الطلاب لليوم المحدد في العرض اليومي
      if (!this.showWeeklyView && this.selectedDate) {
        const dateStr = this.formatDateForAPI(this.selectedDate);
        this.students.forEach(student => {
          const record = this.attendanceRecords.find(r => 
            r.studentId === student.id && 
            r.date === dateStr &&
            r.classId === this.selectedClass!.id
          );
          student.attendanceStatus = record ? record.status : 'unrecorded';
        });
      }
    });
  }

  loadAllAttendanceRecords(): void {
    // Load all attendance records for statistics
    if (!this.selectedClass) return;
    
    this.apiService.get<AttendanceRecord[]>(`/attendance?classId=${this.selectedClass.id}`).subscribe({
      next: (data) => {
        this.attendanceRecords = data;
      },
      error: (error) => {
        console.error('Error loading all attendance records:', error);
        this.attendanceRecords = [];
      }
    });
  }

  onClassChange(): void {
    if (this.selectedClass) {
      this.loadStudentsForClass(this.selectedClass.id);
      this.loadAllAttendanceRecords();
    } else {
      this.students = [];
      this.attendanceRecords = [];
    }
  }

  onDateChange(): void {
    this.loadAttendanceForDate();
  }

  toggleWeeklyView(): void {
    this.showWeeklyView = !this.showWeeklyView;
    // عند التبديل للعرض الأسبوعي، تحديث أيام الأسبوع بناءً على التاريخ المحدد
    if (this.showWeeklyView) {
      // تحديث أيام الأسبوع لتكون الأسبوع الذي يحتوي على التاريخ المحدد
      const selectedDate = this.selectedDate;
      const dayOfWeek = selectedDate.getDay();
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
      
      this.weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        this.weekDays.push(date);
      }
      // تحميل سجلات الحضور للأسبوع
      this.loadAttendanceForWeek();
    } else {
      // عند العودة للعرض اليومي، تحميل سجلات الحضور لليوم المحدد
      this.loadAttendanceForDate();
    }
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
    // تحميل سجلات الحضور للأسبوع الجديد
    this.loadAttendanceForWeek();
  }

  recordAttendance(student: Student, status: AttendanceStatus | string): void {
    if (!this.selectedClass) return;
    
    // Validate and convert string to AttendanceStatus
    const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'left_early', 'unrecorded'];
    const attendanceStatus = (validStatuses.includes(status as AttendanceStatus)) 
      ? status as AttendanceStatus 
      : 'unrecorded';

    // Check if student is exempted and being marked as absent
    if (attendanceStatus === 'absent' && this.isExempted(student)) {
      const confirmMark = confirm(
        `⚠️ تنبيه: ${student.firstName} ${student.lastName} معفى رسمياً.\n` +
        `هل أنت متأكد من تسجيله كغائب؟\n\n` +
        `تفاصيل الإعفاء:\n${this.getExemptionDetails(student)}`
      );
      if (!confirmMark) {
        return; // Cancel the action
      }
    }

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

    // تحديث محلي فوري للسجل حتى يظهر في العرض الأسبوعي مباشرة
    if (existingRecord) {
      existingRecord.status = attendanceStatus;
      existingRecord.lessonTime = this.selectedLessonTime;
      existingRecord.lessonSubject = this.selectedLessonSubject || undefined;
      existingRecord._dirty = true;
    } else {
      // إضافة سجل جديد محلياً
      this.attendanceRecords.push({
        id: 0, // سيتم استبداله بالقيمة الصحيحة عند إعادة التحميل من API
        studentId: student.id,
        classId: this.selectedClass.id,
        date: dateStr,
        status: attendanceStatus,
        lessonTime: this.selectedLessonTime,
        lessonSubject: this.selectedLessonSubject || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        _dirty: true
      } as AttendanceRecord);
    }

    // تحديث حالة الطالب محلياً
    student.attendanceStatus = attendanceStatus;
    
    // إجبار Angular على اكتشاف التغييرات
    this.cdr.markForCheck();

    // التحقق من أن السجل موجود وله ID صحيح (أكبر من 0)
    // إذا كان ID = 0 فهذا يعني أنه سجل محلي مؤقت لم يتم حفظه بعد في الـAPI
    if (existingRecord && existingRecord.id && existingRecord.id > 0) {
      // Update existing record
      this.apiService.patch<AttendanceRecord>(`/attendance/${existingRecord.id}`, recordData).subscribe({
        next: (updatedRecord) => {
          // تحديث السجل المحلي بالبيانات المحدثة من الـAPI
          if (existingRecord) {
            Object.assign(existingRecord, updatedRecord);
            existingRecord._dirty = false;
          }
          // تحديث العرض اليومي
          this.loadAttendanceForDate();
          // إذا كان العرض الأسبوعي مفتوحاً، تحديثه أيضاً
          if (this.showWeeklyView) {
            // لا حاجة لإعادة تحميل كامل، السجلات المحلية محدثة بالفعل
          }
        },
        error: (error) => {
          console.error('Error updating attendance:', error);
          // عرض رسالة خطأ أكثر تفصيلاً
          let errorMessage = this.translate('attendance.errorUpdate');
          
          if (error?.error?.message) {
            errorMessage += `: ${error.error.message}`;
          } else if (error?.error?.error && Array.isArray(error.error.error)) {
            errorMessage += `: ${error.error.error.join(', ')}`;
          } else if (error?.error?.error) {
            errorMessage += `: ${error.error.error}`;
          } else if (error?.message) {
            errorMessage += `: ${error.message}`;
          } else if (error?.status === 401) {
            errorMessage = 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.';
          } else if (error?.status === 403) {
            errorMessage = 'ليس لديك صلاحية لتحديث الحضور.';
          } else if (error?.status === 404) {
            errorMessage = 'لم يتم العثور على سجل الحضور.';
          } else if (error?.status === 500) {
            errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
          } else if (error?.status === 0 || error?.message?.includes('Network')) {
            errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من الاتصال بالإنترنت.';
          }
          
          alert(errorMessage);
        }
      });
    } else {
      // Create new record
      this.apiService.post<AttendanceRecord>('/attendance', recordData).subscribe({
        next: (newRecord) => {
          // تحديث السجل المحلي بالبيانات الجديدة من الـAPI
          const localRecord = this.attendanceRecords.find(r => 
            r.studentId === student.id && 
            r.date === dateStr &&
            r.classId === this.selectedClass!.id &&
            r.id === 0
          );
          if (localRecord) {
            Object.assign(localRecord, newRecord);
            localRecord._dirty = false;
          } else {
            // إذا لم يتم العثور على السجل المحلي، أضفه
            this.attendanceRecords.push(newRecord);
          }
          // تحديث العرض اليومي
          this.loadAttendanceForDate();
          // إذا كان العرض الأسبوعي مفتوحاً، تحديث حالة الطالب لليوم المحدد
          if (this.showWeeklyView) {
            // السجلات المحلية محدثة بالفعل، لا حاجة لإعادة تحميل
          }
        },
        error: (error) => {
          console.error('Error creating attendance:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             this.translate('attendance.errorCreate');
          alert(errorMessage);
        }
      });
    }
  }

  recordAttendanceForWeek(): void {
    if (!this.selectedClass || this.students.length === 0) {
      alert(this.translate('attendance.selectClassAndStudents'));
      return;
    }

    if (confirm(this.translate('attendance.confirmRecordWeek'))) {
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
      
      alert(this.translate('attendance.weekRecorded'));
      this.loadAttendanceForDate();
    }
  }

  getAttendanceSummary(): AttendanceSummary {
    // في العرض اليومي: نحسب الملخص حسب حالة كل تلميذ لليوم المحدد فقط
    if (!this.showWeeklyView) {
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

    // في العرض الأسبوعي: نحسب الملخص على مستوى الأسبوع كاملاً
    const summary: AttendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      left_early: 0,
      unrecorded: 0,
      total: this.students.length * this.weekDays.length
    };

    if (!this.selectedClass || this.attendanceRecords.length === 0 || this.weekDays.length === 0) {
      summary.unrecorded = summary.total;
      return summary;
    }

    const weekDates = new Set(this.weekDays.map(d => this.formatDateForAPI(d)));

    this.attendanceRecords.forEach(record => {
      if (record.classId !== this.selectedClass!.id) {
        return;
      }
      if (!weekDates.has(record.date)) {
        return;
      }

      if (record.status === 'present') summary.present++;
      else if (record.status === 'absent') summary.absent++;
      else if (record.status === 'late') summary.late++;
      else if (record.status === 'excused') summary.excused++;
      else if (record.status === 'left_early') summary.left_early++;
    });

    const recorded =
      summary.present +
      summary.absent +
      summary.late +
      summary.excused +
      summary.left_early;
    summary.unrecorded = Math.max(0, summary.total - recorded);

    return summary;
  }

  getStatusColor(status: AttendanceStatus): string {
    const statusObj = this.attendanceStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'gray';
  }

  getStatusLabel(status: AttendanceStatus): string {
    switch (status) {
      case 'present':
        return this.translate('attendance.present');
      case 'absent':
        return this.translate('attendance.absent');
      case 'late':
        return this.translate('attendance.late');
      case 'excused':
        return this.translate('attendance.excused');
      case 'left_early':
        return this.translate('attendance.leftEarly');
      case 'unrecorded':
      default:
        return this.translate('attendance.status');
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString(this.getLocale(), { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDateShort(date: Date): string {
    return date.toLocaleDateString(this.getLocale(), { 
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
    return date.toLocaleDateString(this.getLocale(), { weekday: 'long' });
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
  openReportModal(type: 'absences' | 'statistics' | 'class' | 'department'): void {
    this.reportType = type;
    this.showReportModal = true;
    // Load all attendance records for statistics and department report
    if (type === 'statistics' || type === 'department') {
      this.loadAllAttendanceRecords();
    }
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

  getAttendanceStatistics(): {
    byClass: { [classId: string]: { present: number; absent: number; late: number; excused: number; leftEarly: number; total: number; className: string } };
    byDay: { [day: string]: { present: number; absent: number; late: number; excused: number; leftEarly: number; total: number } };
    byMonth: { [month: string]: { present: number; absent: number; late: number; excused: number; leftEarly: number; total: number } };
  } {
    const stats = {
      byClass: {} as { [classId: string]: { present: number; absent: number; late: number; excused: number; leftEarly: number; total: number; className: string } },
      byDay: {} as { [day: string]: { present: number; absent: number; late: number; excused: number; leftEarly: number; total: number } },
      byMonth: {} as { [month: string]: { present: number; absent: number; late: number; excused: number; leftEarly: number; total: number } }
    };

    // Load all attendance records for statistics
    // This would ideally come from API, but for now we'll use loaded records
    const allRecords = this.attendanceRecords;

    // Statistics by Class
    allRecords.forEach(record => {
      const classId = String(record.classId || 'unknown');
      if (!stats.byClass[classId]) {
        stats.byClass[classId] = {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          leftEarly: 0,
          total: 0,
          className: record.class?.name || `القسم ${classId}`
        };
      }
      
      stats.byClass[classId].total++;
      if (record.status === 'present') stats.byClass[classId].present++;
      else if (record.status === 'absent') stats.byClass[classId].absent++;
      else if (record.status === 'late') stats.byClass[classId].late++;
      else if (record.status === 'excused') stats.byClass[classId].excused++;
      else if (record.status === 'left_early') stats.byClass[classId].leftEarly++;
    });

    // Statistics by Day
    allRecords.forEach(record => {
      const date = typeof record.date === 'string' ? new Date(record.date) : record.date;
      const dayKey = date.toLocaleDateString('ar-EG', { weekday: 'long', numberingSystem: 'latn' });
      
      if (!stats.byDay[dayKey]) {
        stats.byDay[dayKey] = {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          leftEarly: 0,
          total: 0
        };
      }
      
      stats.byDay[dayKey].total++;
      if (record.status === 'present') stats.byDay[dayKey].present++;
      else if (record.status === 'absent') stats.byDay[dayKey].absent++;
      else if (record.status === 'late') stats.byDay[dayKey].late++;
      else if (record.status === 'excused') stats.byDay[dayKey].excused++;
      else if (record.status === 'left_early') stats.byDay[dayKey].leftEarly++;
    });

    // Statistics by Month
    allRecords.forEach(record => {
      const date = typeof record.date === 'string' ? new Date(record.date) : record.date;
      const monthKey = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', numberingSystem: 'latn' });
      
      if (!stats.byMonth[monthKey]) {
        stats.byMonth[monthKey] = {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          leftEarly: 0,
          total: 0
        };
      }
      
      stats.byMonth[monthKey].total++;
      if (record.status === 'present') stats.byMonth[monthKey].present++;
      else if (record.status === 'absent') stats.byMonth[monthKey].absent++;
      else if (record.status === 'late') stats.byMonth[monthKey].late++;
      else if (record.status === 'excused') stats.byMonth[monthKey].excused++;
      else if (record.status === 'left_early') stats.byMonth[monthKey].leftEarly++;
    });

    return stats;
  }

  getClassAttendanceReport(): AttendanceRecord[] {
    if (!this.selectedClass) return [];
    return this.attendanceRecords.filter(r => r.classId === this.selectedClass!.id);
  }

  getAttendanceForStudentAndDate(studentId: number, date: Date): AttendanceStatus {
    if (!this.selectedClass) return 'unrecorded';
    const dateStr = this.formatDateForAPI(date);
    const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'left_early', 'unrecorded'];
    
    // إعطاء أولوية للسجلات المحلية (id = 0 أو غير موجود)
    const localRecord = this.attendanceRecords.find(r => 
      r.studentId === studentId && 
      r.date === dateStr &&
      r.classId === this.selectedClass!.id &&
      (!r.id || r.id === 0)
    );
    
    if (localRecord && localRecord.status) {
      const status = localRecord.status as AttendanceStatus;
      return validStatuses.includes(status) ? status : 'unrecorded';
    }
    
    // إذا لم يكن هناك سجل محلي، البحث في السجلات المحفوظة
    const record = this.attendanceRecords.find(r => 
      r.studentId === studentId && 
      r.date === dateStr &&
      r.classId === this.selectedClass!.id
    );
    
    if (!record || !record.status) {
      return 'unrecorded';
    }
    
    const status = record.status as AttendanceStatus;
    // التأكد من أن القيمة المرجعة تطابق إحدى القيم في attendanceStatuses
    return validStatuses.includes(status) ? status : 'unrecorded';
  }

  /**
   * تحديث محلي فوري لسجل الحضور في العرض الأسبوعي
   * حتى ينعكس التغيير مباشرة في العداد بدون انتظار استجابة الـ API
   */
  private updateWeeklyAttendanceLocally(studentId: number, date: Date, status: AttendanceStatus): void {
    if (!this.selectedClass) {
      return;
    }

    const dateStr = this.formatDateForAPI(date);
    const existing = this.attendanceRecords.find(
      r => r.studentId === studentId && r.date === dateStr && r.classId === this.selectedClass!.id
    );

    if (existing) {
      existing.status = status;
    } else {
      this.attendanceRecords.push({
        id: 0, // سيتم استبداله بالقيمة الصحيحة عند إعادة التحميل من API
        studentId,
        classId: this.selectedClass.id,
        date: dateStr,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      } as AttendanceRecord);
    }
  }

  getClassStatisticsArray(): Array<{ className: string; present: number; absent: number; late: number; excused: number; leftEarly: number; total: number }> {
    const stats = this.getAttendanceStatistics();
    return Object.keys(stats.byClass).map(classId => ({
      className: stats.byClass[classId].className,
      present: stats.byClass[classId].present,
      absent: stats.byClass[classId].absent,
      late: stats.byClass[classId].late,
      excused: stats.byClass[classId].excused,
      leftEarly: stats.byClass[classId].leftEarly,
      total: stats.byClass[classId].total
    }));
  }

  getDayStatisticsArray(): Array<{ day: string; present: number; absent: number; late: number; excused: number; leftEarly: number; total: number }> {
    const stats = this.getAttendanceStatistics();
    const dayOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    return Object.keys(stats.byDay)
      .map(day => ({
        day,
        present: stats.byDay[day].present,
        absent: stats.byDay[day].absent,
        late: stats.byDay[day].late,
        excused: stats.byDay[day].excused,
        leftEarly: stats.byDay[day].leftEarly,
        total: stats.byDay[day].total
      }))
      .sort((a, b) => {
        const indexA = dayOrder.indexOf(a.day);
        const indexB = dayOrder.indexOf(b.day);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
  }

  getMonthStatisticsArray(): Array<{ month: string; present: number; absent: number; late: number; excused: number; leftEarly: number; total: number }> {
    const stats = this.getAttendanceStatistics();
    return Object.keys(stats.byMonth)
      .map(month => ({
        month,
        present: stats.byMonth[month].present,
        absent: stats.byMonth[month].absent,
        late: stats.byMonth[month].late,
        excused: stats.byMonth[month].excused,
        leftEarly: stats.byMonth[month].leftEarly,
        total: stats.byMonth[month].total
      }))
      .sort((a, b) => {
        // Sort by date (newest first)
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async exportReportToPDF(): Promise<void> {
    if (this.reportType !== 'absences') {
      alert(this.translate('attendance.exportOnlyAbsences'));
      return;
    }

    try {
      // Wait a bit for Angular to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Find the absences report table
      const reportTable = document.querySelector('#absences-report-table') as HTMLElement;
      
      if (!reportTable) {
        alert(this.translate('attendance.reportTableNotFound'));
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
      title.textContent = this.translate('attendance.absencesReport');
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
      
      const classLabel = this.translate('students.class');
      const dateLabel = this.translate('attendance.date');
      const classInfo = this.selectedClass ? `${classLabel} ${this.selectedClass.name}` : '';
      const dateInfo = `${dateLabel} ${new Date().toLocaleDateString(this.getLocale())}`;
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
      const fileName = `${this.translate('attendance.absencesReport').replace(/\s+/g, '_')}_${this.selectedClass?.name || 'class'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(this.translate('attendance.errorExportPdf'));
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
      const status = target.value as AttendanceStatus;
      // تحديث محلي فوري لسجلات الأسبوع ليتحدّث العداد مباشرة
      this.updateWeeklyAttendanceLocally(student.id, day, status);
      
      // حفظ التاريخ المحدد مؤقتاً
      const originalDate = new Date(this.selectedDate);
      this.selectedDate = day;
      
      // حفظ الحضور
      this.recordAttendance(student, status);
      
      // استعادة التاريخ الأصلي إذا كان العرض اليومي مفتوحاً
      if (!this.showWeeklyView) {
        this.selectedDate = originalDate;
      }
    }
  }

  formatDateFromString(dateString: string): string {
    const date = new Date(dateString);
    return this.formatDate(date);
  }

  trackByStudentId(index: number, student: Student): number {
    return student.id;
  }

  trackByDay = (index: number, day: Date): string => {
    return this.formatDateForAPI(day);
  }

  getAttendanceStatusForDisplay(studentId: number, date: Date): AttendanceStatus {
    const status = this.getAttendanceForStudentAndDate(studentId, date);
    // التأكد من أن القيمة المرجعة تطابق إحدى القيم في attendanceStatuses
    const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'left_early', 'unrecorded'];
    return validStatuses.includes(status) ? status : 'unrecorded';
  }

  isExempted(student: Student): boolean {
    if (!student.specialCases || student.specialCases.length === 0) return false;
    
    const now = new Date();
    return student.specialCases.some(sc => {
      if (sc.category !== 'exemption') return false;
      
      // Check if exemption is still active (if dates are provided)
      if (sc.endDate) {
        const endDate = new Date(sc.endDate);
        if (endDate < now) return false;
      }
      return true;
    });
  }

  getExemptionDetails(student: Student): string {
    if (!student.specialCases) return '';
    
    const exemptions = student.specialCases.filter(sc => sc.category === 'exemption');
    return exemptions.map(ex => 
      `• ${ex.details}\n  ${ex.requiredAction || ''}`
    ).join('\n');
  }

  getSpecialCaseIcon(student: Student): string | null {
    if (!student.specialCases || student.specialCases.length === 0) return null;
    
    // Check for exemption cases (priority for attendance)
    const exemptionCase = student.specialCases.find(sc => sc.category === 'exemption');
    if (exemptionCase) return '🏃‍♂️';
    
    const healthCase = student.specialCases.find(sc => sc.category === 'health');
    if (healthCase) return '🏥';
    
    const learningCase = student.specialCases.find(sc => sc.category === 'learning_difficulty');
    if (learningCase) return '⭐';
    
    return null;
  }

  getDepartmentAttendanceReport(): DepartmentAttendanceReport[] {
    if (!this.selectedClass) return [];
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Calculate start of week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return this.students.map(student => {
      const studentRecords = this.attendanceRecords.filter(r => 
        r.studentId === student.id && 
        r.classId === this.selectedClass!.id
      );
      
      // Daily statistics (today only)
      const todayStr = this.formatDateForAPI(today);
      const dailyRecords = studentRecords.filter(r => r.date === todayStr);
      const dailyPresent = dailyRecords.filter(r => r.status === 'present').length;
      const dailyAbsent = dailyRecords.filter(r => r.status === 'absent').length;
      
      // Weekly statistics (current week)
      const weeklyRecords = studentRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startOfWeek && recordDate <= today;
      });
      const weeklyPresent = weeklyRecords.filter(r => r.status === 'present').length;
      const weeklyAbsent = weeklyRecords.filter(r => r.status === 'absent').length;
      
      // Monthly statistics (current month)
      const monthlyRecords = studentRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startOfMonth && recordDate <= today;
      });
      const monthlyPresent = monthlyRecords.filter(r => r.status === 'present').length;
      const monthlyAbsent = monthlyRecords.filter(r => r.status === 'absent').length;
      
      // Calculate overall attendance rate
      const totalRecords = monthlyRecords.length || 1;
      const attendanceRate = (monthlyPresent / totalRecords) * 100;
      
      // Determine status
      let status: 'excellent' | 'good' | 'needs_attention' = 'good';
      if (attendanceRate >= 90) {
        status = 'excellent';
      } else if (attendanceRate < 70) {
        status = 'needs_attention';
      }
      
      return {
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        dailyPresent,
        dailyAbsent,
        weeklyPresent,
        weeklyAbsent,
        monthlyPresent,
        monthlyAbsent,
        attendanceRate,
        status
      };
    }).sort((a, b) => {
      // Sort by attendance rate (lowest first) to highlight students needing attention
      return a.attendanceRate - b.attendanceRate;
    });
  }

  getStatusLabelForReport(status: 'excellent' | 'good' | 'needs_attention'): string {
    switch (status) {
      case 'excellent':
        return this.translate('attendance.statusExcellent');
      case 'good':
        return this.translate('attendance.statusGood');
      case 'needs_attention':
        return this.translate('attendance.statusNeedsAttention');
      default:
        return '-';
    }
  }

  exportDepartmentReportToPDF(): void {
    if (!this.selectedClass) {
      alert(this.translate('attendance.selectClassFirst'));
      return;
    }

    const reportData = this.getDepartmentAttendanceReport();
    if (reportData.length === 0) {
      alert(this.translate('attendance.noDataToExport'));
      return;
    }

    // Find the department report table
    const reportTable = document.querySelector('#department-report-table') as HTMLElement;
    
    if (!reportTable) {
      alert(this.translate('attendance.reportTableNotFound'));
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
    title.textContent = this.translate('attendance.departmentReport');
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
    
    const classLabel = this.translate('students.class');
    const dateLabel = this.translate('attendance.date');
    const classInfo = this.selectedClass ? `${classLabel} ${this.selectedClass.name}` : '';
    const dateInfo = `${dateLabel} ${new Date().toLocaleDateString(this.getLocale())}`;
    info.innerHTML = `${classInfo}<br>${dateInfo}`;
    
    exportContainer.appendChild(title);
    exportContainer.appendChild(info);
    exportContainer.appendChild(clonedTable);
    
    document.body.appendChild(exportContainer);
    
    // Use html2canvas to capture the table
    html2canvas(exportContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: exportContainer.offsetWidth,
      height: exportContainer.offsetHeight
    }).then((canvas) => {
      // Clean up
      document.body.removeChild(exportContainer);
      
      // Calculate PDF dimensions (landscape A4)
      const imgWidth = 297; // A4 width in mm (landscape)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Calculate scale to fit on page(s)
      const pageHeight = 210; // A4 height in mm (landscape)
      const pageWidth = 297; // A4 width in mm (landscape)
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
      const baseName = this.translate('attendance.departmentReport').replace(/\s+/g, '_');
      const className = this.selectedClass?.name || 'class';
      const fileName = `${baseName}_${className}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    }).catch((error) => {
      console.error('Error generating PDF:', error);
      alert(this.translate('attendance.errorExportPdf'));
      document.body.removeChild(exportContainer);
    });
  }
}

