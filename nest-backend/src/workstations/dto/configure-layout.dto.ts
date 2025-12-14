import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ConfigureLayoutDto {
  @Type(() => Number)
  @IsInt()
  classId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalStations?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}










