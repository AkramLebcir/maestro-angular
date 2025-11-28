import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Subject } from '../subjects/subject.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('annual_distribution')
export class AnnualDistribution extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: string; // e.g. "2024-2025"

  @Column()
  level: string; // e.g. "أولى ثانوي"

  @Column()
  track: string; // e.g. "جذع مشترك علوم وتكنولوجيا"

  @Column({ type: 'int' })
  term: number; // 1, 2, 3

  @Column({ type: 'int' })
  weekNumber: number; // logical week index (1, 2, ...)

  @Column({ type: 'date' })
  yearStartDate: string; // reference start date for the school year

  @Column()
  unitTitle: string; // e.g. "تهيئات عامة"

  @Column()
  domain: string; // e.g. "الوحدة الخامسة"

  // رقم الدرس في المنهاج (لدعم حساب التقدم)
  @Column({ type: 'int', nullable: true })
  lessonNumber?: number;

  // ربط اختياري بمادة محددة
  @ManyToOne(() => Subject, (subject) => subject.annualDistributions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subjectId' })
  subject?: Subject;

  @Column({ nullable: true })
  subjectId?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}


