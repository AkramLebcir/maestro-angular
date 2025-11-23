export class TopicResponseDto {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  elements?: Array<{
    id: number;
    content: string;
    order: number;
  }>;
}

export class CourseEntryResponseDto {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  notebookId: number;
  topicId?: number;
  topic?: TopicResponseDto;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

