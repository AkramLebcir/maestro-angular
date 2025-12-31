import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('tasks')
export class Task extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  category?: string; // تحضير مذكرة، تصحيح أوراق، صب النقاط في الرقمية، ندوة تربوية

  @Column({ type: 'date', nullable: true })
  dueDate?: Date; // تاريخ الاستحقاق للتنبيهات

  @Column({ type: 'text', nullable: true })
  reminderText?: string; // نص التنبيه (مثل: تنبيه قبل موعد "اجتماع مجلس الأقسام")

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

