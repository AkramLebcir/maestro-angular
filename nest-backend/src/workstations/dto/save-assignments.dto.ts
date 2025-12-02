import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AttendanceStatus,
  BehaviorStatus,
} from '../seat-assignment.entity';

class AssignmentInput {
  @Type(() => Number)
  @IsInt()
  workstationId: number;

  @Type(() => Number)
  @IsInt()
  studentId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seatIndex?: number;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  attendanceStatus?: AttendanceStatus;

  @IsOptional()
  @IsEnum(BehaviorStatus)
  behaviorStatus?: BehaviorStatus;

  @IsOptional()
  behaviorNotes?: string;
}

export class SaveAssignmentsDto {
  @Type(() => Number)
  @IsInt()
  classId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AssignmentInput)
  assignments: AssignmentInput[];
}




