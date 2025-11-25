import { PartialType } from '@nestjs/mapped-types';
import { CreateLabSoftwareDto } from './create-lab-software.dto';

export class UpdateLabSoftwareDto extends PartialType(CreateLabSoftwareDto) {}


