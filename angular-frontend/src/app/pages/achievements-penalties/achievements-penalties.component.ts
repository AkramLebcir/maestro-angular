import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CertificateService } from '../../services/certificate.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';

interface Achievement {
  // ... existing fields if needed, or remove if not used
}

interface ClassOption {
  id: number;
  name: string;
}

interface BehaviorEventDto {
  id: number;
  student?: {
    firstName?: string;
    lastName?: string;
  };
  class?: {
    name?: string;
  };
  date: string;
  description?: string;
}

interface BehaviorReport {
  id: number;
  studentName: string;
  className?: string;
  date: string;
  description: string;
}

interface CertificateHistory {
  id: number;
  studentName: string;
  className: string;
  templateName: string;
  issueDate: string;
}

@Component({
  selector: 'app-achievements-penalties',
  templateUrl: './achievements-penalties.component.html',
  styleUrls: ['./achievements-penalties.component.css'],
})
export class AchievementsPenaltiesComponent implements OnInit {
  @ViewChild('penaltiesList', { static: false }) penaltiesListRef?: ElementRef;
  
  activeTab: 'achievements' | 'penalties' = 'achievements';
  // Removed static achievements array as we now load real certificates

  classes: ClassOption[] = [];
  selectedClassId?: number;
  
  // For Penalties tab
  behaviorReports: BehaviorReport[] = [];
  isLoadingReports = false;
  isExportingPdf = false;
  
  // For Achievements tab
  certificateHistory: CertificateHistory[] = [];
  isLoadingCertificates = false;
  isExportingCertificatesPdf = false;

  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private certificateService: CertificateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    
    // دعم الفتح من صفحة التقارير مع التصدير التلقائي
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'] as 'achievements' | 'penalties' | undefined;
      const autoExport = params['autoExport'] === '1';
      
      if (tab) {
        this.activeTab = tab;
      }
      
      if (autoExport) {
        setTimeout(() => {
          if (tab === 'achievements') {
            this.exportCertificatesToPDF();
          } else if (tab === 'penalties') {
            this.exportPenaltiesToPDF();
          }
        }, 500);
      }
    });
  }

  onTabChange(tab: 'achievements' | 'penalties'): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    // Load data for the active tab if a class is selected
    if (this.selectedClassId) {
      if (tab === 'penalties') {
        this.loadBehaviorReports();
      } else {
        this.loadCertificateHistory();
      }
    }
  }

  private loadClasses(): void {
    this.apiService.get<ClassOption[]>('/classes').subscribe({
      next: (data) => {
        this.classes = data;
        if (!this.selectedClassId && this.classes.length) {
          this.selectedClassId = this.classes[0].id;
        }
        // Load initial data
        if (this.activeTab === 'penalties') {
          this.loadBehaviorReports();
        } else {
          this.loadCertificateHistory();
        }
      },
      error: () => {
        this.errorMessage = 'تعذر تحميل قائمة الأقسام';
      },
    });
  }

  onClassChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedClassId = Number(value) || undefined;
    if (this.activeTab === 'penalties') {
      this.loadBehaviorReports();
    } else {
      this.loadCertificateHistory();
    }
  }

  private loadBehaviorReports(): void {
    if (!this.selectedClassId) {
      this.behaviorReports = [];
      return;
    }

    this.isLoadingReports = true;
    this.errorMessage = '';

    this.apiService
      .get<BehaviorEventDto[]>(
        `/behavior-events?classId=${this.selectedClassId}`,
      )
      .subscribe({
        next: (data) => {
          this.behaviorReports = data.map((event) => ({
            id: event.id,
            studentName: this.buildStudentLabel(event.student),
            className: event.class?.name,
            date: new Date(event.date).toLocaleDateString('ar-EG'),
            description: event.description || 'لا يوجد تفاصيل إضافية',
          }));
          this.isLoadingReports = false;
        },
        error: () => {
          this.errorMessage = 'تعذر تحميل تقارير السلوك';
          this.behaviorReports = [];
          this.isLoadingReports = false;
        },
      });
  }

  private loadCertificateHistory(): void {
    if (!this.selectedClassId) {
      this.certificateHistory = [];
      return;
    }

    this.isLoadingCertificates = true;
    this.errorMessage = '';

    this.certificateService.getCertificates(undefined, this.selectedClassId).subscribe({
      next: (data) => {
        this.certificateHistory = data.map((cert) => ({
          id: cert.id,
          studentName: `${cert.student.firstName} ${cert.student.lastName}`,
          className: cert.className || '',
          templateName: cert.template?.name || 'شهادة',
          issueDate: new Date(cert.issueDate).toLocaleDateString('ar-EG')
        }));
        this.isLoadingCertificates = false;
      },
      error: () => {
        this.errorMessage = 'تعذر تحميل سجل الشهادات';
        this.certificateHistory = [];
        this.isLoadingCertificates = false;
      }
    });
  }

  private buildStudentLabel(student?: { firstName?: string; lastName?: string }): string {
    if (!student) {
      return 'طالب غير معروف';
    }
    const fullName = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
    return fullName || 'طالب غير معروف';
  }

  async exportPenaltiesToPDF(): Promise<void> {
    this.isExportingPdf = true;

    try {
      // تحميل جميع الأقسام إذا لم تكن محملة
      if (this.classes.length === 0) {
        this.classes = await firstValueFrom(this.apiService.get<any[]>('/classes'));
      }

      if (this.classes.length === 0) {
        alert('لا توجد أقسام متاحة');
        this.isExportingPdf = false;
        return;
      }

      // تحميل تقارير السلوك لجميع الأقسام
      const allBehaviorReports: Array<{report: any, className: string}> = [];
      for (const cls of this.classes) {
        try {
          const behaviorEvents = await firstValueFrom(this.apiService.get<any[]>(`/behavior-events?classId=${cls.id}`));
          behaviorEvents.forEach(event => {
            allBehaviorReports.push({ 
              report: {
                studentName: this.buildStudentLabel(event.student),
                className: cls.name,
                date: new Date(event.date).toLocaleDateString('ar-EG'),
                description: event.description || 'لا يوجد تفاصيل إضافية'
              },
              className: cls.name
            });
          });
        } catch (error) {
          console.error(`Error loading behavior reports for class ${cls.id}:`, error);
        }
      }

      if (allBehaviorReports.length === 0) {
        alert('لا توجد تقارير لتصديرها');
        this.isExportingPdf = false;
        return;
      }

      // Create a temporary container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '800px';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '30px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'تقرير العقوبات والتقارير';
      title.style.textAlign = 'center';
      title.style.fontSize = '28px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '15px';
      title.style.color = '#111827';

      // Add date
      const info = document.createElement('div');
      info.style.textAlign = 'center';
      info.style.marginBottom = '30px';
      info.style.fontSize = '16px';
      info.style.color = '#6b7280';
      const dateInfo = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`;
      info.innerHTML = `<div>${dateInfo}</div>`;

      exportContainer.appendChild(title);
      exportContainer.appendChild(info);

      // Group reports by class
      const reportsByClass = new Map<string, any[]>();
      allBehaviorReports.forEach(({ report, className }) => {
        if (!reportsByClass.has(className)) {
          reportsByClass.set(className, []);
        }
        reportsByClass.get(className)!.push(report);
      });

      // Create reports for each class
      let classIndex = 0;
      for (const [className, reports] of reportsByClass) {
        // Add class header
        const classHeader = document.createElement('h2');
        classHeader.textContent = `القسم: ${className}`;
        classHeader.style.fontSize = '20px';
        classHeader.style.fontWeight = 'bold';
        classHeader.style.marginTop = classIndex > 0 ? '30px' : '0';
        classHeader.style.marginBottom = '15px';
        classHeader.style.color = '#1f2937';
        classHeader.style.borderBottom = '2px solid #e5e7eb';
        classHeader.style.paddingBottom = '5px';
        exportContainer.appendChild(classHeader);

        // Create reports list
        const reportsList = document.createElement('ul');
        reportsList.style.listStyle = 'none';
        reportsList.style.padding = '0';
        reportsList.style.margin = '0';
        reportsList.style.display = 'flex';
        reportsList.style.flexDirection = 'column';
        reportsList.style.gap = '15px';

        reports.forEach((report, index) => {
        const reportItem = document.createElement('li');
        reportItem.style.background = 'white';
        reportItem.style.borderRadius = '8px';
        reportItem.style.padding = '20px';
        reportItem.style.border = '1px solid #e5e7eb';
        reportItem.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

        const reportHeader = document.createElement('div');
        reportHeader.style.display = 'flex';
        reportHeader.style.justifyContent = 'space-between';
        reportHeader.style.alignItems = 'center';
        reportHeader.style.marginBottom = '10px';

        const studentInfo = document.createElement('div');
        const studentName = document.createElement('p');
        studentName.textContent = report.studentName;
        studentName.style.margin = '0';
        studentName.style.fontWeight = '600';
        studentName.style.fontSize = '18px';
        studentName.style.color = '#111827';

        const classInfo = document.createElement('small');
        classInfo.textContent = report.className || 'غير محدد';
        classInfo.style.color = '#6b7280';
        classInfo.style.fontSize = '14px';
        classInfo.style.display = 'block';
        classInfo.style.marginTop = '5px';

        studentInfo.appendChild(studentName);
        studentInfo.appendChild(classInfo);

        const date = document.createElement('span');
        date.textContent = report.date;
        date.style.color = '#0ea5e9';
        date.style.fontWeight = '600';
        date.style.fontSize = '14px';

        reportHeader.appendChild(studentInfo);
        reportHeader.appendChild(date);

        const description = document.createElement('p');
        description.textContent = report.description;
        description.style.margin = '10px 0 0 0';
        description.style.color = '#334155';
        description.style.fontSize = '15px';
        description.style.lineHeight = '1.6';

          reportItem.appendChild(reportHeader);
          reportItem.appendChild(description);
          reportsList.appendChild(reportItem);
        });

        exportContainer.appendChild(reportsList);
        classIndex++;
      }
      document.body.appendChild(exportContainer);

      // Use html2canvas to capture the content
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

      // Scale to fit width first
      let finalWidth = Math.min(imgWidth, availableWidth);
      let finalHeight = (canvas.height * finalWidth) / canvas.width;

      // Position content from top
      const xOffset = (pageWidth - finalWidth) / 2; // Center horizontally
      const yOffset = margin; // Start from top with margin

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Add additional pages if content is taller than one page
      let heightLeft = finalHeight - availableHeight;
      let position = -availableHeight;

      while (heightLeft > 0) {
        position = position - availableHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, position, finalWidth, finalHeight);
        heightLeft -= availableHeight;
      }

      // Save PDF
      const fileName = `تقرير_العقوبات_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    } finally {
      this.isExportingPdf = false;
    }
  }

  async exportCertificatesToPDF(): Promise<void> {
    this.isExportingCertificatesPdf = true;

    try {
      // تحميل جميع الأقسام إذا لم تكن محملة
      if (this.classes.length === 0) {
        this.classes = await firstValueFrom(this.apiService.get<any[]>('/classes'));
      }

      if (this.classes.length === 0) {
        alert('لا توجد أقسام متاحة');
        this.isExportingCertificatesPdf = false;
        return;
      }

      // تحميل الشهادات لجميع الأقسام
      const allCertificates: Array<{cert: any, className: string}> = [];
      for (const cls of this.classes) {
        try {
          const certificates = await firstValueFrom(this.certificateService.getCertificates(undefined, cls.id));
          certificates.forEach(cert => {
            allCertificates.push({ cert, className: cls.name });
          });
        } catch (error) {
          console.error(`Error loading certificates for class ${cls.id}:`, error);
        }
      }

      if (allCertificates.length === 0) {
        alert('لا توجد شهادات لتصديرها');
        this.isExportingCertificatesPdf = false;
        return;
      }

      // Create a temporary container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '800px';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '30px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'تقرير الشهادات';
      title.style.textAlign = 'center';
      title.style.fontSize = '28px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '15px';
      title.style.color = '#111827';

      // Add date
      const info = document.createElement('div');
      info.style.textAlign = 'center';
      info.style.marginBottom = '30px';
      info.style.fontSize = '16px';
      info.style.color = '#6b7280';
      const dateInfo = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`;
      info.innerHTML = `<div>${dateInfo}</div>`;

      exportContainer.appendChild(title);
      exportContainer.appendChild(info);

      // Group certificates by class
      const certificatesByClass = new Map<string, any[]>();
      allCertificates.forEach(({ cert, className }) => {
        if (!certificatesByClass.has(className)) {
          certificatesByClass.set(className, []);
        }
        certificatesByClass.get(className)!.push(cert);
      });

      // Create table for each class
      let classIndex = 0;
      for (const [className, certificates] of certificatesByClass) {
        // Add class header
        const classHeader = document.createElement('h2');
        classHeader.textContent = `القسم: ${className}`;
        classHeader.style.fontSize = '20px';
        classHeader.style.fontWeight = 'bold';
        classHeader.style.marginTop = classIndex > 0 ? '30px' : '0';
        classHeader.style.marginBottom = '15px';
        classHeader.style.color = '#1f2937';
        classHeader.style.borderBottom = '2px solid #e5e7eb';
        classHeader.style.paddingBottom = '5px';
        exportContainer.appendChild(classHeader);

        // Create certificates table
        const certTable = document.createElement('table');
        certTable.style.width = '100%';
        certTable.style.borderCollapse = 'collapse';
        certTable.style.marginBottom = '20px';
        certTable.style.fontSize = '14px';

        // Table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#f3f4f6';
        ['اسم التلميذ', 'نوع الشهادة', 'تاريخ الإصدار'].forEach(headerText => {
          const th = document.createElement('th');
          th.textContent = headerText;
          th.style.padding = '12px';
          th.style.border = '1px solid #d1d5db';
          th.style.textAlign = 'right';
          th.style.fontWeight = '600';
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        certTable.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        certificates.forEach(cert => {
          const row = document.createElement('tr');
          row.style.borderBottom = '1px solid #e5e7eb';
          
          const studentName = `${cert.student.firstName} ${cert.student.lastName}`;
          const templateName = cert.template?.name || 'شهادة';
          const issueDate = new Date(cert.issueDate).toLocaleDateString('ar-EG');
          
          [studentName, templateName, issueDate].forEach(cellText => {
            const td = document.createElement('td');
            td.textContent = cellText;
            td.style.padding = '12px';
            td.style.border = '1px solid #d1d5db';
            row.appendChild(td);
          });
          tbody.appendChild(row);
        });
        certTable.appendChild(tbody);
        exportContainer.appendChild(certTable);
        
        classIndex++;
      }
      document.body.appendChild(exportContainer);

      // Use html2canvas to capture the content
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

      // Scale to fit width first
      let finalWidth = Math.min(imgWidth, availableWidth);
      let finalHeight = (canvas.height * finalWidth) / canvas.width;

      // Position content from top
      const xOffset = (pageWidth - finalWidth) / 2; // Center horizontally
      const yOffset = margin; // Start from top with margin

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Add additional pages if content is taller than one page
      let heightLeft = finalHeight - availableHeight;
      let position = -availableHeight;

      while (heightLeft > 0) {
        position = position - availableHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, position, finalWidth, finalHeight);
        heightLeft -= availableHeight;
      }

      // Save PDF
      const fileName = `تقرير_الشهادات_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting certificates to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    } finally {
      this.isExportingCertificatesPdf = false;
    }
  }
}

