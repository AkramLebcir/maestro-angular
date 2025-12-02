import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Desk } from './desk.entity';
import { Student } from '../../students/student.entity';
import { TenantOwnedEntity } from '../../common/entities/tenant-owned.entity';

export enum SeatPosition {
  LEFT = 'left', // يسار (للطاولة المزدوجة)
  RIGHT = 'right', // يمين (للطاولة المزدوجة)
  CENTER = 'center', // وسط (للطاولة الفردية)
}

@Entity('desk_assignments')
export class DeskAssignment extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Desk, (desk) => desk.assignments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deskId' })
  desk: Desk;

  @Column()
  deskId: number;

  @ManyToOne(() => Student, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @Column({
    type: 'enum',
    enum: SeatPosition,
    default: SeatPosition.CENTER,
  })
  seatPosition: SeatPosition; // موضع الجلوس (يسار/يمين/وسط)

  @Column({ type: 'int' })
  classId: number;

  @CreateDateColumn()
  assignedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}




