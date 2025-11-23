import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TopicElement } from './topic-element.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => TopicElement, (element) => element.topic, { cascade: true })
  elements: TopicElement[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

