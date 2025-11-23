import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

