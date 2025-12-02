import { ClassLevel } from '../class.entity';

export class ClassResponseDto {
  id: number;
  level: ClassLevel;
  name: string;
  subject: string;
  labId?: number;
  lab?: {
    id: number;
    name: string;
    location?: string;
  };
  weeklySessions: number;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}





