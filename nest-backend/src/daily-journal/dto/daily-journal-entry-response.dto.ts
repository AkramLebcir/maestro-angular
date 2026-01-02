import { Class } from '../../classes/class.entity';
import { Topic } from '../../topics/topic.entity';

export class DailyJournalEntryResponseDto {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  classId: number;
  class?: {
    id: number;
    name: string;
    level: string;
    subject?: string;
    section?: string;
  };
  level?: string;
  section?: string;
  topicId?: number;
  topic?: {
    id: number;
    title: string;
    subtitle?: string;
    description?: string;
  };
  subtitle?: string;
  activity?: string;
  homework?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

