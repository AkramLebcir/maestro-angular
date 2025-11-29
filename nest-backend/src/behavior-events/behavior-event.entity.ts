import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('behavior_events')
export class BehaviorEvent extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @Column()
  behaviorId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true, default: 'BEHAVIORAL' })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column({ nullable: true })
  classId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}


