import { Component, ElementRef, ViewChild } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

@Component({
  selector: 'app-training-inspection',
  templateUrl: './training-inspection.component.html',
  styleUrls: ['./training-inspection.component.css']
})
export class TrainingInspectionComponent {
  @ViewChild('trainingPrint') trainingPrintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('inspectionPrint') inspectionPrintRef!: ElementRef<HTMLDivElement>;
  @ViewChild('dailyPrint') dailyPrintRef!: ElementRef<HTMLDivElement>;
  activeTab: 'training' | 'inspection' | 'daily' = 'training';

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

  constructor() {
    this.loadFromStorage();
  }

  setTab(tab: 'training' | 'inspection' | 'daily'): void {
    this.activeTab = tab;
  }

  onTrainingFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.newTraining.fileName = file.name;
    // يمكن لاحقاً رفع الملف إلى الـ backend، حالياً نكتفي بالاسم
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

  private loadFromStorage(): void {
    const stored = localStorage.getItem('trainingInspection');
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      this.trainingList = data.trainingList || [];
      this.inspectionList = data.inspectionList || [];
      this.dailyNotes = data.dailyNotes || [];
    } catch {
      // تجاهل الأخطاء
    }
  }

  private saveToStorage(): void {
    const payload = {
      trainingList: this.trainingList,
      inspectionList: this.inspectionList,
      dailyNotes: this.dailyNotes
    };
    localStorage.setItem('trainingInspection', JSON.stringify(payload));
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
}


