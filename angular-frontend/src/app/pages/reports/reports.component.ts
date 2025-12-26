import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { ApiService } from '../../services/api.service';
import { CertificateService } from '../../services/certificate.service';
import { AuthService } from '../../services/auth.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent {
  isExportingPDF = false;
  isExportingCertificates = false;
  isExportingPenalties = false;

  constructor(
    private router: Router,
    @Inject(LanguageService) public languageService: LanguageService,
    private apiService: ApiService,
    private certificateService: CertificateService,
    private authService: AuthService
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  navigateToLabTab(tab: string, autoExport: boolean = false): void {
    this.router.navigate(['/labs'], {
      queryParams: { tab, autoExport: autoExport ? '1' : undefined },
    });
  }

  navigateToSeatingCharts(): void {
    this.router.navigate(['/seating-chart']);
  }

  navigateToStudents(): void {
    this.router.navigate(['/students']);
  }

  navigateToClassReport(): void {
    this.router.navigate(['/classes'], {
      queryParams: { openReport: '1' }
    });
  }

  navigateToStudentReport(): void {
    this.router.navigate(['/students'], {
      queryParams: { openReport: '1' }
    });
  }

  async navigateToUsersSubscriptionsReport(): Promise<void> {
    await this.exportUsersSubscriptionsToPDF();
  }

  async exportUsersSubscriptionsToPDF(): Promise<void> {
    if (this.isExportingPDF) {
      return;
    }

    this.isExportingPDF = true;

    try {
      // Load users and subscriptions data
      const [users, subscriptions, stats] = await Promise.all([
        firstValueFrom(this.apiService.get<any[]>('/users')),
        firstValueFrom(this.apiService.get<any[]>('/subscriptions')),
        firstValueFrom(this.apiService.get<any>('/subscriptions/stats/overview'))
      ]);

      // Create export container
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '210mm';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';
      document.body.appendChild(exportContainer);

      // Add title
      const title = document.createElement('h1');
      title.textContent = this.translate('reports.usersSubscriptionsReport');
      title.style.textAlign = 'center';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      exportContainer.appendChild(title);

      // Add date
      const dateInfo = document.createElement('p');
      dateInfo.textContent = `التاريخ: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      dateInfo.style.textAlign = 'center';
      dateInfo.style.fontSize = '12px';
      dateInfo.style.color = '#6b7280';
      dateInfo.style.marginBottom = '20px';
      exportContainer.appendChild(dateInfo);

      // Stats Section
      if (stats) {
        const statsTitle = document.createElement('h2');
        statsTitle.textContent = 'نظرة عامة';
        statsTitle.style.fontSize = '18px';
        statsTitle.style.fontWeight = 'bold';
        statsTitle.style.marginTop = '20px';
        statsTitle.style.marginBottom = '10px';
        statsTitle.style.color = '#1f2937';
        exportContainer.appendChild(statsTitle);

        const statsTable = document.createElement('table');
        statsTable.style.width = '100%';
        statsTable.style.borderCollapse = 'collapse';
        statsTable.style.marginBottom = '20px';
        statsTable.style.fontSize = '12px';
        statsTable.style.border = '1px solid #d1d5db';

        const statsRows = [
          ['إجمالي الاشتراكات', stats.subscriptions?.total || 0],
          ['الاشتراكات النشطة', stats.subscriptions?.active || 0],
          ['الاشتراكات قيد الانتظار', stats.subscriptions?.pending || 0],
          ['إجمالي الإيرادات', `${(stats.revenue?.total || 0).toFixed(2)} د.ج`]
        ];

        statsRows.forEach(([label, value]) => {
          const row = document.createElement('tr');
          const labelCell = document.createElement('td');
          labelCell.textContent = label;
          labelCell.style.padding = '8px';
          labelCell.style.border = '1px solid #d1d5db';
          labelCell.style.fontWeight = 'bold';
          labelCell.style.backgroundColor = '#f3f4f6';
          const valueCell = document.createElement('td');
          valueCell.textContent = value.toString();
          valueCell.style.padding = '8px';
          valueCell.style.border = '1px solid #d1d5db';
          valueCell.style.textAlign = 'center';
          row.appendChild(labelCell);
          row.appendChild(valueCell);
          statsTable.appendChild(row);
        });
        exportContainer.appendChild(statsTable);
      }

      // Users and Subscriptions Table
      const tableTitle = document.createElement('h2');
      tableTitle.textContent = 'قائمة الاشتراكات';
      tableTitle.style.fontSize = '18px';
      tableTitle.style.fontWeight = 'bold';
      tableTitle.style.marginTop = '20px';
      tableTitle.style.marginBottom = '10px';
      tableTitle.style.color = '#1f2937';
      exportContainer.appendChild(tableTitle);

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '10px';
      table.style.marginBottom = '20px';
      table.style.border = '1px solid #d1d5db';

      // Table Header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#f3f4f6';
      
      const headers = ['تاريخ الانتهاء', 'تاريخ البدء', 'الحالة', 'الباقة', 'المستخدم'];
      
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '8px';
        th.style.border = '1px solid #d1d5db';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table Body
      const tbody = document.createElement('tbody');
      subscriptions.forEach((subscription: any) => {
        const row = document.createElement('tr');
        
        const user = users.find((u: any) => u.id === subscription.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'غير معروف';
        const userEmail = user?.email || '-';
        
        const statusText = subscription.status === 'active' ? 'نشط' :
                          subscription.status === 'pending' ? 'قيد الانتظار' :
                          subscription.status === 'expired' ? 'منتهي' :
                          'ملغي';
        
        const planName = subscription.plan?.name || '-';
        const startDate = subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' }) : '-';
        const endDate = subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' }) : '-';
        
        const cells = [
          endDate,
          startDate,
          statusText,
          planName,
          `${userName} (${userEmail})`
        ];
        
        cells.forEach((cellText) => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.padding = '6px';
          td.style.border = '1px solid #d1d5db';
          td.style.textAlign = 'right';
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      exportContainer.appendChild(table);

      // Use html2canvas to capture the content
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

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const doc = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const fileName = `تقرير_المستخدمين_والاشتراكات_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      this.isExportingPDF = false;
    } catch (error) {
      console.error('Error exporting users and subscriptions PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
      this.isExportingPDF = false;
    }
  }

  navigateToTimetable(autoExport: boolean = false): void {
    this.router.navigate(['/timetable'], {
      queryParams: { autoExport: autoExport ? '1' : undefined },
    });
  }

  navigateToNotebooks(): void {
    this.router.navigate(['/notebooks']);
  }

  navigateToAttendance(autoExport: boolean = false): void {
    this.router.navigate(['/attendance'], {
      queryParams: { autoExport: autoExport ? '1' : undefined },
    });
  }

  navigateToDepartmentAttendanceReport(): void {
    this.router.navigate(['/attendance'], {
      queryParams: { openDepartmentReport: '1' },
    });
  }

  navigateToBehavior(): void {
    this.router.navigate(['/behavior']);
  }

  navigateToGradebook(autoExport: boolean = false): void {
    this.router.navigate(['/gradebook'], {
      queryParams: { autoExport: autoExport ? '1' : undefined },
    });
  }

  navigateToGradeMonitoring(): void {
    this.router.navigate(['/gradebook'], {
      queryParams: { openGradeMonitoring: '1' },
    });
  }

  navigateToCouncilReport(tab: 'semester' | 'final' = 'semester'): void {
    this.router.navigate(['/gradebook'], {
      queryParams: { openCouncil: '1', councilTab: tab },
    });
  }

  navigateToAnnualDistribution(): void {
    this.router.navigate(['/annual-distribution']);
  }

  navigateToProgressTracking(): void {
    this.router.navigate(['/progress-tracking']);
  }

  navigateToExcelAnalysis(): void {
    this.router.navigate(['/gradebook'], {
      queryParams: { view: 'totalExcelAnalysis' }
    });
  }

  navigateToClubs(): void {
    this.router.navigate(['/clubs']);
  }

  navigateToTeacherCard(): void {
    this.router.navigate(['/teacher-card']);
  }

  navigateToTrainingReport(report: 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical' | 'coordination'): void {
    this.router.navigate(['/training-inspection'], {
      queryParams: { report },
    });
  }

  navigateToCertificatesPenalties(): void {
    this.router.navigate(['/achievements-penalties']);
  }

  navigateToCertificatesWithExport(): void {
    this.router.navigate(['/achievements-penalties'], {
      queryParams: { tab: 'achievements', autoExport: '1' }
    });
  }

  navigateToPenaltiesWithExport(): void {
    this.router.navigate(['/achievements-penalties'], {
      queryParams: { tab: 'penalties', autoExport: '1' }
    });
  }

  async exportCertificatesPenaltiesToPDF(): Promise<void> {
    if (this.isExportingPDF) {
      return;
    }

    this.isExportingPDF = true;

    try {
      // Load all classes
      const classes = await firstValueFrom(this.apiService.get<any[]>('/classes'));
      if (!classes || classes.length === 0) {
        alert('لا توجد أقسام متاحة');
        this.isExportingPDF = false;
        return;
      }

      // Create export container
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '210mm';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';
      document.body.appendChild(exportContainer);

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'تقرير الشهادات والعقوبات';
      title.style.textAlign = 'center';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      exportContainer.appendChild(title);

      // Add date
      const dateInfo = document.createElement('div');
      dateInfo.textContent = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      dateInfo.style.textAlign = 'center';
      dateInfo.style.marginBottom = '30px';
      dateInfo.style.fontSize = '14px';
      dateInfo.style.color = '#6b7280';
      exportContainer.appendChild(dateInfo);

      // Process each class
      for (const cls of classes) {
        // Add class section header
        const classHeader = document.createElement('h2');
        classHeader.textContent = `القسم: ${cls.name}`;
        classHeader.style.fontSize = '18px';
        classHeader.style.fontWeight = 'bold';
        classHeader.style.marginTop = '30px';
        classHeader.style.marginBottom = '15px';
        classHeader.style.color = '#1f2937';
        classHeader.style.borderBottom = '2px solid #e5e7eb';
        classHeader.style.paddingBottom = '5px';
        exportContainer.appendChild(classHeader);

        // Load certificates for this class
        try {
          const certificates = await firstValueFrom(this.certificateService.getCertificates(undefined, cls.id));
          
          if (certificates && certificates.length > 0) {
            const certSection = document.createElement('div');
            certSection.style.marginBottom = '20px';
            
            const certTitle = document.createElement('h3');
            certTitle.textContent = 'الشهادات';
            certTitle.style.fontSize = '16px';
            certTitle.style.fontWeight = 'bold';
            certTitle.style.marginBottom = '10px';
            certTitle.style.color = '#059669';
            certSection.appendChild(certTitle);

            const certTable = document.createElement('table');
            certTable.style.width = '100%';
            certTable.style.borderCollapse = 'collapse';
            certTable.style.marginBottom = '15px';
            certTable.style.fontSize = '12px';

            // Table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f3f4f6';
            ['اسم التلميذ', 'نوع الشهادة', 'تاريخ الإصدار'].forEach(headerText => {
              const th = document.createElement('th');
              th.textContent = headerText;
              th.style.padding = '8px';
              th.style.border = '1px solid #d1d5db';
              th.style.textAlign = 'right';
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            certTable.appendChild(thead);

            // Table body
            const tbody = document.createElement('tbody');
            certificates.forEach(cert => {
              const row = document.createElement('tr');
              const studentName = `${cert.student.firstName} ${cert.student.lastName}`;
              const templateName = cert.template?.name || 'شهادة';
              const issueDate = new Date(cert.issueDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' });
              
              [studentName, templateName, issueDate].forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.style.padding = '8px';
                td.style.border = '1px solid #d1d5db';
                row.appendChild(td);
              });
              tbody.appendChild(row);
            });
            certTable.appendChild(tbody);
            certSection.appendChild(certTable);
            exportContainer.appendChild(certSection);
          }
        } catch (error) {
          console.error('Error loading certificates:', error);
        }

        // Load behavior reports for this class
        try {
          const behaviorEvents = await firstValueFrom(this.apiService.get<any[]>(`/behavior-events?classId=${cls.id}`));
          
          if (behaviorEvents && behaviorEvents.length > 0) {
            const penaltySection = document.createElement('div');
            penaltySection.style.marginBottom = '20px';
            
            const penaltyTitle = document.createElement('h3');
            penaltyTitle.textContent = 'العقوبات والتقارير';
            penaltyTitle.style.fontSize = '16px';
            penaltyTitle.style.fontWeight = 'bold';
            penaltyTitle.style.marginBottom = '10px';
            penaltyTitle.style.color = '#dc2626';
            penaltySection.appendChild(penaltyTitle);

            const penaltyTable = document.createElement('table');
            penaltyTable.style.width = '100%';
            penaltyTable.style.borderCollapse = 'collapse';
            penaltyTable.style.marginBottom = '15px';
            penaltyTable.style.fontSize = '12px';

            // Table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f3f4f6';
            ['اسم التلميذ', 'التاريخ', 'الوصف'].forEach(headerText => {
              const th = document.createElement('th');
              th.textContent = headerText;
              th.style.padding = '8px';
              th.style.border = '1px solid #d1d5db';
              th.style.textAlign = 'right';
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            penaltyTable.appendChild(thead);

            // Table body
            const tbody = document.createElement('tbody');
            behaviorEvents.forEach(event => {
              const row = document.createElement('tr');
              const studentName = event.student 
                ? `${event.student.firstName || ''} ${event.student.lastName || ''}`.trim() 
                : 'غير معروف';
              const date = new Date(event.date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' });
              const description = event.description || 'لا يوجد تفاصيل';
              
              [studentName, date, description].forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.style.padding = '8px';
                td.style.border = '1px solid #d1d5db';
                row.appendChild(td);
              });
              tbody.appendChild(row);
            });
            penaltyTable.appendChild(tbody);
            penaltySection.appendChild(penaltyTable);
            exportContainer.appendChild(penaltySection);
          }
        } catch (error) {
          console.error('Error loading behavior reports:', error);
        }

        // Add page break between classes (except last)
        if (cls !== classes[classes.length - 1]) {
          const pageBreak = document.createElement('div');
          pageBreak.style.pageBreakAfter = 'always';
          exportContainer.appendChild(pageBreak);
        }
      }

      // Generate PDF
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

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297; // A4 height in mm
      const margin = 10;
      const availableHeight = pageHeight - (2 * margin);
      const availableWidth = imgWidth - (2 * margin);

      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

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

      const xOffset = (210 - finalWidth) / 2;
      let yOffset = margin;
      let heightLeft = imgHeight;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        yOffset = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const fileName = `تقرير_الشهادات_والعقوبات_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      this.isExportingPDF = false;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
      this.isExportingPDF = false;
    }
  }

  async exportCertificatesToPDF(): Promise<void> {
    if (this.isExportingCertificates) {
      return;
    }

    this.isExportingCertificates = true;

    try {
      const classes = await firstValueFrom(this.apiService.get<any[]>('/classes'));
      if (!classes || classes.length === 0) {
        alert('لا توجد أقسام متاحة');
        this.isExportingCertificates = false;
        return;
      }

      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '210mm';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';
      document.body.appendChild(exportContainer);

      const title = document.createElement('h1');
      title.textContent = 'تقرير الشهادات';
      title.style.textAlign = 'center';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      exportContainer.appendChild(title);

      const dateInfo = document.createElement('div');
      dateInfo.textContent = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      dateInfo.style.textAlign = 'center';
      dateInfo.style.marginBottom = '30px';
      dateInfo.style.fontSize = '14px';
      dateInfo.style.color = '#6b7280';
      exportContainer.appendChild(dateInfo);

      for (const cls of classes) {
        const classHeader = document.createElement('h2');
        classHeader.textContent = `القسم: ${cls.name}`;
        classHeader.style.fontSize = '18px';
        classHeader.style.fontWeight = 'bold';
        classHeader.style.marginTop = '30px';
        classHeader.style.marginBottom = '15px';
        classHeader.style.color = '#1f2937';
        classHeader.style.borderBottom = '2px solid #e5e7eb';
        classHeader.style.paddingBottom = '5px';
        exportContainer.appendChild(classHeader);

        try {
          const certificates = await firstValueFrom(this.certificateService.getCertificates(undefined, cls.id));
          
          if (certificates && certificates.length > 0) {
            const certTable = document.createElement('table');
            certTable.style.width = '100%';
            certTable.style.borderCollapse = 'collapse';
            certTable.style.marginBottom = '20px';
            certTable.style.fontSize = '12px';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f3f4f6';
            ['اسم التلميذ', 'نوع الشهادة', 'تاريخ الإصدار'].forEach(headerText => {
              const th = document.createElement('th');
              th.textContent = headerText;
              th.style.padding = '8px';
              th.style.border = '1px solid #d1d5db';
              th.style.textAlign = 'right';
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            certTable.appendChild(thead);

            const tbody = document.createElement('tbody');
            certificates.forEach(cert => {
              const row = document.createElement('tr');
              const studentName = `${cert.student.firstName} ${cert.student.lastName}`;
              const templateName = cert.template?.name || 'شهادة';
              const issueDate = new Date(cert.issueDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' });
              
              [studentName, templateName, issueDate].forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.style.padding = '8px';
                td.style.border = '1px solid #d1d5db';
                row.appendChild(td);
              });
              tbody.appendChild(row);
            });
            certTable.appendChild(tbody);
            exportContainer.appendChild(certTable);
          } else {
            const noData = document.createElement('div');
            noData.textContent = 'لا توجد شهادات مسجلة لهذا القسم';
            noData.style.textAlign = 'center';
            noData.style.padding = '15px';
            noData.style.color = '#6b7280';
            noData.style.marginBottom = '20px';
            exportContainer.appendChild(noData);
          }
        } catch (error) {
          console.error('Error loading certificates:', error);
        }

        if (cls !== classes[classes.length - 1]) {
          const pageBreak = document.createElement('div');
          pageBreak.style.pageBreakAfter = 'always';
          exportContainer.appendChild(pageBreak);
        }
      }

      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.offsetHeight
      });

      document.body.removeChild(exportContainer);

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - (2 * margin);
      const availableWidth = imgWidth - (2 * margin);

      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

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

      const xOffset = (210 - finalWidth) / 2;
      let yOffset = margin;
      let heightLeft = imgHeight;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        yOffset = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `تقرير_الشهادات_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      this.isExportingCertificates = false;
    } catch (error) {
      console.error('Error exporting certificates PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
      this.isExportingCertificates = false;
    }
  }

  async exportPenaltiesToPDF(): Promise<void> {
    if (this.isExportingPenalties) {
      return;
    }

    this.isExportingPenalties = true;

    try {
      const classes = await firstValueFrom(this.apiService.get<any[]>('/classes'));
      if (!classes || classes.length === 0) {
        alert('لا توجد أقسام متاحة');
        this.isExportingPenalties = false;
        return;
      }

      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '210mm';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';
      document.body.appendChild(exportContainer);

      const title = document.createElement('h1');
      title.textContent = 'تقرير العقوبات والتقارير';
      title.style.textAlign = 'center';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      exportContainer.appendChild(title);

      const dateInfo = document.createElement('div');
      dateInfo.textContent = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      dateInfo.style.textAlign = 'center';
      dateInfo.style.marginBottom = '30px';
      dateInfo.style.fontSize = '14px';
      dateInfo.style.color = '#6b7280';
      exportContainer.appendChild(dateInfo);

      for (const cls of classes) {
        const classHeader = document.createElement('h2');
        classHeader.textContent = `القسم: ${cls.name}`;
        classHeader.style.fontSize = '18px';
        classHeader.style.fontWeight = 'bold';
        classHeader.style.marginTop = '30px';
        classHeader.style.marginBottom = '15px';
        classHeader.style.color = '#1f2937';
        classHeader.style.borderBottom = '2px solid #e5e7eb';
        classHeader.style.paddingBottom = '5px';
        exportContainer.appendChild(classHeader);

        try {
          const behaviorEvents = await firstValueFrom(this.apiService.get<any[]>(`/behavior-events?classId=${cls.id}`));
          
          if (behaviorEvents && behaviorEvents.length > 0) {
            const penaltyTable = document.createElement('table');
            penaltyTable.style.width = '100%';
            penaltyTable.style.borderCollapse = 'collapse';
            penaltyTable.style.marginBottom = '20px';
            penaltyTable.style.fontSize = '12px';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f3f4f6';
            ['اسم التلميذ', 'التاريخ', 'الوصف'].forEach(headerText => {
              const th = document.createElement('th');
              th.textContent = headerText;
              th.style.padding = '8px';
              th.style.border = '1px solid #d1d5db';
              th.style.textAlign = 'right';
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            penaltyTable.appendChild(thead);

            const tbody = document.createElement('tbody');
            behaviorEvents.forEach(event => {
              const row = document.createElement('tr');
              const studentName = event.student 
                ? `${event.student.firstName || ''} ${event.student.lastName || ''}`.trim() 
                : 'غير معروف';
              const date = new Date(event.date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' });
              const description = event.description || 'لا يوجد تفاصيل';
              
              [studentName, date, description].forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.style.padding = '8px';
                td.style.border = '1px solid #d1d5db';
                row.appendChild(td);
              });
              tbody.appendChild(row);
            });
            penaltyTable.appendChild(tbody);
            exportContainer.appendChild(penaltyTable);
          } else {
            const noData = document.createElement('div');
            noData.textContent = 'لا توجد تقارير سلوك مسجلة لهذا القسم';
            noData.style.textAlign = 'center';
            noData.style.padding = '15px';
            noData.style.color = '#6b7280';
            noData.style.marginBottom = '20px';
            exportContainer.appendChild(noData);
          }
        } catch (error) {
          console.error('Error loading behavior reports:', error);
        }

        if (cls !== classes[classes.length - 1]) {
          const pageBreak = document.createElement('div');
          pageBreak.style.pageBreakAfter = 'always';
          exportContainer.appendChild(pageBreak);
        }
      }

      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: exportContainer.offsetWidth,
        height: exportContainer.offsetHeight
      });

      document.body.removeChild(exportContainer);

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - (2 * margin);
      const availableWidth = imgWidth - (2 * margin);

      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

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

      const xOffset = (210 - finalWidth) / 2;
      let yOffset = margin;
      let heightLeft = imgHeight;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        yOffset = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `تقرير_العقوبات_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      this.isExportingPenalties = false;
    } catch (error) {
      console.error('Error exporting penalties PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
      this.isExportingPenalties = false;
    }
  }

  async exportSpecialNeedsStudentsToPDF(): Promise<void> {
    if (this.isExportingPDF) {
      return;
    }

    this.isExportingPDF = true;

    try {
      // Load all students
      const students = await firstValueFrom(this.apiService.get<any[]>('/students'));
      if (!students || students.length === 0) {
        alert('لا توجد بيانات تلاميذ متاحة');
        this.isExportingPDF = false;
        return;
      }

      // Filter students with special cases
      const specialNeedsStudents = students.filter((student: any) => 
        student.specialCases && student.specialCases.length > 0
      );

      if (specialNeedsStudents.length === 0) {
        alert('لا يوجد تلاميذ بحالات خاصة');
        this.isExportingPDF = false;
        return;
      }

      // Load classes for class names
      const classes = await firstValueFrom(this.apiService.get<any[]>('/classes'));
      const classMap = new Map(classes.map((c: any) => [c.id, c.name]));

      // Helper function to get class name
      const getClassName = (classId?: number) => {
        if (!classId) return '-';
        return classMap.get(classId) || '-';
      };

      // Helper function to get gender label
      const getGenderLabel = (gender?: string) => {
        if (!gender) return '-';
        return gender === 'male' ? 'ذكر' : 'أنثى';
      };

      // Helper function to format date
      const formatDate = (date: Date | string) => {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('ar-EG', { numberingSystem: 'latn' });
      };

      // Helper function to get special case label
      const getSpecialCaseLabel = (category: string) => {
        switch (category) {
          case 'health':
            return 'صحية';
          case 'exemption':
            return 'إعفاء';
          case 'learning_difficulty':
            return 'صعوبة تعلم';
          default:
            return category;
        }
      };

      // Create export container
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '210mm';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      exportContainer.style.direction = 'rtl';
      exportContainer.style.textAlign = 'right';
      document.body.appendChild(exportContainer);

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'تقرير تلاميذ الحالات الخاصة';
      title.style.textAlign = 'center';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.color = '#111827';
      exportContainer.appendChild(title);

      // Add date
      const dateInfo = document.createElement('p');
      dateInfo.textContent = `التاريخ: ${new Date().toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}`;
      dateInfo.style.textAlign = 'center';
      dateInfo.style.fontSize = '12px';
      dateInfo.style.color = '#6b7280';
      dateInfo.style.marginBottom = '20px';
      exportContainer.appendChild(dateInfo);

      // Add summary
      const summary = document.createElement('div');
      summary.style.marginBottom = '20px';
      summary.style.padding = '10px';
      summary.style.backgroundColor = '#f3f4f6';
      summary.style.borderRadius = '5px';
      
      const summaryText = document.createElement('p');
      summaryText.textContent = `إجمالي عدد التلاميذ بحالات خاصة: ${specialNeedsStudents.length}`;
      summaryText.style.fontSize = '14px';
      summaryText.style.fontWeight = 'bold';
      summaryText.style.textAlign = 'center';
      summaryText.style.color = '#1f2937';
      summary.appendChild(summaryText);
      exportContainer.appendChild(summary);

      // Create table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '10px';
      table.style.marginBottom = '20px';
      table.style.border = '1px solid #d1d5db';

      // Table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#f3f4f6';
      
      const headers = ['الحالات الخاصة', 'الإجراء المطلوب', 'التفاصيل', 'المجموعة', 'القسم', 'رقم التلميذ', 'الجنس', 'تاريخ الميلاد', 'الاسم', 'اللقب', 'رقم الهوية'];
      
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '8px';
        th.style.border = '1px solid #d1d5db';
        th.style.textAlign = 'right';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      specialNeedsStudents.forEach((student: any) => {
        const cases = student.specialCases || [];
        if (cases.length === 0) return;

        cases.forEach((specialCase: any) => {
          const row = document.createElement('tr');
          
          const idNumber = student.idNumber || '-';
          const lastName = student.lastName || '-';
          const firstName = student.firstName || '-';
          const dateOfBirth = formatDate(student.dateOfBirth);
          const gender = getGenderLabel(student.gender);
          const studentId = student.studentId || '-';
          const className = getClassName(student.classId);
          const group = student.group === 1 ? 'المجموعة 1' : student.group === 2 ? 'المجموعة 2' : '-';
          const caseType = getSpecialCaseLabel(specialCase.category);
          const details = specialCase.details || '-';
          const requiredAction = specialCase.requiredAction || '-';

          const cells = [
            caseType,
            requiredAction,
            details,
            group,
            className,
            studentId,
            gender,
            dateOfBirth,
            firstName,
            lastName,
            idNumber
          ];
          
          cells.forEach((cellText) => {
            const td = document.createElement('td');
            td.textContent = cellText;
            td.style.padding = '6px';
            td.style.border = '1px solid #d1d5db';
            td.style.textAlign = 'right';
            row.appendChild(td);
          });
          
          tbody.appendChild(row);
        });
      });
      table.appendChild(tbody);
      exportContainer.appendChild(table);

      // Use html2canvas to capture the content
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

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const doc = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const fileName = `تقرير_تلاميذ_الحالات_الخاصة_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      this.isExportingPDF = false;
    } catch (error) {
      console.error('Error exporting special needs students PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
      this.isExportingPDF = false;
    }
  }
}


