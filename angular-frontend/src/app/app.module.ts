import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
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
import { CertificateGeneratorComponent } from './pages/certificate-generator/certificate-generator.component';
import { AchievementsPenaltiesComponent } from './pages/achievements-penalties/achievements-penalties.component';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { NgChartsModule } from 'ng2-charts';
import { RecaptchaModule } from 'ng-recaptcha';
import { LoginComponent } from './pages/login/login.component';
import { AdminComponent } from './pages/admin/admin.component';
import { UsersManagementComponent } from './pages/admin/users-management/users-management.component';
import { ModuleAccessComponent } from './pages/admin/module-access/module-access.component';
import { MonitoringComponent } from './pages/admin/monitoring/monitoring.component';
import { SubscriptionManagementComponent } from './pages/admin/subscription-management/subscription-management.component';
import { SubscriptionStatusComponent } from './pages/subscription-status/subscription-status.component';
import { SubscriptionPaymentComponent } from './pages/subscription-payment/subscription-payment.component';
import { ReportGeneratorComponent } from './pages/report-generator/report-generator.component';
import { ClubsComponent } from './pages/clubs/clubs.component';
import { AuthInterceptor } from './services/auth-interceptor.service';
import { GlobalErrorHandler } from './services/global-error-handler.service';
import { RandomPickerComponent } from './components/random-picker/random-picker.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    ClassesComponent,
    LabsComponent,
    StudentsComponent,
    RandomPickerComponent,
    TimetableComponent,
    TopicsComponent,
    NotebooksComponent,
    AttendanceComponent,
    BehaviorComponent,
    GradebookComponent,
    SeatingChartComponent,
    AnnualDistributionComponent,
    DashboardComponent,
    ReportsComponent,
    TeacherCardComponent,
    TeacherNotebookComponent,
    ProgressTrackingComponent,
    PedagogicalDocsComponent,
    TrainingInspectionComponent,
    CertificateGeneratorComponent,
    AchievementsPenaltiesComponent,
    SafeUrlPipe,
    LoginComponent,
    AdminComponent,
    UsersManagementComponent,
    ModuleAccessComponent,
    MonitoringComponent,
    SubscriptionManagementComponent,
    SubscriptionStatusComponent,
    SubscriptionPaymentComponent,
    ReportGeneratorComponent,
    ClubsComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,
    AppRoutingModule,
    NgChartsModule,
    RecaptchaModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

