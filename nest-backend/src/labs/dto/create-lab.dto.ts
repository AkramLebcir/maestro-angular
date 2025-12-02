import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateLabDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}





