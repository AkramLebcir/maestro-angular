import { IsEnum, IsString, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassLevel } from '../class.entity';

export class CreateClassDto {
  @IsEnum(ClassLevel, {
    message: 'Level must be a valid class level',
  })
  level: ClassLevel;

  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  labId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  weeklySessions: number;
}

