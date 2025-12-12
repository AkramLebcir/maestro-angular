import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabInventoryItemDto {
  @IsOptional()
  labId?: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  inventoryNumber: string;
}








