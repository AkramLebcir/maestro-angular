import { IsString, IsOptional, IsDateString, IsEnum, IsArray, IsInt } from 'class-validator';
import { EventParticipationType } from '../club-event.entity';

export class CreateClubEventDto {
  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  organizer?: string;

  @IsOptional()
  @IsEnum(EventParticipationType)
  participationType?: EventParticipationType;

  @IsOptional()
  @IsString()
  results?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsString()
  report?: string;
}

