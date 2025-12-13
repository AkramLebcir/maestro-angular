import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  planId: number;

  @IsString()
  @IsOptional()
  notes?: string;
}








