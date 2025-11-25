import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Lab } from '../labs/lab.entity';
import { Student } from '../students/student.entity';

export enum ClassLevel {
  FIRST_YEAR_MIDDLE = '1st_year_middle',
  SECOND_YEAR_MIDDLE = '2nd_year_middle',
  THIRD_YEAR_MIDDLE = '3rd_year_middle',
  FOURTH_YEAR_MIDDLE = '4th_year_middle',
  FIRST_YEAR_HIGH = '1st_year_high',
  SECOND_YEAR_HIGH = '2nd_year_high',
  THIRD_YEAR_HIGH = '3rd_year_high',
}

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ClassLevel,
  })
  level: ClassLevel;

  @Column()
  name: string;

  @Column()
  subject: string;

  @ManyToOne(() => Lab, (lab) => lab.classes, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @Column({ nullable: true })
  labId: number;

  @Column({ type: 'int', default: 0 })
  weeklySessions: number;

  @OneToMany(() => Student, (student) => student.class)
  students: Student[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}


