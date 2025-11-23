export class CourseEntryResponseDto {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  notebookId: number;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

