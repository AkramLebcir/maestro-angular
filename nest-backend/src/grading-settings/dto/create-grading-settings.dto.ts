import { IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, Min, IsString, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseColumnKey, LanguageCode } from '../grading-settings.entity';

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

export class RatingsDto {
  @IsOptional()
  @IsString()
  AR?: string;

  @IsOptional()
  @IsString()
  FR?: string;

  @IsOptional()
  @IsString()
  EN?: string;

  @IsOptional()
  @IsString()
  ES?: string;

  @IsOptional()
  @IsString()
  IT?: string;

  @IsOptional()
  @IsString()
  DE?: string;

  @IsOptional()
  @IsString()
  TR?: string;
}

export class RatingRangeConfigDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @ValidateNested()
  @Type(() => RatingsDto)
  ratings: RatingsDto;
}

export class GuidanceDto {
  @IsOptional()
  @IsString()
  AR?: string;

  @IsOptional()
  @IsString()
  FR?: string;

  @IsOptional()
  @IsString()
  EN?: string;

  @IsOptional()
  @IsString()
  ES?: string;

  @IsOptional()
  @IsString()
  IT?: string;

  @IsOptional()
  @IsString()
  DE?: string;

  @IsOptional()
  @IsString()
  TR?: string;
}

export class GuidanceRangeConfigDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @ValidateNested()
  @Type(() => GuidanceDto)
  guidance: GuidanceDto;
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingRangeConfigDto)
  customRatings?: RatingRangeConfigDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuidanceRangeConfigDto)
  customGuidance?: GuidanceRangeConfigDto[];
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingRangeConfigDto)
  customRatings?: RatingRangeConfigDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuidanceRangeConfigDto)
  customGuidance?: GuidanceRangeConfigDto[];
}

export class BulkApplySettingsDto {
  @ValidateIf((o) => !o.applyToAllClasses)
  @IsArray({ message: 'classIds is required when applyToAllClasses is false' })
  @IsNumber({}, { each: true })
  classIds?: number[];

  @IsOptional()
  @IsBoolean()
  applyToAllClasses?: boolean;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingRangeConfigDto)
  customRatings?: RatingRangeConfigDto[];

  @IsOptional()
  @IsString()
  @IsIn(['AR', 'FR', 'EN', 'ES', 'IT', 'DE', 'TR'])
  ratingsLanguage?: LanguageCode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuidanceRangeConfigDto)
  customGuidance?: GuidanceRangeConfigDto[];

  @IsOptional()
  @IsString()
  @IsIn(['AR', 'FR', 'EN', 'ES', 'IT', 'DE', 'TR'])
  guidanceLanguage?: LanguageCode;
}

