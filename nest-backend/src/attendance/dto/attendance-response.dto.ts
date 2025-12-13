export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'left_early' | 'unrecorded';

export class AttendanceResponseDto {
  id: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    photo?: string;
    gender?: 'male' | 'female';
  };
  classId: number;
  class?: {
    id: number;
    name: string;
  };
  date: Date | string;
  status: AttendanceStatus;
  lessonTime?: string;
  lessonSubject?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}









