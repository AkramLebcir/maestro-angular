import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Workstation } from './workstation.entity';
import { Student } from '../students/student.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export enum BehaviorStatus {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

@Entity('seat_assignments')
export class SeatAssignment extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workstation, (workstation) => workstation.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workstationId' })
  workstation: Workstation;

  @Column()
  workstationId: number;

  @ManyToOne(() => Student, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @Column({ type: 'int' })
  classId: number;

  @Column({ type: 'int', nullable: true })
  labId: number | null;

  @Column({ type: 'int', default: 1 })
  group: number;

  @Column({ type: 'int', default: 0 })
  seatIndex: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  attendanceStatus: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: BehaviorStatus,
    default: BehaviorStatus.NEUTRAL,
  })
  behaviorStatus: BehaviorStatus;

  @Column({ type: 'text', nullable: true })
  behaviorNotes?: string;

  @Column({ type: 'float', nullable: true })
  quickGrade?: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}


