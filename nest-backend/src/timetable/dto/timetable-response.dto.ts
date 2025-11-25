export class TimetableResponseDto {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  classId: number;
  class?: {
    id: number;
    name: string;
  };
  labId?: number;
  lab?: {
    id: number;
    name: string;
  };
  classroom?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}


