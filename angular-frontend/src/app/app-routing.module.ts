import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClassesComponent } from './pages/classes/classes.component';
import { LabsComponent } from './pages/labs/labs.component';
import { StudentsComponent } from './pages/students/students.component';
import { TimetableComponent } from './pages/timetable/timetable.component';
import { TopicsComponent } from './pages/topics/topics.component';
import { NotebooksComponent } from './pages/notebooks/notebooks.component';
import { BehaviorComponent } from './pages/behavior/behavior.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { GradebookComponent } from './pages/gradebook/gradebook.component';
import { SeatingChartComponent } from './pages/seating-chart/seating-chart.component';
import { AnnualDistributionComponent } from './pages/annual-distribution/annual-distribution.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { TeacherCardComponent } from './pages/teacher-card/teacher-card.component';
import { TeacherNotebookComponent } from './pages/teacher-notebook/teacher-notebook.component';
import { ProgressTrackingComponent } from './pages/progress-tracking/progress-tracking.component';
import { PedagogicalDocsComponent } from './pages/pedagogical-docs/pedagogical-docs.component';
import { TrainingInspectionComponent } from './pages/training-inspection/training-inspection.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'teacher-card', component: TeacherCardComponent },
  { path: 'classes', component: ClassesComponent },
  { path: 'students', component: StudentsComponent },
  { path: 'labs', component: LabsComponent },
  { path: 'timetable', component: TimetableComponent },
  { path: 'topics', component: TopicsComponent },
  { path: 'notebooks', component: NotebooksComponent },
  { path: 'attendance', component: AttendanceComponent },
  { path: 'behavior', component: BehaviorComponent },
  { path: 'gradebook', component: GradebookComponent },
  { path: 'seating-chart', component: SeatingChartComponent },
  { path: 'annual-distribution', component: AnnualDistributionComponent },
  { path: 'teacher-notebook', component: TeacherNotebookComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'progress-tracking', component: ProgressTrackingComponent },
  { path: 'pedagogical-docs', component: PedagogicalDocsComponent },
  { path: 'training-inspection', component: TrainingInspectionComponent },
  { path: 'settings', component: ClassesComponent } // Placeholder
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

