import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../classes/class.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('students')
export class Student extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  studentNumber: string;

  @Column({ nullable: true })
  idNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  placeOfBirth: string;

  @Column({ type: 'enum', enum: ['male', 'female'], nullable: true })
  gender: 'male' | 'female';

  @Column({ type: 'boolean', default: false, nullable: true })
  isRepeater: boolean;

  @Column({ nullable: true })
  studentId: string;

  @Column({ type: 'text', nullable: true })
  photo: string;

  @Column({ type: 'text', nullable: true })
  generalNotes: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.students, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column({ nullable: true })
  classId: number;

  @Column({ type: 'int', nullable: true })
  group: 1 | 2 | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

