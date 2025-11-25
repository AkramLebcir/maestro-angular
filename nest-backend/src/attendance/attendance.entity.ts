import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'left_early' | 'unrecorded';

@Entity('attendance')
export class Attendance {
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

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late', 'excused', 'left_early', 'unrecorded'],
    default: 'unrecorded',
  })
  status: AttendanceStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  lessonTime?: string; // Format: HH:mm-HH:mm (e.g., "08:00-09:00")

  @Column({ type: 'varchar', length: 255, nullable: true })
  lessonSubject?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}


