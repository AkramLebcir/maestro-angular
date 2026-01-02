import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../classes/class.entity';
import { Topic } from '../topics/topic.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('daily_journal_entries')
export class DailyJournalEntry extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string; // Format: YYYY-MM-DD

  @Column({ type: 'time' })
  startTime: string; // Format: HH:mm

  @Column({ type: 'time' })
  endTime: string; // Format: HH:mm

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class?: Class;

  @Column()
  classId: number;

  @Column({ nullable: true })
  level?: string;

  @Column({ nullable: true })
  section?: string;

  @ManyToOne(() => Topic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'topicId' })
  topic?: Topic;

  @Column({ nullable: true })
  topicId?: number;

  @Column({ nullable: true })
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  activity?: string;

  @Column({ type: 'text', nullable: true })
  homework?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

