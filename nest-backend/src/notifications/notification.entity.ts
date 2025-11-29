import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

export type NotificationType =
  | 'upcoming_assessment'
  | 'upcoming_holiday'
  | 'incomplete_task'
  | 'upcoming_seminar'
  | 'upcoming_visit'
  | 'subscription_expiring';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

@Entity('notifications')
export class Notification extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: ['upcoming_assessment', 'upcoming_holiday', 'incomplete_task', 'upcoming_seminar', 'upcoming_visit', 'subscription_expiring']
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  })
  priority: NotificationPriority;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  relatedEntityId?: number; // ID of related entity (grade, holiday, notebook, etc.)

  @Column({ nullable: true })
  relatedEntityType?: string; // Type of related entity

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Additional data

  @Column({ type: 'date', nullable: true })
  dueDate?: string; // Date when the notification becomes relevant

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
