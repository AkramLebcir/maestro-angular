import { IsString, IsDateString, IsInt, IsOptional, Matches } from 'class-validator';

export class CreateDailyJournalEntryDto {
  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @IsInt()
  classId: number;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsInt()
  topicId?: number;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  activity?: string;

  @IsOptional()
  @IsString()
  homework?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

