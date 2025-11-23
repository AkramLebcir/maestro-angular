import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notebook } from './notebook.entity';
import { Topic } from '../topics/topic.entity';

@Entity('course_entries')
export class CourseEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @ManyToOne(() => Notebook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notebookId' })
  notebook?: Notebook;

  @Column()
  notebookId: number;

  @ManyToOne(() => Topic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'topicId' })
  topic?: Topic;

  @Column({ nullable: true })
  topicId?: number;

  @Column({ nullable: true })
  order?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

