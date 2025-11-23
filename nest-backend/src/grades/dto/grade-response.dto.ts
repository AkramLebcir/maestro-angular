export class GradeResponseDto {
  id: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    gender?: 'male' | 'female';
  };
  assessmentId: number;
  classId: number;
  class?: {
    id: number;
    name: string;
  };
  score: number;
  maxScore: number;
  date: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

