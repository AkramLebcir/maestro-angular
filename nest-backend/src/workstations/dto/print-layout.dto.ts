import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  ArrayNotEmpty,
  IsString,
} from 'class-validator';

export class PrintLayoutDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group?: number;

  @IsOptional()
  @IsBoolean()
  includeBothGroups?: boolean;

  @IsOptional()
  @IsBoolean()
  includeAllClasses?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  workstationIds?: number[];

  @IsOptional()
  @IsString()
  workstationLabel?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  workstationLabels?: string[];
}


