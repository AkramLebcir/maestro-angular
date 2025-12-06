import { IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseColumnKey } from '../grading-settings.entity';

export class CustomAssessmentColumnDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  maxScore: number;
}

const BASE_COLUMN_KEYS: BaseColumnKey[] = ['notebook_correction', 'duty', 'attendance', 'behavior'];

export class BaseColumnConfigDto {
  @IsString()
  @IsIn(BASE_COLUMN_KEYS)
  key: BaseColumnKey;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class CreateGradingSettingsDto {
  @IsNumber()
  classId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  notebookCorrectionMaxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dutyMaxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  attendanceMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  attendanceAutoApply?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  behaviorMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  behaviorAutoApply?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomAssessmentColumnDto)
  customAssessmentColumns?: CustomAssessmentColumnDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseColumnConfigDto)
  baseColumnSettings?: BaseColumnConfigDto[];

  @IsOptional()
  @IsBoolean()
  includeOralExpression?: boolean;
}

export class UpdateGradingSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  notebookCorrectionMaxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dutyMaxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  attendanceMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  attendanceAutoApply?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  behaviorMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  behaviorAutoApply?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomAssessmentColumnDto)
  customAssessmentColumns?: CustomAssessmentColumnDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseColumnConfigDto)
  baseColumnSettings?: BaseColumnConfigDto[];

  @IsOptional()
  @IsBoolean()
  includeOralExpression?: boolean;
}

export class BulkApplySettingsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  classIds: number[];

  @IsNumber()
  @Min(0)
  notebookCorrectionMaxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dutyMaxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  attendanceMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  attendanceAutoApply?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  behaviorMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  behaviorAutoApply?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomAssessmentColumnDto)
  customAssessmentColumns?: CustomAssessmentColumnDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseColumnConfigDto)
  baseColumnSettings?: BaseColumnConfigDto[];

  @IsOptional()
  @IsBoolean()
  includeOralExpression?: boolean;
}

