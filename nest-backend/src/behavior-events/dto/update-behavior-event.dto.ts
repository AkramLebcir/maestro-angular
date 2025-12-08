import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBehaviorEventDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  behaviorId?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;
}






