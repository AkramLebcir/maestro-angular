import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('holiday_period')
export class HolidayPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: string; // e.g. "2024-2025"

  @Column()
  name: string; // e.g. "عطلة الخريف"

  @Column()
  type: string; // e.g. "HOLIDAY", "EXAM", "RELIGIOUS", "NATIONAL"

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}


