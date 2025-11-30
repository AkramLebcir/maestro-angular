import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnnualDistributionDto {
  @IsString()
  @IsNotEmpty()
  year: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsString()
  @IsNotEmpty()
  track: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  term: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  weekNumber: number;

  @IsDateString()
  yearStartDate: string;

  @IsString()
  @IsNotEmpty()
  unitTitle: string;

  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsOptional()
  @IsString()
  notes?: string;
}



