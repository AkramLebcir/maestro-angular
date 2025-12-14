import { IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';
import { TableType } from '../entities/classroom-layout.entity';

export class CreateLayoutDto {
  @IsNumber()
  classId: number;

  @IsNumber()
  rows: number; // 3 أو 4

  @IsEnum(TableType)
  tableType: TableType;

  @IsObject()
  @IsOptional()
  settings?: {
    spacing?: number;
    margin?: number;
  };
}









