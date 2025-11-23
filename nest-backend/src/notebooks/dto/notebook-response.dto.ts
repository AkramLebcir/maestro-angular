export class NotebookResponseDto {
  id: number;
  title: string;
  description?: string;
  content?: string;
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

