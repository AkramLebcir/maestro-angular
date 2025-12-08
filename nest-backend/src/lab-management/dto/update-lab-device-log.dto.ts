import { PartialType } from '@nestjs/mapped-types';
import { CreateLabDeviceLogDto } from './create-lab-device-log.dto';

export class UpdateLabDeviceLogDto extends PartialType(CreateLabDeviceLogDto) {}






