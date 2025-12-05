import { PartialType } from '@nestjs/mapped-types';
import { CreateClubEventDto } from './create-club-event.dto';

export class UpdateClubEventDto extends PartialType(CreateClubEventDto) {}

