import { IsInt, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'left_early' | 'unrecorded';

export class CreateAttendanceDto {
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @Type(() => Number)
  @IsInt()
  classId: number;

  @IsDateString()
  date: string;

  @IsEnum(['present', 'absent', 'late', 'excused', 'left_early', 'unrecorded'])
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  lessonTime?: string;

  @IsOptional()
  @IsString()
  lessonSubject?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}








