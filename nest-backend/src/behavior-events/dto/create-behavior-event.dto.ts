import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBehaviorEventDto {
  @Type(() => Number)
  @IsInt()
  studentId: number;

  @Type(() => Number)
  @IsInt()
  behaviorId: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;
}

