export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: string;
  gender: 'male' | 'female';
  isRepeater: boolean;
  classId?: string;
  className?: string;
  idNumber?: string;
  studentNumber?: string;
  group?: string;
  email?: string;
  parentEmail?: string;
  parentPhone?: string;
  schoolId?: string;
  notes?: string;
  photo?: string; // URL to student photo
}




