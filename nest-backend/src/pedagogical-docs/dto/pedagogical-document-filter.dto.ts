import { IsIn, IsOptional, IsString } from 'class-validator';
import { PedagogicalDocType } from '../pedagogical-document.entity';

export class PedagogicalDocumentFilterDto {
  @IsString()
  @IsOptional()
  level?: string;

  @IsIn(['lesson_plan', 'progression', 'curriculum', 'textbook'], {
    message: 'Invalid document type',
  })
  @IsOptional()
  type?: PedagogicalDocType;
}


