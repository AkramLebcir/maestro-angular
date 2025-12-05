import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../classes/class.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

export interface CustomAssessmentColumn {
  id?: string;
  name: string;
  maxScore: number;
}

@Entity('grading_settings')
export class GradingSettings extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: number;

  // Notebook Correction Settings
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  notebookCorrectionMaxScore: number;

  // Duty (Homework) Settings
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  dutyMaxScore: number;

  // Attendance Settings
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  attendanceMaxScore: number;
  @Column({ type: 'boolean', default: true })
  attendanceAutoApply: boolean;

  // Behavior Settings
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  behaviorMaxScore: number;
  @Column({ type: 'boolean', default: true })
  behaviorAutoApply: boolean;

  // Custom Assessment Columns
  @Column({ type: 'json', nullable: true })
  customAssessmentColumns: CustomAssessmentColumn[];

  // Oral Expression/Practical Work
  @Column({ type: 'boolean', default: true })
  includeOralExpression: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

