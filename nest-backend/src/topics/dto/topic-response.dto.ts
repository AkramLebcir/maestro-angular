import { TopicElementResponseDto } from './topic-element-response.dto';

export class TopicResponseDto {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  elements?: TopicElementResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}


