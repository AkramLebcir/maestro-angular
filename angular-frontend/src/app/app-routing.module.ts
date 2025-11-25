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
import { ReportsComponent } from './pages/reports/reports.component';

const routes: Routes = [
  { path: '', redirectTo: '/classes', pathMatch: 'full' },
  { path: 'classes', component: ClassesComponent },
  { path: 'dashboard', component: ClassesComponent }, // Placeholder
  { path: 'students', component: StudentsComponent },
  { path: 'labs', component: LabsComponent },
  { path: 'grades', component: ClassesComponent }, // Placeholder
  { path: 'timetable', component: TimetableComponent },
  { path: 'topics', component: TopicsComponent },
  { path: 'notebooks', component: NotebooksComponent },
  { path: 'attendance', component: AttendanceComponent },
  { path: 'behavior', component: BehaviorComponent },
  { path: 'gradebook', component: GradebookComponent },
  { path: 'seating-chart', component: SeatingChartComponent },
  { path: 'annual-distribution', component: AnnualDistributionComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'settings', component: ClassesComponent } // Placeholder
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

