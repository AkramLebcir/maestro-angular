import { IsString, IsOptional, IsEmail, IsInt, IsBoolean, IsEnum, IsDateString, IsIn, ValidateIf, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SpecialCaseDto } from './special-case.dto';

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

  @IsOptional()
  @ValidateIf((o) => o.group !== null && o.group !== undefined)
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2], { message: 'Group must be either 1 or 2' })
  group?: 1 | 2 | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialCaseDto)
  specialCases?: SpecialCaseDto[];
}

