import { PartialType } from '@nestjs/mapped-types';
import { CreateLabCleaningDto } from './create-lab-cleaning.dto';

export class UpdateLabCleaningDto extends PartialType(CreateLabCleaningDto) {}



