import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabDeviceLogDto {
  @IsOptional()
  labId?: number;

  @IsString()
  @IsNotEmpty()
  teacherName: string;

  @IsString()
  @IsNotEmpty()
  equipmentType: string;

  @IsString()
  @IsNotEmpty()
  inventoryNumber: string;

  @IsDateString()
  exitDate: string;

  @IsOptional()
  @IsString()
  exitStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  teacherSignatureOut?: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  returnStatus?: string;

  @IsOptional()
  @IsString()
  teacherSignatureIn?: string;
}









