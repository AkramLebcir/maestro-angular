import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTopicElementDto {
  @IsString()
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topicId?: number; // Optional since it comes from URL parameter

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

