import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent {
  constructor(private router: Router) {}

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

  navigateToBehavior(): void {
    this.router.navigate(['/behavior']);
  }

  navigateToGradebook(autoExport: boolean = false): void {
    this.router.navigate(['/gradebook'], {
      queryParams: { autoExport: autoExport ? '1' : undefined },
    });
  }

  navigateToAnnualDistribution(): void {
    this.router.navigate(['/annual-distribution']);
  }

  navigateToProgressTracking(): void {
    this.router.navigate(['/progress-tracking']);
  }

  navigateToTeacherCard(): void {
    this.router.navigate(['/teacher-card']);
  }

  navigateToTrainingReport(report: 'training' | 'inspection' | 'daily' | 'seminars' | 'pedagogical'): void {
    this.router.navigate(['/training-inspection'], {
      queryParams: { report },
    });
  }
}


