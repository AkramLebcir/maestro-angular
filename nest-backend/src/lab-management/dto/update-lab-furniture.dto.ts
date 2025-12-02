import { PartialType } from '@nestjs/mapped-types';
import { CreateLabFurnitureDto } from './create-lab-furniture.dto';

export class UpdateLabFurnitureDto extends PartialType(CreateLabFurnitureDto) {}





