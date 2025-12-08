import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../classes/class.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

export type BaseColumnKey = 'notebook_correction' | 'duty' | 'attendance' | 'behavior';

export interface CustomAssessmentColumn {
  id?: string;
  name: string;
  maxScore: number;
}

export interface BaseColumnConfig {
  key: BaseColumnKey;
  label?: string;
  visible?: boolean;
}

export type LanguageCode = 'AR' | 'FR' | 'EN' | 'ES' | 'IT' | 'DE' | 'TR';

export interface RatingRangeConfig {
  min: number;
  max?: number; // undefined means infinity
  ratings: {
    AR?: string;
    FR?: string;
    EN?: string;
    ES?: string;
    IT?: string;
    DE?: string;
    TR?: string;
  };
}

export interface GuidanceRangeConfig {
  min: number;
  max?: number; // undefined means infinity
  guidance: {
    AR?: string;
    FR?: string;
    EN?: string;
    ES?: string;
    IT?: string;
    DE?: string;
    TR?: string;
  };
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

  // Base Column Configuration (labels + visibility overrides)
  @Column({ type: 'json', nullable: true })
  baseColumnSettings: BaseColumnConfig[];

  // Oral Expression/Practical Work
  @Column({ type: 'boolean', default: true })
  includeOralExpression: boolean;
  @Column({ type: 'boolean', default: false })
  autoFillOralExpressionFromSeating: boolean;

  // Custom Ratings Configuration
  @Column({ type: 'json', nullable: true })
  customRatings: RatingRangeConfig[];

  // Custom Guidance Configuration
  @Column({ type: 'json', nullable: true })
  customGuidance: GuidanceRangeConfig[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

