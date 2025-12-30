export class BehaviorResponseDto {
  id: number;
  name: string;
  nameAr: string;
  type: 'positive' | 'negative';
  icon?: string;
  points: number;
  color?: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}






