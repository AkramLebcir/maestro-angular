import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PedagogicalDocType } from '../pedagogical-document.entity';

export class CreatePedagogicalDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['lesson_plan', 'progression', 'curriculum', 'textbook'])
  type: PedagogicalDocType;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsString()
  @IsOptional()
  subject?: string;
}


