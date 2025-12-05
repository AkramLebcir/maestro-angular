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
  customAssessmentId?: string;
  classId: number;
  class?: {
    id: number;
    name: string;
  };
  term?: number; // 1, 2, or 3
  score: number;
  maxScore: number;
  date: string;
  notes?: string;
  mark?: string;
  createdAt: Date;
  updatedAt: Date;
}

