import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../classes/class.entity';
import { Lab } from '../labs/lab.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('timetable')
export class Timetable extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Column({ type: 'time' })
  startTime: string; // Format: "HH:mm"

  @Column({ type: 'time' })
  endTime: string; // Format: "HH:mm"

  @Column()
  subject: string;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: number;

  @ManyToOne(() => Lab, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @Column({ nullable: true })
  labId: number;

  @Column({ nullable: true })
  classroom: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}


