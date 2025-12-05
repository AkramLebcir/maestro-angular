import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateClubDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

