export class StudentResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  studentNumber?: string;
  idNumber?: string;
  dateOfBirth?: Date | string;
  placeOfBirth?: string;
  gender?: 'male' | 'female';
  isRepeater?: boolean;
  studentId?: string;
  photo?: string;
  generalNotes?: string;
  specialCases?: Array<{
    category: 'health' | 'exemption' | 'learning_difficulty';
    details: string;
    requiredAction: string;
    attachments?: string[];
    startDate?: string;
    endDate?: string;
  }> | null;
  classId?: number;
  group?: 1 | 2 | null;
  class?: {
    id: number;
    name: string;
    level: string;
    subject: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

