import { IsString } from 'class-validator';

export class CreateCertificateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  defaultMainText: string;

  @IsString()
  defaultReason: string;

  @IsString()
  defaultAcademicYear: string;

  @IsString()
  defaultSignatureLabel: string;
}




