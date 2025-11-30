import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateComputerChecklistDto {
  @IsOptional()
  labId?: number;

  @IsInt()
  @Min(1)
  deviceNumber: number;

  @IsBoolean()
  hasSystemUnit: boolean;

  @IsBoolean()
  hasMonitor: boolean;

  @IsBoolean()
  hasMouse: boolean;

  @IsBoolean()
  hasKeyboard: boolean;

  @IsBoolean()
  hasCabling: boolean;

  @IsBoolean()
  isClean: boolean;

  @IsBoolean()
  osInstalled: boolean;

  @IsBoolean()
  officeInstalled: boolean;

  @IsBoolean()
  netSupportInstalled: boolean;

  @IsBoolean()
  desktopCleaned: boolean;

  @IsBoolean()
  antivirusInstalled: boolean;

  @IsOptional()
  @IsDateString()
  lastCheckDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;
}



