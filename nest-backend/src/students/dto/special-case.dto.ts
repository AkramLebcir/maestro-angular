import { IsEnum, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SpecialCaseDto {
  @IsEnum(['health', 'exemption', 'learning_difficulty'], {
    message: 'Category must be health, exemption, or learning_difficulty',
  })
  category: 'health' | 'exemption' | 'learning_difficulty';

  @IsString()
  details: string;

  @IsString()
  requiredAction: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

