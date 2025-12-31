import { IsString, IsOptional, IsBoolean, IsDateString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date string' })
  dueDate?: string;

  @IsOptional()
  @IsString()
  reminderText?: string;
}

