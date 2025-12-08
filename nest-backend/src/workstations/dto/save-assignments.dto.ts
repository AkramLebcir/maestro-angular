import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  quickGrade?: number | null;
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





