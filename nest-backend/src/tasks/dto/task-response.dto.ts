export class TaskResponseDto {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  dueDate?: Date;
  reminderText?: string;
  createdAt: Date;
  updatedAt: Date;
}

