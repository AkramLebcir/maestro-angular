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
import { AchievementsPenaltiesComponent } from './pages/achievements-penalties/achievements-penalties.component';
import { LoginComponent } from './pages/login/login.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'teacher-card', component: TeacherCardComponent, canActivate: [AuthGuard] },
  { path: 'classes', component: ClassesComponent, canActivate: [AuthGuard] },
  { path: 'students', component: StudentsComponent, canActivate: [AuthGuard] },
  { path: 'labs', component: LabsComponent, canActivate: [AuthGuard] },
  { path: 'timetable', component: TimetableComponent, canActivate: [AuthGuard] },
  { path: 'topics', component: TopicsComponent, canActivate: [AuthGuard] },
  { path: 'notebooks', component: NotebooksComponent, canActivate: [AuthGuard] },
  { path: 'attendance', component: AttendanceComponent, canActivate: [AuthGuard] },
  { path: 'behavior', component: BehaviorComponent, canActivate: [AuthGuard] },
  { path: 'gradebook', component: GradebookComponent, canActivate: [AuthGuard] },
  { path: 'seating-chart', component: SeatingChartComponent, canActivate: [AuthGuard] },
  { path: 'achievements-penalties', component: AchievementsPenaltiesComponent, canActivate: [AuthGuard] },
  { path: 'annual-distribution', component: AnnualDistributionComponent, canActivate: [AuthGuard] },
  { path: 'teacher-notebook', component: TeacherNotebookComponent, canActivate: [AuthGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard] },
  { path: 'progress-tracking', component: ProgressTrackingComponent, canActivate: [AuthGuard] },
  { path: 'pedagogical-docs', component: PedagogicalDocsComponent, canActivate: [AuthGuard] },
  { path: 'training-inspection', component: TrainingInspectionComponent, canActivate: [AuthGuard] },
  { path: 'settings', redirectTo: '/admin', pathMatch: 'full' } // Redirect to admin panel for admins
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

