import { IsInt, IsString, IsOptional, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTimetableDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string; // Format: "HH:mm"

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string; // Format: "HH:mm"

  @IsString()
  subject: string;

  @Type(() => Number)
  @IsInt()
  classId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  labId?: number;

  @IsOptional()
  @IsString()
  classroom?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

