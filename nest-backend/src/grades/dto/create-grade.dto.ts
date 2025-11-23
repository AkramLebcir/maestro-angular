import { IsInt, IsNumber, IsDateString, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGradeDto {
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @Type(() => Number)
  @IsInt()
  assessmentId: number;

  @Type(() => Number)
  @IsInt()
  classId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxScore: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

