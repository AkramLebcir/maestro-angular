import { ClubMemberResponseDto } from './club-member-response.dto';
import { ClubEventResponseDto } from './club-event-response.dto';

export class ClubResponseDto {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  members?: ClubMemberResponseDto[];
  events?: ClubEventResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

