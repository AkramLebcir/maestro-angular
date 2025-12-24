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

interface CoordinationSession {
  date: string;
  attendees: string[];
  agenda: string[];
  decisions: string[];
  progressPercentage?: number;
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
  @ViewChild('coordinationSessionPrint') coordinationSessionPrintRef!: ElementRef<HTMLDivElement>;

  activeTab: 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical' | 'coordination' = 'training';

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

  newCoordinationSession: CoordinationSession = {
    date: new Date().toISOString().substring(0, 10),
    attendees: [],
    agenda: [],
    decisions: [],
    progressPercentage: undefined
  };
  coordinationSessions: CoordinationSession[] = [];
  newAttendeeName: string = '';
  newAgendaItem: string = '';
  newDecision: string = '';

  constructor(
    private route: ActivatedRoute,
    public languageService: LanguageService,
    private authService: AuthService
  ) {
    this.loadFromStorage();
    this.route.queryParams.subscribe(params => {
      const report = params['report'] as 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical' | 'coordination' | undefined;
      if (!report) return;

      // تحديد التبويب النشط حسب نوع التقرير
      this.activeTab =
        report === 'training' ? 'training' :
        report === 'inspection' ? 'inspection' :
        report === 'daily' ? 'daily' :
        report === 'seminars' ? 'seminars' :
        report === 'coordination' ? 'coordination' :
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
        } else if (report === 'coordination') {
          this.exportCoordinationSessionPdf(-1); // Export all
        }
      }, 0);
    });
  }

  setTab(tab: 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical' | 'coordination'): void {
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

  // Coordination Session methods
  addAttendee(): void {
    if (this.newAttendeeName.trim()) {
      this.newCoordinationSession.attendees.push(this.newAttendeeName.trim());
      this.newAttendeeName = '';
    }
  }

  removeAttendee(index: number): void {
    this.newCoordinationSession.attendees.splice(index, 1);
  }

  addAgendaItem(): void {
    if (this.newAgendaItem.trim()) {
      this.newCoordinationSession.agenda.push(this.newAgendaItem.trim());
      this.newAgendaItem = '';
    }
  }

  removeAgendaItem(index: number): void {
    this.newCoordinationSession.agenda.splice(index, 1);
  }

  addDecision(): void {
    if (this.newDecision.trim()) {
      this.newCoordinationSession.decisions.push(this.newDecision.trim());
      this.newDecision = '';
    }
  }

  removeDecision(index: number): void {
    this.newCoordinationSession.decisions.splice(index, 1);
  }

  addCoordinationSession(): void {
    if (!this.newCoordinationSession.date || 
        this.newCoordinationSession.attendees.length === 0 ||
        this.newCoordinationSession.agenda.length === 0) {
      return;
    }
    this.coordinationSessions.unshift({ ...this.newCoordinationSession });
    this.newCoordinationSession = {
      date: new Date().toISOString().substring(0, 10),
      attendees: [],
      agenda: [],
      decisions: [],
      progressPercentage: undefined
    };
    this.newAttendeeName = '';
    this.newAgendaItem = '';
    this.newDecision = '';
    this.saveToStorage();
  }

  deleteCoordinationSession(index: number): void {
    this.coordinationSessions.splice(index, 1);
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
      this.coordinationSessions = data.coordinationSessions || [];
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
      pedagogicalVisits: this.pedagogicalVisits,
      coordinationSessions: this.coordinationSessions
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

  async exportCoordinationSessionPdf(sessionIndex: number): Promise<void> {
    try {
      const sessionsToExport = sessionIndex >= 0 
        ? [this.coordinationSessions[sessionIndex]] 
        : this.coordinationSessions;

      if (sessionsToExport.length === 0) return;

      // Create export container
      const exportContainer = document.createElement('div');
      exportContainer.style.width = '210mm';
      exportContainer.style.minHeight = '297mm';
      exportContainer.style.padding = '20mm';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';

      sessionsToExport.forEach((session, idx) => {
        if (idx > 0) {
          const pageBreak = document.createElement('div');
          pageBreak.style.pageBreakBefore = 'always';
          pageBreak.style.marginTop = '20mm';
          exportContainer.appendChild(pageBreak);
        }

        const sessionDiv = document.createElement('div');
        sessionDiv.style.marginBottom = '20px';

        // Title
        const title = document.createElement('h1');
        title.textContent = this.translate('trainingInspection.minutesTitle');
        title.style.fontSize = '20px';
        title.style.fontWeight = 'bold';
        title.style.textAlign = 'center';
        title.style.marginBottom = '30px';
        title.style.color = '#1f2937';
        sessionDiv.appendChild(title);

        // Date section
        const dateSection = document.createElement('div');
        dateSection.style.marginBottom = '20px';
        const dateLabel = document.createElement('strong');
        dateLabel.textContent = this.translate('trainingInspection.sessionDate') + ' ';
        dateLabel.style.fontSize = '14px';
        const dateValue = document.createTextNode(session.date ? new Date(session.date).toLocaleDateString('ar-DZ') : '');
        dateSection.appendChild(dateLabel);
        dateSection.appendChild(dateValue);
        sessionDiv.appendChild(dateSection);

        // Attendees section
        const attendeesSection = document.createElement('div');
        attendeesSection.style.marginBottom = '20px';
        const attendeesLabel = document.createElement('strong');
        attendeesLabel.textContent = this.translate('trainingInspection.present') + ':';
        attendeesLabel.style.fontSize = '14px';
        attendeesLabel.style.display = 'block';
        attendeesLabel.style.marginBottom = '10px';
        attendeesSection.appendChild(attendeesLabel);
        
        if (session.attendees.length > 0) {
          const attendeesList = document.createElement('ul');
          attendeesList.style.listStyle = 'decimal';
          attendeesList.style.paddingRight = '20px';
          attendeesList.style.margin = '0';
          session.attendees.forEach((attendee) => {
            const li = document.createElement('li');
            li.textContent = attendee;
            li.style.marginBottom = '5px';
            li.style.fontSize = '12px';
            attendeesList.appendChild(li);
          });
          attendeesSection.appendChild(attendeesList);
        } else {
          const noAttendees = document.createElement('div');
          noAttendees.textContent = this.translate('trainingInspection.unspecified');
          noAttendees.style.fontSize = '12px';
          noAttendees.style.color = '#6b7280';
          attendeesSection.appendChild(noAttendees);
        }
        sessionDiv.appendChild(attendeesSection);

        // Agenda section
        const agendaSection = document.createElement('div');
        agendaSection.style.marginBottom = '20px';
        const agendaLabel = document.createElement('strong');
        agendaLabel.textContent = this.translate('trainingInspection.agendaItems') + ':';
        agendaLabel.style.fontSize = '14px';
        agendaLabel.style.display = 'block';
        agendaLabel.style.marginBottom = '10px';
        agendaSection.appendChild(agendaLabel);
        
        if (session.agenda.length > 0) {
          const agendaList = document.createElement('ul');
          agendaList.style.listStyle = 'decimal';
          agendaList.style.paddingRight = '20px';
          agendaList.style.margin = '0';
          session.agenda.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            li.style.marginBottom = '5px';
            li.style.fontSize = '12px';
            agendaList.appendChild(li);
          });
          agendaSection.appendChild(agendaList);
        } else {
          const noAgenda = document.createElement('div');
          noAgenda.textContent = this.translate('trainingInspection.unspecified');
          noAgenda.style.fontSize = '12px';
          noAgenda.style.color = '#6b7280';
          agendaSection.appendChild(noAgenda);
        }
        sessionDiv.appendChild(agendaSection);

        // Decisions section
        const decisionsSection = document.createElement('div');
        decisionsSection.style.marginBottom = '20px';
        const decisionsLabel = document.createElement('strong');
        decisionsLabel.textContent = this.translate('trainingInspection.decisionsMade') + ':';
        decisionsLabel.style.fontSize = '14px';
        decisionsLabel.style.display = 'block';
        decisionsLabel.style.marginBottom = '10px';
        decisionsSection.appendChild(decisionsLabel);
        
        if (session.decisions.length > 0) {
          const decisionsList = document.createElement('ul');
          decisionsList.style.listStyle = 'decimal';
          decisionsList.style.paddingRight = '20px';
          decisionsList.style.margin = '0';
          session.decisions.forEach((decision) => {
            const li = document.createElement('li');
            li.textContent = decision;
            li.style.marginBottom = '5px';
            li.style.fontSize = '12px';
            decisionsList.appendChild(li);
          });
          decisionsSection.appendChild(decisionsList);
        } else {
          const noDecisions = document.createElement('div');
          noDecisions.textContent = this.translate('trainingInspection.unspecified');
          noDecisions.style.fontSize = '12px';
          noDecisions.style.color = '#6b7280';
          decisionsSection.appendChild(noDecisions);
        }
        sessionDiv.appendChild(decisionsSection);

        // Progress Percentage
        if (session.progressPercentage !== undefined && session.progressPercentage !== null) {
          const progressSection = document.createElement('div');
          progressSection.style.marginBottom = '20px';
          const progressLabel = document.createElement('strong');
          progressLabel.textContent = this.translate('trainingInspection.collectiveProgress') + ': ';
          progressLabel.style.fontSize = '14px';
          const progressValue = document.createTextNode(`${session.progressPercentage}%`);
          progressSection.appendChild(progressLabel);
          progressSection.appendChild(progressValue);
          sessionDiv.appendChild(progressSection);
        }

        // Signature line
        const signatureSection = document.createElement('div');
        signatureSection.style.marginTop = '40px';
        signatureSection.style.borderTop = '1px solid #e5e7eb';
        signatureSection.style.paddingTop = '20px';
        const signatureLabel = document.createElement('div');
        signatureLabel.textContent = this.translate('trainingInspection.coordinator') + ':';
        signatureLabel.style.fontSize = '12px';
        signatureLabel.style.marginBottom = '30px';
        signatureSection.appendChild(signatureLabel);
        sessionDiv.appendChild(signatureSection);

        exportContainer.appendChild(sessionDiv);
      });

      document.body.appendChild(exportContainer);

      // Use html2canvas to capture the content
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.scrollHeight
      });

      // Clean up
      document.body.removeChild(exportContainer);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 2 * margin;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 2 * margin;
      }

      // Save PDF
      const fileName = sessionIndex >= 0
        ? `coordination-session-${sessionsToExport[0].date}.pdf`
        : `coordination-sessions-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting coordination session PDF', error);
    }
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


