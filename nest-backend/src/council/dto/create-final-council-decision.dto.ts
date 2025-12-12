import { IsInt, IsOptional, IsNumber, IsEnum, IsString, IsBoolean } from 'class-validator';

export class CreateFinalCouncilDecisionDto {
  @IsInt()
  studentId: number;

  @IsInt()
  classId: number;

  @IsOptional()
  @IsNumber()
  term1Average?: number;

  @IsOptional()
  @IsNumber()
  term2Average?: number;

  @IsOptional()
  @IsNumber()
  term3Average?: number;

  @IsOptional()
  @IsNumber()
  annualAverage?: number;

  @IsOptional()
  @IsEnum(['pass', 'repeat', 'remedial', 'redirect', 'vocational_redirect'])
  finalDecision?: string;

  @IsOptional()
  @IsBoolean()
  isManualDecision?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

