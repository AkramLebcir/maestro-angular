import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Class } from '../classes/class.entity';
import { Lab } from '../labs/lab.entity';
import { SeatAssignment } from './seat-assignment.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('workstations')
export class Workstation extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'int', default: 1 })
  positionIndex: number;

  @Column({ type: 'varchar', length: 32, default: 'u-default' })
  layoutPreset: string;

  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  zone: string;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: number;

  @ManyToOne(() => Lab, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @Column({ nullable: true })
  labId: number;

  @OneToMany(() => SeatAssignment, (assignment) => assignment.workstation)
  assignments: SeatAssignment[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}


