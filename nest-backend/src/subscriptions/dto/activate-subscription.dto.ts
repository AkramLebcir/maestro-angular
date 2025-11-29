import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ActivateSubscriptionDto {
  @IsDateString()
  @IsOptional()
  startDate?: string; // إذا لم يتم تحديده، سيتم استخدام التاريخ الحالي

  @IsString()
  @IsOptional()
  notes?: string;
}

