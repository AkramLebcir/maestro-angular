import { PartialType } from '@nestjs/mapped-types';
import { CreateLabEquipmentDto } from './create-lab-equipment.dto';

export class UpdateLabEquipmentDto extends PartialType(CreateLabEquipmentDto) {}




