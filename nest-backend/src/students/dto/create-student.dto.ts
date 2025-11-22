import { IsString, IsOptional, IsEmail, IsInt, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  studentNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRepeater?: boolean;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  generalNotes?: string;
}

