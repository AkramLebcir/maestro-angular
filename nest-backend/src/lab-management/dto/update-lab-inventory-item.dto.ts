import { PartialType } from '@nestjs/mapped-types';
import { CreateLabInventoryItemDto } from './create-lab-inventory-item.dto';

export class UpdateLabInventoryItemDto extends PartialType(CreateLabInventoryItemDto) {}




