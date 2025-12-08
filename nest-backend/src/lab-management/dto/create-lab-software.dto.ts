import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabSoftwareDto {
  @IsOptional()
  labId?: number;

  @IsString()
  @IsNotEmpty()
  programName: string;

  @IsOptional()
  @IsString()
  version?: string;
}






