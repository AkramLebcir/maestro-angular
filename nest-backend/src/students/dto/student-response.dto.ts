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
  classId?: number;
  class?: {
    id: number;
    name: string;
    level: string;
    subject: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

