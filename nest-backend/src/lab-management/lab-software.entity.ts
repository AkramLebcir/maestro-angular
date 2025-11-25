import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lab } from '../labs/lab.entity';

@Entity('lab_software')
export class LabSoftware {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Lab, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab?: Lab;

  @Column({ nullable: true })
  labId?: number;

  @Column()
  programName: string;

  @Column({ nullable: true })
  version?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}


