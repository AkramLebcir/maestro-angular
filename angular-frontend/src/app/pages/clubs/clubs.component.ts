import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface Club {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  members?: ClubMember[];
  events?: ClubEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubMember {
  id: number;
  clubId: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubEvent {
  id: number;
  name: string;
  date: Date | string;
  organizer?: string;
  participationType?: 'presentation' | 'competition' | 'workshop';
  results?: string;
  photos?: string[];
  videos?: string[];
  report?: string;
  clubId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  classId?: number;
}

@Component({
  selector: 'app-clubs',
  templateUrl: './clubs.component.html',
  styleUrls: ['./clubs.component.css']
})
export class ClubsComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;
  @ViewChild('clubReportContent') clubReportContent!: ElementRef;

  clubs: Club[] = [];
  selectedClub: Club | null = null;
  students: Student[] = [];
  filteredStudents: Student[] = [];
  
  // Modals
  showClubModal = false;
  showMemberModal = false;
  showEventModal = false;
  showAnnouncementModal = false;
  showEventReportModal = false;
  
  // Forms
  clubForm: { name: string; description: string } = { name: '', description: '' };
  eventForm: {
    name: string;
    date: string;
    organizer: string;
    participationType: 'presentation' | 'competition' | 'workshop' | '';
    results: string;
    report: string;
    photos: File[];
    videos: File[];
  } = {
    name: '',
    date: '',
    organizer: '',
    participationType: '',
    results: '',
    report: '',
    photos: [],
    videos: []
  };
  announcementForm: { subject: string; message: string; sendEmail: boolean } = {
    subject: '',
    message: '',
    sendEmail: false
  };
  
  // Editing
  editingClub: Club | null = null;
  editingEvent: ClubEvent | null = null;
  
  // Search and filters
  searchTerm: string = '';
  selectedEventType: 'presentation' | 'competition' | 'workshop' | '' = '';
  
  // File uploads
  photoPreviews: string[] = [];
  videoPreviews: string[] = [];
  
  // Loading states
  isLoading = false;
  isSaving = false;
  isExportingPDF = false;
  
  // Selected event for report
  selectedEventForReport: ClubEvent | null = null;
  
  // Current date for templates
  currentDate = new Date();

  constructor(
    private apiService: ApiService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadClubs();
    this.loadStudents();
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  loadClubs(): void {
    this.isLoading = true;
    this.apiService.get<Club[]>('/clubs').subscribe({
      next: (clubs) => {
        this.clubs = clubs;
        if (clubs.length > 0 && !this.selectedClub) {
          this.selectClub(clubs[0]);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
        this.isLoading = false;
      }
    });
  }

  loadStudents(): void {
    this.apiService.get<Student[]>('/students').subscribe({
      next: (students) => {
        this.students = students;
        this.filteredStudents = students;
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  selectClub(club: Club): void {
    this.selectedClub = club;
    this.loadClubDetails(club.id);
  }

  loadClubDetails(clubId: number): void {
    this.apiService.get<Club>(`/clubs/${clubId}`).subscribe({
      next: (club) => {
        this.selectedClub = club;
      },
      error: (error) => {
        console.error('Error loading club details:', error);
      }
    });
  }

  openAddClubModal(): void {
    this.editingClub = null;
    this.clubForm = { name: '', description: '' };
    this.showClubModal = true;
  }

  openEditClubModal(club: Club): void {
    this.editingClub = club;
    this.clubForm = {
      name: club.name,
      description: club.description || ''
    };
    this.showClubModal = true;
  }

  saveClub(): void {
    if (!this.clubForm.name.trim()) {
      alert(this.translate('clubs.nameRequired'));
      return;
    }

    this.isSaving = true;
    const payload = {
      name: this.clubForm.name.trim(),
      description: this.clubForm.description.trim() || undefined
    };

    const request = this.editingClub
      ? this.apiService.patch<Club>(`/clubs/${this.editingClub.id}`, payload)
      : this.apiService.post<Club>('/clubs', payload);

    request.subscribe({
      next: (club) => {
        this.loadClubs();
        this.showClubModal = false;
        this.isSaving = false;
        if (!this.editingClub) {
          this.selectClub(club);
        }
      },
      error: (error) => {
        console.error('Error saving club:', error);
        alert(this.translate('clubs.saveError'));
        this.isSaving = false;
      }
    });
  }

  deleteClub(club: Club): void {
    if (!confirm(this.translate('clubs.confirmDelete'))) {
      return;
    }

    this.apiService.delete(`/clubs/${club.id}`).subscribe({
      next: () => {
        this.loadClubs();
        if (this.selectedClub?.id === club.id) {
          this.selectedClub = null;
        }
      },
      error: (error) => {
        console.error('Error deleting club:', error);
        alert(this.translate('clubs.deleteError'));
      }
    });
  }

  openAddMemberModal(): void {
    if (!this.selectedClub) return;
    this.showMemberModal = true;
    this.searchTerm = '';
    this.filteredStudents = this.students.filter(s => 
      !this.selectedClub?.members?.some(m => m.studentId === s.id)
    );
  }

  addMember(studentId: number): void {
    if (!this.selectedClub) return;

    this.isSaving = true;
    this.apiService.post<ClubMember>(`/clubs/${this.selectedClub.id}/members`, { studentId })
      .subscribe({
        next: () => {
          this.loadClubDetails(this.selectedClub!.id);
          this.showMemberModal = false;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error adding member:', error);
          alert(this.translate('clubs.addMemberError'));
          this.isSaving = false;
        }
      });
  }

  removeMember(memberId: number): void {
    if (!this.selectedClub) return;
    if (!confirm(this.translate('clubs.confirmRemoveMember'))) return;

    this.apiService.delete(`/clubs/${this.selectedClub.id}/members/${memberId}`)
      .subscribe({
        next: () => {
          this.loadClubDetails(this.selectedClub!.id);
        },
        error: (error) => {
          console.error('Error removing member:', error);
          alert(this.translate('clubs.removeMemberError'));
        }
      });
  }

  openAddEventModal(): void {
    if (!this.selectedClub) return;
    this.editingEvent = null;
    this.eventForm = {
      name: '',
      date: '',
      organizer: '',
      participationType: '',
      results: '',
      report: '',
      photos: [],
      videos: []
    };
    this.photoPreviews = [];
    this.videoPreviews = [];
    this.showEventModal = true;
  }

  openEditEventModal(event: ClubEvent): void {
    this.editingEvent = event;
    this.eventForm = {
      name: event.name,
      date: typeof event.date === 'string' ? event.date.split('T')[0] : new Date(event.date).toISOString().split('T')[0],
      organizer: event.organizer || '',
      participationType: event.participationType || '',
      results: event.results || '',
      report: event.report || '',
      photos: [],
      videos: []
    };
    this.photoPreviews = event.photos || [];
    this.videoPreviews = event.videos || [];
    this.showEventModal = true;
  }

  onPhotoSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        this.eventForm.photos.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  onVideoSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        this.eventForm.videos.push(file);
        this.videoPreviews.push(file.name);
      }
    });
  }

  removePhoto(index: number): void {
    this.eventForm.photos.splice(index, 1);
    this.photoPreviews.splice(index, 1);
  }

  removeVideo(index: number): void {
    this.eventForm.videos.splice(index, 1);
    this.videoPreviews.splice(index, 1);
  }

  saveEvent(): void {
    if (!this.selectedClub) return;
    if (!this.eventForm.name.trim() || !this.eventForm.date) {
      alert(this.translate('clubs.eventRequiredFields'));
      return;
    }

    this.isSaving = true;
    
    // Convert photos to base64
    const photoPromises = this.eventForm.photos.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e: any) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(photoPromises).then(photoBase64 => {
      const payload: any = {
        name: this.eventForm.name.trim(),
        date: this.eventForm.date,
        organizer: this.eventForm.organizer.trim() || undefined,
        participationType: this.eventForm.participationType || undefined,
        results: this.eventForm.results.trim() || undefined,
        report: this.eventForm.report.trim() || undefined,
        photos: photoBase64.length > 0 ? photoBase64 : undefined,
        videos: this.eventForm.videos.length > 0 ? this.videoPreviews : undefined
      };

      const request = this.editingEvent
        ? this.apiService.patch<ClubEvent>(`/clubs/${this.selectedClub!.id}/events/${this.editingEvent.id}`, payload)
        : this.apiService.post<ClubEvent>(`/clubs/${this.selectedClub!.id}/events`, payload);

      request.subscribe({
        next: () => {
          this.loadClubDetails(this.selectedClub!.id);
          this.showEventModal = false;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error saving event:', error);
          alert(this.translate('clubs.saveEventError'));
          this.isSaving = false;
        }
      });
    });
  }

  deleteEvent(event: ClubEvent): void {
    if (!this.selectedClub) return;
    if (!confirm(this.translate('clubs.confirmDeleteEvent'))) return;

    this.apiService.delete(`/clubs/${this.selectedClub.id}/events/${event.id}`)
      .subscribe({
        next: () => {
          this.loadClubDetails(this.selectedClub!.id);
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          alert(this.translate('clubs.deleteEventError'));
        }
      });
  }

  openAnnouncementModal(): void {
    if (!this.selectedClub) return;
    this.announcementForm = { subject: '', message: '', sendEmail: false };
    this.showAnnouncementModal = true;
  }

  sendAnnouncement(): void {
    if (!this.selectedClub) return;
    if (!this.announcementForm.subject.trim() || !this.announcementForm.message.trim()) {
      alert(this.translate('clubs.announcementRequiredFields'));
      return;
    }

    this.isSaving = true;
    this.apiService.post<{ sent: number; failed: number }>(
      `/clubs/${this.selectedClub.id}/announcements`,
      this.announcementForm
    ).subscribe({
      next: (result) => {
        alert(this.translate('clubs.announcementSent').replace('{{sent}}', result.sent.toString()).replace('{{failed}}', result.failed.toString()));
        this.showAnnouncementModal = false;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error sending announcement:', error);
        alert(this.translate('clubs.announcementError'));
        this.isSaving = false;
      }
    });
  }

  openEventReportModal(event: ClubEvent): void {
    this.selectedEventForReport = event;
    this.showEventReportModal = true;
  }

  exportEventToPDF(): void {
    if (!this.selectedEventForReport || !this.reportContent) return;

    this.isExportingPDF = true;
    const element = this.reportContent.nativeElement;

    html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      imageTimeout: 15000
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${this.selectedEventForReport!.name}_report.pdf`);
      this.isExportingPDF = false;
    }).catch(error => {
      console.error('Error exporting event report:', error);
      alert(this.translate('clubs.exportError'));
      this.isExportingPDF = false;
    });
  }

  filterStudents(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredStudents = this.students.filter(s => {
      const isNotMember = !this.selectedClub?.members?.some(m => m.studentId === s.id);
      const matchesSearch = !term || 
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        (s.email && s.email.toLowerCase().includes(term));
      return isNotMember && matchesSearch;
    });
  }

  getFilteredEvents(): ClubEvent[] {
    if (!this.selectedClub?.events) return [];
    let events = this.selectedClub.events;
    
    if (this.selectedEventType) {
      events = events.filter(e => e.participationType === this.selectedEventType);
    }
    
    return events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }

  getParticipationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'presentation': this.translate('clubs.participationType.presentation'),
      'competition': this.translate('clubs.participationType.competition'),
      'workshop': this.translate('clubs.participationType.workshop')
    };
    return labels[type] || type;
  }

  openPhoto(photoUrl: string): void {
    window.open(photoUrl, '_blank');
  }

  exportClubFullReportToPDF(): void {
    if (!this.selectedClub) return;

    this.isExportingPDF = true;
    
    // Wait a bit for the DOM to render
    setTimeout(() => {
      const element = this.clubReportContent?.nativeElement;
      if (!element) {
        console.error('Report content element not found');
        this.isExportingPDF = false;
        return;
      }

      // Configure html2canvas with better options for images
      html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        imageTimeout: 15000,
        removeContainer: true
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save PDF with club name
        const fileName = `${this.selectedClub!.name}_report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        this.isExportingPDF = false;
      }).catch(error => {
        console.error('Error exporting club report:', error);
        alert(this.translate('clubs.exportError'));
        this.isExportingPDF = false;
      });
    }, 500);
  }
}

