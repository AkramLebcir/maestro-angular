import { IsInt, IsOptional, IsNumber, IsEnum, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouncilSemesterRecordDto {
  @IsInt()
  @Type(() => Number)
  studentId: number;

  @IsInt()
  @Type(() => Number)
  classId: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  term: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  teacherAverage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  semesterAverage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  behaviorRating?: number;

  @IsOptional()
  @IsEnum(['disciplined', 'average', 'frequent'])
  absencesLevel?: string;

  @IsOptional()
  @IsEnum(['excellence', 'congratulation', 'encouragement', 'honor_roll', 'none'])
  award?: string;

  @IsOptional()
  @IsString()
  councilNotes?: string;
}

