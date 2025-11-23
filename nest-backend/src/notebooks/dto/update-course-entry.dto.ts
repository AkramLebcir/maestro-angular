import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCourseEntryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  notebookId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

