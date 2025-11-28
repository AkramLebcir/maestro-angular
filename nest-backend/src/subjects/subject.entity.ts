import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Class } from '../classes/class.entity';
import { AnnualDistribution } from '../annual-planning/annual-distribution.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('subjects')
export class Subject extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // اسم المادة بالعربية
  @Column()
  nameAr: string;

  // المستوى (مثال: 1st_year_high أو نص حر)
  @Column()
  level: string;

  // العدد الكلي للدروس السنوية
  @Column({ type: 'int' })
  totalLessons: number;

  @OneToMany(() => Class, (cls) => cls.subjectRef)
  classes: Class[];

  @OneToMany(() => AnnualDistribution, (dist) => dist.subject)
  annualDistributions: AnnualDistribution[];
}


