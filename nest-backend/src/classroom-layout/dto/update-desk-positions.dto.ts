import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DeskPosition {
  @IsNumber()
  deskId: number;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class UpdateDeskPositionsDto {
  @IsNumber()
  classId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeskPosition)
  positions: DeskPosition[];
}









