import { IsString, IsOptional } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;
}


