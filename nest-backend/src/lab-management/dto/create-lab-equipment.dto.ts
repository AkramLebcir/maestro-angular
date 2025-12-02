import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLabEquipmentDto {
  @IsOptional()
  labId?: number;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsInt()
  @Min(0)
  totalCount: number;

  @IsInt()
  @Min(0)
  workingCount: number;

  @IsInt()
  @Min(0)
  notWorkingCount: number;
}





