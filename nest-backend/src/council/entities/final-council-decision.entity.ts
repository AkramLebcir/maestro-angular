import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from '../../students/student.entity';
import { Class } from '../../classes/class.entity';
import { TenantOwnedEntity } from '../../common/entities/tenant-owned.entity';

@Entity('final_council_decisions')
export class FinalCouncilDecision extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: number;

  // معدل الفصل الأول
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  term1Average: number;

  // معدل الفصل الثاني
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  term2Average: number;

  // معدل الفصل الثالث
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  term3Average: number;

  // المعدل السنوي (محسوب تلقائياً)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  annualAverage: number;

  // القرار النهائي
  @Column({ 
    type: 'enum', 
    enum: ['pass', 'repeat', 'remedial', 'redirect', 'vocational_redirect'], 
    nullable: true 
  })
  finalDecision: string;

  // إمكانية التعديل اليدوي
  @Column({ type: 'boolean', default: false })
  isManualDecision: boolean;

  // ملاحظات إضافية
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

