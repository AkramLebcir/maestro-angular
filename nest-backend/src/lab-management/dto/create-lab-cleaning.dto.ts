import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabCleaningDto {
  @IsOptional()
  labId?: number;

  @IsString()
  @IsNotEmpty()
  deviceCleanliness: string;

  @IsString()
  @IsNotEmpty()
  desktopCleanliness: string;

  @IsString()
  @IsNotEmpty()
  roomCleanliness: string;

  @IsString()
  @IsNotEmpty()
  wiringStatus: string;

  @IsOptional()
  @IsDateString()
  checkDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}






