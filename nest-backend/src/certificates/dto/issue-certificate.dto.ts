import { IsDateString, IsInt, IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class IssueCertificateDto {
  @IsInt()
  studentId: number;

  @IsInt()
  templateId: number;

  @IsString()
  @IsNotEmpty()
  mainText: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsISO8601()
  issueDate: string;

  @IsString()
  academicYear: string;

  @IsString()
  signatureName: string;
}







