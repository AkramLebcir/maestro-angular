import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClassesComponent } from './pages/classes/classes.component';
import { LabsComponent } from './pages/labs/labs.component';

const routes: Routes = [
  { path: '', redirectTo: '/classes', pathMatch: 'full' },
  { path: 'classes', component: ClassesComponent },
  { path: 'dashboard', component: ClassesComponent }, // Placeholder
  { path: 'students', component: ClassesComponent }, // Placeholder
  { path: 'labs', component: LabsComponent },
  { path: 'grades', component: ClassesComponent }, // Placeholder
  { path: 'timetable', component: ClassesComponent }, // Placeholder
  { path: 'reports', component: ClassesComponent }, // Placeholder
  { path: 'settings', component: ClassesComponent } // Placeholder
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

