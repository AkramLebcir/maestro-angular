import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type PedagogicalDocType =
  | 'lesson_plan'
  | 'progression'
  | 'curriculum'
  | 'textbook';

@Entity('pedagogical_documents')
export class PedagogicalDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ['lesson_plan', 'progression', 'curriculum', 'textbook'],
  })
  type: PedagogicalDocType;

  @Column()
  level: string;

  @Column({ nullable: true })
  subject?: string;

  @Column()
  originalFileName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}


