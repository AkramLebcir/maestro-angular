import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { forkJoin } from 'rxjs';
import {
  CdkDragDrop,
  transferArrayItem,
  CdkDragEnd,
} from '@angular/cdk/drag-drop';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type BehaviorStatus = 'positive' | 'neutral' | 'negative';

interface ClassSummary {
  id: number;
  name: string;
  level: string;
  subject: string;
  labId?: number;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  photo?: string;
  group?: 1 | 2 | null;
  classId?: number;
}

interface StudentSeat {
  student: Student;
  attendanceStatus: AttendanceStatus;
  behaviorStatus: BehaviorStatus;
  behaviorNotes?: string | null;
  assignmentId?: number;
}

interface SeatAssignmentResponse {
  id: number;
  workstationId: number;
  studentId: number;
  seatIndex: number;
  attendanceStatus: AttendanceStatus;
  behaviorStatus: BehaviorStatus;
  behaviorNotes?: string;
  student: Student;
}

interface WorkstationResponse {
  id: number;
  label: string;
  capacity: number;
  x: number;
  y: number;
  zone: string;
  assignments: SeatAssignmentResponse[];
}

interface WorkstationSlot {
  dropListId: string;
  workstationId: number;
  label: string;
  capacity: number;
  x: number;
  y: number;
  zone: string;
  occupants: StudentSeat[];
}

interface SeatingStats {
  totalWorkstations: number;
  totalSeats: number;
  assignedSeats: number;
  averageAttendance: number;
  averageGrade: number | null;
  positiveBehaviorRate: number;
  studentCount: number;
}

interface LayoutResponse {
  classId: number;
  group: number | null;
  workstations: WorkstationResponse[];
  stats: SeatingStats;
}

interface PrintableLayoutResponse {
  generatedAt: string;
  scope: string;
  classes: {
    class: ClassSummary & { labName?: string };
    groups: {
      group: number;
      classId: number;
      workstations: WorkstationResponse[];
      stats: SeatingStats;
    }[];
  }[];
}

interface WorkstationPrintEntry {
  className: string;
  subject?: string;
  group: number;
  students: {
    name: string;
    attendance: string;
    behavior: string;
  }[];
}

interface WorkstationPrintPage {
  label: string;
  capacity: number;
  entries: WorkstationPrintEntry[];
}

@Component({
  selector: 'app-seating-chart',
  templateUrl: './seating-chart.component.html',
  styleUrls: ['./seating-chart.component.css'],
})
export class SeatingChartComponent implements OnInit {
  @ViewChild('stageRef') stageRef?: ElementRef<HTMLDivElement>;
  @ViewChild('printArea') printArea?: ElementRef<HTMLDivElement>;

  classes: ClassSummary[] = [];
  selectedClassId: number | null = null;
  selectedGroup: 1 | 2 = 1;

  stats: SeatingStats | null = null;
  workstations: WorkstationResponse[] = [];
  workstationSlots: WorkstationSlot[] = [];
  studentPool: StudentSeat[] = [];
  allClassStudents: Student[] = [];
  connectedLists: string[] = ['pool'];
  private slotLookup = new Map<string, WorkstationSlot>();
  selectedStationsForPrint = new Set<number>();
  activeSeat: { seat: StudentSeat; slotLabel: string } | null = null;
  printData: PrintableLayoutResponse | null = null;
  printMode: 'default' | 'workstation' = 'default';
  workstationPages: WorkstationPrintPage[] = [];

  isReorganizing = false;
  editingStations = false;
  loading = false;
  saving = false;
  layoutSaving = false;
  layoutDirty = false;
  printLoading = false;
  searchTerm = '';
  errorMessage = '';

  // Classroom Layout Settings
  showRoomSetup = false;
  roomRows: 3 | 4 = 3;
  tableType: 'single' | 'double' = 'single';
  creatingLayout = false;
  classroomLayout: any = null;
  layoutMode: 'workstations' | 'classroom' = 'workstations'; // وضع التخطيط: حواسيب أو قاعة

  get attendanceOptions() {
    return [
      { value: 'present', label: this.translate('seatingChart.present') },
      { value: 'absent', label: this.translate('seatingChart.absent') },
      { value: 'late', label: this.translate('seatingChart.late') },
      { value: 'excused', label: this.translate('seatingChart.excused') },
    ];
  }

  get behaviorOptions() {
    return [
      { value: 'positive', label: this.translate('seatingChart.positive') },
      { value: 'neutral', label: this.translate('seatingChart.neutral') },
      { value: 'negative', label: this.translate('seatingChart.negative') },
    ];
  }

  constructor(
    private apiService: ApiService,
    private languageService: LanguageService
  ) {}

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  ngOnInit(): void {
    this.loadClasses();
  }

  get currentClass(): ClassSummary | null {
    if (!this.selectedClassId) {
      return null;
    }
    return this.classes.find((cls) => cls.id === this.selectedClassId) || null;
  }

  loadClasses(): void {
    this.apiService.get<ClassSummary[]>('/classes').subscribe({
      next: (classes) => {
        this.classes = classes;
        if (classes.length > 0) {
          this.selectedClassId = classes[0].id;
          this.loadStudentsAndLayout();
        }
      },
      error: () => {
        this.errorMessage = this.translate('seatingChart.failedToLoadClasses');
      },
    });
  }

  loadStudentsAndLayout(): void {
    if (!this.selectedClassId) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    if (this.layoutMode === 'classroom') {
      // تحميل تخطيط القاعة الدراسية
      this.apiService
        .get<any>(`/classroom-layout/class/${this.selectedClassId}`)
        .subscribe({
          next: (classroomLayout) => {
            if (classroomLayout) {
              this.classroomLayout = classroomLayout;
              this.loadStudentsForClassroom();
            } else {
              // لا يوجد تخطيط قاعة - عرض رسالة مع زر لإنشاء تخطيط
              this.errorMessage = '';
              this.loading = false;
              // تحميل التلاميذ فقط لعرضهم
              this.loadStudentsForClassroom();
            }
          },
          error: (error) => {
            // في حالة 404 أو عدم وجود تخطيط، لا نعرض خطأ
            if (error.status === 404) {
              this.errorMessage = '';
              this.loading = false;
              this.loadStudentsForClassroom();
            } else {
              this.errorMessage = this.translate('seatingChart.failedToLoadRoomLayout');
              this.loading = false;
            }
          },
        });
    } else {
      // تحميل تخطيط الحواسيب (المخبر)
      this.loadWorkstationLayout();
    }
  }

  loadWorkstationLayout(): void {
    forkJoin({
      students: this.apiService.get<Student[]>(
        `/students?classId=${this.selectedClassId}`,
      ),
      layout: this.apiService.get<LayoutResponse>(
        `/workstations/layout?classId=${this.selectedClassId}&group=${this.selectedGroup}`,
      ),
    }).subscribe({
      next: ({ students, layout }) => {
        this.allClassStudents = students;
        this.workstations = layout.workstations;
        this.stats = layout.stats;
        this.buildSeatGrid();
        this.selectedStationsForPrint.clear();
        this.layoutDirty = false;
        this.loading = false;
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Error loading seating layout:', error);
        let errorMsg = this.translate('seatingChart.failedToLoadLayout');
        
        if (error.status === 0 || error.status === 504) {
          errorMsg = this.translate('seatingChart.cannotConnectServer');
        } else if (error.status === 401) {
          errorMsg = this.translate('seatingChart.unauthorized');
        } else if (error.status === 403) {
          errorMsg = this.translate('seatingChart.noPermission');
        } else if (error.status === 404) {
          errorMsg = this.translate('seatingChart.layoutNotFound');
        } else if (error.status === 500) {
          errorMsg = this.translate('seatingChart.serverError');
        } else if (error.error?.message) {
          errorMsg = `${this.translate('seatingChart.error')}: ${error.error.message}`;
        } else if (error.message) {
          errorMsg = `${this.translate('seatingChart.error')}: ${error.message}`;
        }
        
        this.errorMessage = errorMsg;
        this.loading = false;
        this.workstations = [];
        this.workstationSlots = [];
        this.studentPool = [];
        this.stats = null;
      },
    });
  }

  loadStudentsForClassroom(): void {
    this.apiService
      .get<Student[]>(`/students?classId=${this.selectedClassId}`)
      .subscribe({
        next: (students) => {
          this.allClassStudents = students;
          if (this.classroomLayout) {
            this.buildClassroomSeatGrid();
          } else {
            // لا يوجد تخطيط - إعداد القوائم الفارغة
            this.workstationSlots = [];
            this.studentPool = students.map((student) => this.createSeatFromStudent(student));
            this.connectedLists = ['pool'];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading students:', error);
          this.errorMessage = this.translate('seatingChart.failedToLoadStudents');
          this.loading = false;
        },
      });
  }

  buildClassroomSeatGrid(): void {
    if (!this.classroomLayout) {
      return;
    }

    // مخطط الجلوس يعرض جميع التلاميذ في القسم (ليس حسب الفوج)
    const relevantStudents = this.allClassStudents;

    this.slotLookup.clear();
    this.workstationSlots = this.classroomLayout.desks.map((desk: any) => {
      const occupants: StudentSeat[] = (desk.assignments || []).map(
        (assignment: any) => ({
          student: assignment.student,
          attendanceStatus: 'present',
          behaviorStatus: 'neutral',
          behaviorNotes: '',
          assignmentId: assignment.id,
          seatPosition: assignment.seatPosition,
        }),
      );

      const slot: WorkstationSlot = {
        dropListId: `desk-${desk.id}`,
        workstationId: desk.id,
        label: desk.label,
        capacity: desk.capacity,
        x: desk.x,
        y: desk.y,
        zone: '',
        occupants,
      };

      this.slotLookup.set(slot.dropListId, slot);
      return slot;
    });

    const assignedIds = new Set(
      this.workstationSlots
        .flatMap((slot) => slot.occupants)
        .map((seat) => seat.student.id),
    );

    this.studentPool = relevantStudents
      .filter((student) => !assignedIds.has(student.id))
      .map((student) => this.createSeatFromStudent(student));

    this.connectedLists = [
      'pool',
      ...this.workstationSlots.map((slot) => slot.dropListId),
    ];
  }

  buildSeatGrid(): void {
    const relevantStudents = this.allClassStudents.filter(
      (student) =>
        student.group === this.selectedGroup || student.group === null || student.group === undefined,
    );

    this.slotLookup.clear();
    this.workstationSlots = this.workstations.map((workstation) => {
      const occupants: StudentSeat[] = (workstation.assignments ?? [])
        .sort((a, b) => a.seatIndex - b.seatIndex)
        .map((assignment) => ({
          student: assignment.student,
          attendanceStatus: assignment.attendanceStatus,
          behaviorStatus: assignment.behaviorStatus,
          behaviorNotes: assignment.behaviorNotes ?? '',
          assignmentId: assignment.id,
          expanded: false,
        }));

      const slot: WorkstationSlot = {
        dropListId: `ws-${workstation.id}`,
        workstationId: workstation.id,
        label: workstation.label,
        capacity: workstation.capacity,
        x: workstation.x,
        y: workstation.y,
        zone: workstation.zone,
        occupants,
      };

      this.slotLookup.set(slot.dropListId, slot);
      return slot;
    });

    const assignedIds = new Set(
      this.workstationSlots
        .flatMap((slot) => slot.occupants)
        .map((seat) => seat.student.id),
    );

    this.studentPool = relevantStudents
      .filter((student) => !assignedIds.has(student.id))
      .map((student) => this.createSeatFromStudent(student));

    this.connectedLists = [
      'pool',
      ...this.workstationSlots.map((slot) => slot.dropListId),
    ];

  }

  createSeatFromStudent(student: Student): StudentSeat {
    return {
      student,
      attendanceStatus: 'present',
      behaviorStatus: 'neutral',
      behaviorNotes: '',
    };
  }

  getSeatPlaceholders(slot: WorkstationSlot): number[] {
    const remaining = Math.max(0, slot.capacity - slot.occupants.length);
    return Array.from({ length: remaining }).map((_, index) => index);
  }

  toggleGroup(group: 1 | 2): void {
    if (this.selectedGroup === group) {
      return;
    }
    this.selectedGroup = group;
    // تحديث الفوج فقط لمخطط الحواسيب (المخبر)
    if (this.layoutMode === 'workstations') {
      this.loadStudentsAndLayout();
    }
  }

  toggleLayoutMode(mode: 'workstations' | 'classroom'): void {
    if (this.layoutMode === mode) {
      return;
    }
    this.layoutMode = mode;
    this.classroomLayout = null;
    this.loadStudentsAndLayout();
  }

  changeClass(classId: number | string): void {
    const numericId = Number(classId);
    if (Number.isNaN(numericId) || this.selectedClassId === numericId) {
      return;
    }
    this.selectedClassId = numericId;
    this.loadStudentsAndLayout();
  }

  toggleReorganize(): void {
    if (this.editingStations) {
      const itemName = this.layoutMode === 'workstations' 
        ? this.translate('seatingChart.computers') 
        : this.translate('seatingChart.desks');
      alert(`${this.translate('seatingChart.stopMovingFirst')} ${itemName} ${this.translate('seatingChart.first')}.`);
      return;
    }
    this.isReorganizing = !this.isReorganizing;
  }

  toggleStationEditing(): void {
    if (this.isReorganizing && !this.editingStations) {
      alert(this.translate('seatingChart.stopOrganizingFirst'));
      return;
    }
    this.editingStations = !this.editingStations;
  }

  drop(event: CdkDragDrop<StudentSeat[]>): void {
    if (!this.isReorganizing) {
      return;
    }

    const targetSlot =
      event.container.id !== 'pool'
        ? this.slotLookup.get(event.container.id)
        : null;

    if (
      targetSlot &&
      targetSlot.occupants.length >= targetSlot.capacity &&
      event.previousContainer !== event.container
    ) {
      const capacityText = targetSlot.capacity === 1 
        ? this.translate('seatingChart.oneStudent') 
        : `${targetSlot.capacity} ${this.translate('seatingChart.students')}`;
      alert(`${this.translate('seatingChart.deskFull')} (${capacityText} ${this.translate('seatingChart.maximum')}).`);
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    if (targetSlot && targetSlot.occupants.length > targetSlot.capacity) {
      const extras = targetSlot.occupants.splice(targetSlot.capacity);
      this.studentPool.push(...extras);
    }

    // تحديث layoutDirty عند التغيير
    if (targetSlot && event.previousContainer !== event.container) {
      this.layoutDirty = true;
    }
  }

  clearSeat(slot: WorkstationSlot, index: number): void {
    const [studentSeat] = slot.occupants.splice(index, 1);
    if (studentSeat) {
      this.studentPool.push(studentSeat);
    }
  }

  openSeatPopup(slot: WorkstationSlot, index: number): void {
    const seat = slot.occupants[index];
    if (seat) {
      this.activeSeat = {
        seat,
        slotLabel: slot.label,
      };
    }
  }

  closeSeatPopup(): void {
    this.activeSeat = null;
  }

  matchesSearch(studentSeat: StudentSeat): boolean {
    if (!this.searchTerm.trim()) {
      return true;
    }
    const query = this.searchTerm.trim().toLowerCase();
    const fullName = `${studentSeat.student.firstName} ${studentSeat.student.lastName}`.toLowerCase();
    return fullName.includes(query);
  }

  onWorkstationDragEnd(event: CdkDragEnd, slot: WorkstationSlot): void {
    if (!this.editingStations || !this.stageRef) {
      return;
    }
    const stageRect = this.stageRef.nativeElement.getBoundingClientRect();
    const cardRect = event.source.element.nativeElement.getBoundingClientRect();
    const centerX = cardRect.left - stageRect.left + cardRect.width / 2;
    const centerY = cardRect.top - stageRect.top + cardRect.height / 2;

    const xPercent = (centerX / stageRect.width) * 100;
    const yPercent = (centerY / stageRect.height) * 100;

    slot.x = Math.min(92, Math.max(8, Number(xPercent.toFixed(2))));
    slot.y = Math.min(92, Math.max(8, Number(yPercent.toFixed(2))));
    this.layoutDirty = true;
  }

  saveLayoutPositions(): void {
    if (!this.selectedClassId || !this.layoutDirty) {
      return;
    }
    this.layoutSaving = true;
    const payload = {
      classId: this.selectedClassId,
      positions: this.workstationSlots.map((slot, index) => ({
        workstationId: slot.workstationId,
        x: slot.x,
        y: slot.y,
        positionIndex: index + 1,
        zone: slot.zone,
      })),
    };

    this.apiService.patch<LayoutResponse>('/workstations/positions', payload).subscribe({
      next: (layout) => {
        this.workstations = layout.workstations;
        this.stats = layout.stats;
        this.buildSeatGrid();
        this.layoutDirty = false;
        this.layoutSaving = false;
        this.editingStations = false;
        alert(this.translate('seatingChart.computerPositionsSaved'));
      },
      error: (error) => {
        console.error('Error saving workstation positions:', error);
        alert(this.translate('seatingChart.failedToSaveComputerPositions'));
        this.layoutSaving = false;
      },
    });
  }

  saveAssignments(): void {
    if (!this.selectedClassId) {
      return;
    }
    this.saving = true;

    const assignments = this.workstationSlots.flatMap((slot) =>
      slot.occupants.map((seat, seatIndex) => ({
        workstationId: slot.workstationId,
        seatIndex,
        studentId: seat.student.id,
        attendanceStatus: seat.attendanceStatus,
        behaviorStatus: seat.behaviorStatus,
        behaviorNotes: seat.behaviorNotes,
      })),
    );

    this.apiService
      .put<LayoutResponse>('/workstations/assignments', {
        classId: this.selectedClassId,
        group: this.selectedGroup,
        assignments,
      })
      .subscribe({
        next: (layout) => {
          this.workstations = layout.workstations;
          this.stats = layout.stats;
          this.buildSeatGrid();
          this.saving = false;
          alert(this.translate('seatingChart.layoutSavedSuccessfully'));
        },
        error: (error) => {
          console.error('Error saving seating chart:', error);
          alert(this.translate('seatingChart.failedToSaveLayout'));
          this.saving = false;
        },
      });
  }

  print(scope: 'group' | 'class' | 'all'): void {
    if (!this.selectedClassId && scope !== 'all') {
      return;
    }
    this.printLoading = true;
    const payload: any = {};

    if (scope === 'group') {
      payload.classId = this.selectedClassId;
      payload.group = this.selectedGroup;
    } else if (scope === 'class') {
      payload.classId = this.selectedClassId;
      payload.includeBothGroups = true;
    } else {
      payload.includeAllClasses = true;
    }

    if (scope !== 'all' && this.selectedStationsForPrint.size > 0) {
      payload.workstationIds = Array.from(this.selectedStationsForPrint);
    }

    this.printMode = 'default';
    this.workstationPages = [];
    this.apiService
      .post<PrintableLayoutResponse>('/workstations/print', payload)
      .subscribe({
        next: (response) => {
          this.printData = response;
          this.triggerPdfRender(this.buildPrintFilename(scope));
        },
        error: (error) => {
          console.error('Error generating print payload:', error);
          alert(this.translate('seatingChart.failedToPreparePrint'));
          this.printLoading = false;
        },
      });
  }

  printSelectedWorkstationsAllClasses(): void {
    if (this.selectedStationsForPrint.size === 0) {
      alert(this.translate('seatingChart.selectAtLeastOneComputer'));
      return;
    }
    const targetLabels = this.getSelectedWorkstationLabels();
    if (!targetLabels.length) {
      alert(this.translate('seatingChart.failedToDetermineComputerNames'));
      return;
    }
    this.printLoading = true;
    const payload = {
      includeAllClasses: true,
      workstationLabels: targetLabels,
    };
    this.printMode = 'workstation';
    this.apiService
      .post<PrintableLayoutResponse>('/workstations/print', payload)
      .subscribe({
        next: (response) => {
          const pages = this.buildWorkstationPages(response);
          if (!pages.length) {
            alert(this.translate('seatingChart.noDataToPrint'));
            this.printLoading = false;
            this.printMode = 'default';
            return;
          }
          this.printData = response;
          this.workstationPages = pages;
          this.triggerPdfRender(
            `workstations-${targetLabels.join('-')}-${new Date()
              .toISOString()
              .split('T')[0]}.pdf`,
          );
        },
        error: (error) => {
          console.error('Error generating workstation print payload:', error);
          alert(this.translate('seatingChart.failedToPrepareComputerPrint'));
          this.printLoading = false;
        },
      });
  }

  getAttendanceLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      'present': 'seatingChart.present',
      'absent': 'seatingChart.absent',
      'late': 'seatingChart.late',
      'excused': 'seatingChart.excused',
    };
    return keyMap[status] ? this.translate(keyMap[status]) : '-';
  }

  getBehaviorLabel(status: string): string {
    const keyMap: { [key: string]: string } = {
      'positive': 'seatingChart.positive',
      'neutral': 'seatingChart.neutral',
      'negative': 'seatingChart.negative',
    };
    return keyMap[status] ? this.translate(keyMap[status]) : '-';
  }

  getStudentInitials(student: Student): string {
    const first = student.firstName?.charAt(0) || '';
    const last = student.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  }

  get hasAssignments(): boolean {
    return this.workstationSlots.some((slot) => slot.occupants.length > 0);
  }

  toggleStationSelection(id: number, checked: boolean): void {
    if (checked) {
      this.selectedStationsForPrint.add(id);
    } else {
      this.selectedStationsForPrint.delete(id);
    }
    this.selectedStationsForPrint = new Set(this.selectedStationsForPrint);
  }

  selectAllStations(): void {
    if (this.selectedStationsForPrint.size === this.workstationSlots.length) {
      this.selectedStationsForPrint.clear();
    } else {
      this.workstationSlots.forEach((slot) =>
        this.selectedStationsForPrint.add(slot.workstationId),
      );
    }
    this.selectedStationsForPrint = new Set(this.selectedStationsForPrint);
  }

  private triggerPdfRender(filename: string): void {
    setTimeout(() => {
      this.exportPrintAreaToPdf(filename);
    }, 120);
  }

  private buildPrintFilename(scope: 'group' | 'class' | 'all'): string {
    const dateStamp = new Date().toISOString().split('T')[0];
    if (scope === 'all') {
      return `seating-chart-all-${dateStamp}.pdf`;
    }
    if (scope === 'class') {
      return `seating-chart-class-${this.selectedClassId ?? 'all'}-${dateStamp}.pdf`;
    }
    return `seating-chart-group-${this.selectedGroup}-${dateStamp}.pdf`;
  }

  private async exportPrintAreaToPdf(filename: string): Promise<void> {
    if (!this.printArea) {
      this.printLoading = false;
      return;
    }
    const pages = Array.from(
      this.printArea.nativeElement.querySelectorAll('.print-page'),
    ) as HTMLElement[];
    if (!pages.length) {
      this.printLoading = false;
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const ratio = Math.min(
          pageWidth / canvas.width,
          pageHeight / canvas.height,
        );
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        if (i > 0) {
          doc.addPage();
        }
        doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      }

      doc.save(filename);
    } catch (error) {
      console.error('Error rendering PDF', error);
      alert(this.translate('seatingChart.failedToGeneratePDF'));
    } finally {
      this.printData = null;
      this.printMode = 'default';
      this.workstationPages = [];
      this.printLoading = false;
    }
  }

  private getSelectedWorkstationLabels(): string[] {
    const labels: string[] = [];
    this.workstationSlots.forEach((slot) => {
      if (this.selectedStationsForPrint.has(slot.workstationId)) {
        labels.push(slot.label);
      }
    });
    return Array.from(new Set(labels));
  }

  private buildWorkstationPages(
    data: PrintableLayoutResponse,
  ): WorkstationPrintPage[] {
    const pagesMap = new Map<string, WorkstationPrintPage>();

    data.classes.forEach((classBlock) => {
      classBlock.groups.forEach((groupBlock) => {
        groupBlock.workstations.forEach((workstation) => {
          const key = workstation.label;
          if (!pagesMap.has(key)) {
            pagesMap.set(key, {
              label: workstation.label,
              capacity: workstation.capacity,
              entries: [],
            });
          }
          const page = pagesMap.get(key)!;
          page.entries.push({
            className: classBlock.class.name,
            subject: classBlock.class.subject,
            group: groupBlock.group,
            students: (workstation.assignments ?? []).map((assignment) => ({
              name: `${assignment.student.firstName} ${assignment.student.lastName}`,
              attendance: this.getAttendanceLabel(assignment.attendanceStatus),
              behavior: this.getBehaviorLabel(assignment.behaviorStatus),
            })),
          });
        });
      });
    });

    return Array.from(pagesMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'ar'),
    );
  }

  // Classroom Layout Functions
  openRoomSetup(): void {
    this.showRoomSetup = true;
  }

  closeRoomSetup(): void {
    this.showRoomSetup = false;
  }

  createClassroomLayout(): void {
    if (!this.selectedClassId) {
      alert(this.translate('seatingChart.selectClassFirst'));
      return;
    }

    this.creatingLayout = true;
    const payload = {
      classId: this.selectedClassId,
      rows: this.roomRows,
      tableType: this.tableType,
    };

    this.apiService.post<any>('/classroom-layout', payload).subscribe({
      next: (layout) => {
        this.classroomLayout = layout;
        this.loadStudentsForClassroom();
        this.showRoomSetup = false;
        this.creatingLayout = false;
        alert(this.translate('seatingChart.roomLayoutCreatedSuccessfully'));
      },
      error: (error) => {
        console.error('Error creating classroom layout:', error);
        alert(this.translate('seatingChart.failedToCreateRoomLayout'));
        this.creatingLayout = false;
      },
    });
  }

  saveClassroomAssignments(): void {
    if (!this.selectedClassId || !this.classroomLayout) {
      return;
    }

    this.saving = true;
    const assignments = this.workstationSlots.flatMap((slot) =>
      slot.occupants.map((seat, index) => ({
        deskId: slot.workstationId,
        studentId: seat.student.id,
        seatPosition:
          slot.capacity === 2
            ? index === 0
              ? 'left'
              : 'right'
            : 'center',
      })),
    );

    this.apiService
      .post<any>('/classroom-layout/assignments', {
        classId: this.selectedClassId,
        assignments,
      })
      .subscribe({
        next: (layout) => {
          this.classroomLayout = layout;
          this.buildClassroomSeatGrid();
          this.saving = false;
          alert(this.translate('seatingChart.layoutSavedSuccessfully'));
        },
        error: (error) => {
          console.error('Error saving classroom assignments:', error);
          alert(this.translate('seatingChart.failedToSaveLayout'));
          this.saving = false;
        },
      });
  }

  saveClassroomDeskPositions(): void {
    if (!this.selectedClassId || !this.classroomLayout || !this.layoutDirty) {
      return;
    }

    this.layoutSaving = true;
    const positions = this.workstationSlots.map((slot) => ({
      deskId: slot.workstationId,
      x: slot.x,
      y: slot.y,
    }));

    this.apiService
      .patch<any>('/classroom-layout/positions', {
        classId: this.selectedClassId,
        positions,
      })
      .subscribe({
        next: (layout) => {
          this.classroomLayout = layout;
          this.buildClassroomSeatGrid();
          this.layoutDirty = false;
          this.layoutSaving = false;
          this.editingStations = false;
          alert(this.translate('seatingChart.deskPositionsSaved'));
        },
        error: (error) => {
          console.error('Error saving desk positions:', error);
          alert(this.translate('seatingChart.failedToSaveDeskPositions'));
          this.layoutSaving = false;
        },
      });
  }

  exportClassroomLayoutToPdf(): void {
    if (!this.classroomLayout || !this.stageRef) {
      return;
    }

    this.printLoading = true;
    setTimeout(() => {
      html2canvas(this.stageRef!.nativeElement, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const ratio = Math.min(
          pageWidth / canvas.width,
          pageHeight / canvas.height,
        );
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        const filename = `مخطط-المقاعد-${this.currentClass?.name || 'قاعة'}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        this.printLoading = false;
      });
    }, 500);
  }
}


