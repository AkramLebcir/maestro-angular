import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  AttendanceStatus,
  BehaviorStatus,
} from '../seat-assignment.entity';

export class UpdateAssignmentStatusDto {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  attendanceStatus?: AttendanceStatus;

  @IsOptional()
  @IsEnum(BehaviorStatus)
  behaviorStatus?: BehaviorStatus;

  @IsOptional()
  @IsString()
  behaviorNotes?: string;
}


