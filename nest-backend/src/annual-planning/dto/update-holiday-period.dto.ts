import { PartialType } from '@nestjs/mapped-types';
import { CreateHolidayPeriodDto } from './create-holiday-period.dto';

export class UpdateHolidayPeriodDto extends PartialType(CreateHolidayPeriodDto) {}










