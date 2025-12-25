import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateBehaviorDto {
  @IsString()
  name: string;

  @IsString()
  nameAr: string;

  @IsEnum(['positive', 'negative'])
  type: 'positive' | 'negative';

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  points?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

