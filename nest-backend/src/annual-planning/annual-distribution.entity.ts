import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('annual_distribution')
export class AnnualDistribution {
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

  @Column({ type: 'text', nullable: true })
  notes?: string;
}


