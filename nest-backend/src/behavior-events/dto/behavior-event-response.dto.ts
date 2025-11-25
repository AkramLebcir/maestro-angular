export class BehaviorEventResponseDto {
  id: number;
  studentId: number;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    photo?: string;
  };
  behaviorId: number;
  date: Date | string;
  description?: string;
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}


