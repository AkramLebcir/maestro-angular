import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClassesModule } from './classes/classes.module';
import { LabsModule } from './labs/labs.module';
import { StudentsModule } from './students/students.module';
import { TimetableModule } from './timetable/timetable.module';
import { NotebooksModule } from './notebooks/notebooks.module';
import { TopicsModule } from './topics/topics.module';
import { BehaviorEventsModule } from './behavior-events/behavior-events.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradesModule } from './grades/grades.module';
import { WorkstationsModule } from './workstations/workstations.module';
import { LabManagementModule } from './lab-management/lab-management.module';
import { AnnualPlanningModule } from './annual-planning/annual-planning.module';
import { ProgressTrackingModule } from './progress-tracking/progress-tracking.module';
import { PedagogicalDocsModule } from './pedagogical-docs/pedagogical-docs.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ClassroomLayoutModule } from './classroom-layout/classroom-layout.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ModuleAccessGuard } from './auth/guards/module-access.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ClassesModule,
    LabsModule,
    StudentsModule,
    TimetableModule,
    NotebooksModule,
    TopicsModule,
    BehaviorEventsModule,
    AttendanceModule,
    GradesModule,
    WorkstationsModule,
    LabManagementModule,
    AnnualPlanningModule,
    ProgressTrackingModule,
    PedagogicalDocsModule,
    CertificatesModule,
    NotificationsModule,
    SubscriptionsModule,
    ClassroomLayoutModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ModuleAccessGuard,
    },
  ],
})
export class AppModule {}

