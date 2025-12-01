import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

interface TrainingRecord {
  date: string;
  topic: string;
  organizer: string;
  location: string;
  notes: string;
  fileName?: string;
}

interface InspectionVisit {
  date: string;
  type: string;
  notes: string;
  recommendations: string;
}

interface DailyNote {
  date: string;
  content: string;
}

interface SeminarRecord {
  startDate: string;
  endDate: string;
  title: string;
  organizer: string;
  duration: string;
  location: string;
  trainer: string;
  summary: string;
  attachmentName?: string;
}

interface PedagogicalVisitRecord {
  dateTime: string;
  type: string;
  visitorName: string;
  classLevel: string;
  notes: string;
  followUp: string;
}

@Component({
  selector: 'app-training-inspection',
  templateUrl: './training-inspection.component.html',
  styleUrls: ['./training-inspection.component.css']
})
export class TrainingInspectionComponent {
  @ViewChild('trainingPrint') trainingPrintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('inspectionPrint') inspectionPrintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('dailyPrint') dailyPrintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('seminarPrint') seminarPrintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('pedagogicalVisitPrint') pedagogicalVisitPrintRef!: ElementRef<HTMLDivElement>;

  activeTab: 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical' = 'training';

  newTraining: TrainingRecord = {
    date: '',
    topic: '',
    organizer: '',
    location: '',
    notes: '',
  };
  trainingList: TrainingRecord[] = [];

  newInspection: InspectionVisit = {
    date: '',
    type: '',
    notes: '',
    recommendations: ''
  };
  inspectionList: InspectionVisit[] = [];

  newDailyNote: DailyNote = {
    date: new Date().toISOString().substring(0, 10),
    content: ''
  };
  dailyNotes: DailyNote[] = [];

  newSeminar: SeminarRecord = {
    startDate: '',
    endDate: '',
    title: '',
    organizer: '',
    duration: '',
    location: '',
    trainer: '',
    summary: ''
  };
  seminarList: SeminarRecord[] = [];

  newPedagogicalVisit: PedagogicalVisitRecord = {
    dateTime: '',
    type: '',
    visitorName: '',
    classLevel: '',
    notes: '',
    followUp: ''
  };
  pedagogicalVisits: PedagogicalVisitRecord[] = [];

  constructor(
    private route: ActivatedRoute,
    public languageService: LanguageService,
    private authService: AuthService
  ) {
    this.loadFromStorage();
    this.route.queryParams.subscribe(params => {
      const report = params['report'] as 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical' | undefined;
      if (!report) return;

      // تحديد التبويب النشط حسب نوع التقرير
      this.activeTab =
        report === 'training' ? 'training' :
        report === 'inspection' ? 'inspection' :
        report === 'daily' ? 'daily' :
        report === 'seminars' ? 'seminars' :
        'pedagogical';

      // ننتظر دورة التغيير حتى يكون القالب محدثاً ثم نصدّر PDF إذا لزم
      setTimeout(() => {
        if (report === 'training') {
          this.exportTrainingPdf();
        } else if (report === 'inspection') {
          this.exportInspectionPdf();
        } else if (report === 'daily') {
          this.exportDailyNotesPdf();
        } else if (report === 'seminars') {
          this.exportSeminarsPdf();
        } else if (report === 'pedagogical') {
          this.exportPedagogicalVisitsPdf();
        }
      }, 0);
    });
  }

  setTab(tab: 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical'): void {
    this.activeTab = tab;
  }

  onTrainingFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.newTraining.fileName = file.name;
    // يمكن لاحقاً رفع الملف إلى الـ backend، حالياً نكتفي بالاسم
  }

  onSeminarAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) {
      this.newSeminar.attachmentName = undefined;
      return;
    }
    this.newSeminar.attachmentName = input.files[0].name;
  }

  addTraining(): void {
    // يكفي أن يكون هناك أي معلومات مدخلة (تاريخ أو موضوع أو ملاحظات أو ملف)
    if (
      !this.newTraining.date &&
      !this.newTraining.topic &&
      !this.newTraining.notes.trim() &&
      !this.newTraining.organizer &&
      !this.newTraining.location &&
      !this.newTraining.fileName
    ) {
      return;
    }
    this.trainingList.unshift({ ...this.newTraining });
    this.newTraining = {
      date: '',
      topic: '',
      organizer: '',
      location: '',
      notes: '',
    };
    this.saveToStorage();
  }

  addInspection(): void {
    if (!this.newInspection.date || !this.newInspection.type) return;
    this.inspectionList.unshift({ ...this.newInspection });
    this.newInspection = {
      date: '',
      type: '',
      notes: '',
      recommendations: ''
    };
    this.saveToStorage();
  }

  addDailyNote(): void {
    if (!this.newDailyNote.content.trim()) return;
    this.dailyNotes.unshift({ ...this.newDailyNote });
    this.newDailyNote = {
      date: new Date().toISOString().substring(0, 10),
      content: ''
    };
    this.saveToStorage();
  }

  addSeminar(): void {
    if (
      !this.newSeminar.startDate &&
      !this.newSeminar.endDate &&
      !this.newSeminar.title &&
      !this.newSeminar.organizer &&
      !this.newSeminar.duration &&
      !this.newSeminar.location &&
      !this.newSeminar.trainer &&
      !this.newSeminar.summary.trim() &&
      !this.newSeminar.attachmentName
    ) {
      return;
    }
    this.seminarList.unshift({ ...this.newSeminar });
    this.newSeminar = {
      startDate: '',
      endDate: '',
      title: '',
      organizer: '',
      duration: '',
      location: '',
      trainer: '',
      summary: ''
    };
    this.saveToStorage();
  }

  addPedagogicalVisit(): void {
    if (
      !this.newPedagogicalVisit.dateTime &&
      !this.newPedagogicalVisit.type &&
      !this.newPedagogicalVisit.visitorName &&
      !this.newPedagogicalVisit.classLevel &&
      !this.newPedagogicalVisit.notes.trim() &&
      !this.newPedagogicalVisit.followUp.trim()
    ) {
      return;
    }
    this.pedagogicalVisits.unshift({ ...this.newPedagogicalVisit });
    this.newPedagogicalVisit = {
      dateTime: '',
      type: '',
      visitorName: '',
      classLevel: '',
      notes: '',
      followUp: ''
    };
    this.saveToStorage();
  }

  deleteTraining(index: number): void {
    this.trainingList.splice(index, 1);
    this.saveToStorage();
  }

  deleteInspection(index: number): void {
    this.inspectionList.splice(index, 1);
    this.saveToStorage();
  }

  deleteDailyNote(index: number): void {
    this.dailyNotes.splice(index, 1);
    this.saveToStorage();
  }

  deleteSeminar(index: number): void {
    this.seminarList.splice(index, 1);
    this.saveToStorage();
  }

  deletePedagogicalVisit(index: number): void {
    this.pedagogicalVisits.splice(index, 1);
    this.saveToStorage();
  }

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();
    return user ? `trainingInspection_${user.id}` : 'trainingInspection';
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.getStorageKey());
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      this.trainingList = data.trainingList || [];
      this.inspectionList = data.inspectionList || [];
      this.dailyNotes = data.dailyNotes || [];
      this.seminarList = data.seminarList || [];
      this.pedagogicalVisits = data.pedagogicalVisits || [];
    } catch {
      // تجاهل الأخطاء
    }
  }

  private saveToStorage(): void {
    const payload = {
      trainingList: this.trainingList,
      inspectionList: this.inspectionList,
      dailyNotes: this.dailyNotes,
      seminarList: this.seminarList,
      pedagogicalVisits: this.pedagogicalVisits
    };
    localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
  }

  // -------- PDF EXPORTS --------

  async exportTrainingPdf(): Promise<void> {
    if (!this.trainingPrintRef) return;
    await this.exportSectionAsPdf(this.trainingPrintRef.nativeElement, 'training-records.pdf');
  }

  async exportInspectionPdf(): Promise<void> {
    if (!this.inspectionPrintRef) return;
    await this.exportSectionAsPdf(this.inspectionPrintRef.nativeElement, 'inspection-visits.pdf');
  }

  async exportDailyNotesPdf(): Promise<void> {
    if (!this.dailyPrintRef) return;
    await this.exportSectionAsPdf(this.dailyPrintRef.nativeElement, 'daily-notes.pdf');
  }

  async exportSeminarsPdf(): Promise<void> {
    if (!this.seminarPrintRef) return;
    await this.exportSectionAsPdf(this.seminarPrintRef.nativeElement, 'seminars.pdf');
  }

  async exportPedagogicalVisitsPdf(): Promise<void> {
    if (!this.pedagogicalVisitPrintRef) return;
    await this.exportSectionAsPdf(this.pedagogicalVisitPrintRef.nativeElement, 'pedagogical-visits.pdf');
  }

  private async exportSectionAsPdf(element: HTMLElement, fileName: string): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 10; // هامش بسيط
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', 5, Math.max(10, y), imgWidth, imgHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting section PDF', error);
    }
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}


