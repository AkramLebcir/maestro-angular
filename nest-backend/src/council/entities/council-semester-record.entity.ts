import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from '../../students/student.entity';
import { Class } from '../../classes/class.entity';
import { TenantOwnedEntity } from '../../common/entities/tenant-owned.entity';

@Entity('council_semester_records')
export class CouncilSemesterRecord extends TenantOwnedEntity {
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

  @Column({ type: 'int' })
  term: number; // 1, 2, or 3

  // معدل الأستاذ (محسوب تلقائياً من النقاط)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  teacherAverage: number;

  // معدل الفصل (يدخله الأستاذ يدوياً)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  semesterAverage: number;

  // تقييم السلوك (1-5 نجوم)
  @Column({ type: 'int', nullable: true })
  behaviorRating: number;

  // تقييم الغيابات
  @Column({ type: 'int', nullable: true })
  absencesCount: number;

  @Column({ type: 'enum', enum: ['disciplined', 'average', 'frequent'], nullable: true })
  absencesLevel: string;

  // الإجازات
  @Column({ 
    type: 'enum', 
    enum: ['excellence', 'congratulation', 'encouragement', 'honor_roll', 'none'], 
    nullable: true 
  })
  award: string;

  // ملاحظات مجلس القسم
  @Column({ type: 'text', nullable: true })
  councilNotes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}



