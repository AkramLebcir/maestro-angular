import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

class WorkstationPositionInput {
  @Type(() => Number)
  @IsInt()
  workstationId: number;

  @Type(() => Number)
  @IsNumber()
  x: number;

  @Type(() => Number)
  @IsNumber()
  y: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  positionIndex?: number;

  @IsOptional()
  @IsString()
  zone?: string;
}

export class UpdateWorkstationPositionsDto {
  @Type(() => Number)
  @IsInt()
  classId: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WorkstationPositionInput)
  positions: WorkstationPositionInput[];
}


