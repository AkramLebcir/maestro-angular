import { EventParticipationType } from '../club-event.entity';

export class ClubEventResponseDto {
  id: number;
  name: string;
  date: Date;
  organizer?: string;
  participationType?: EventParticipationType;
  results?: string;
  photos?: string[];
  videos?: string[];
  report?: string;
  clubId: number;
  createdAt: Date;
  updatedAt: Date;
}

