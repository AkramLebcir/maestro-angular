import { StudentResponseDto } from '../../students/dto/student-response.dto';

export class ClubMemberResponseDto {
  id: number;
  clubId: number;
  studentId: number;
  student?: StudentResponseDto;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

