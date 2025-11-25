import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lab } from '../labs/lab.entity';

@Entity('lab_cleaning')
export class LabCleaning {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Lab, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab?: Lab;

  @Column({ nullable: true })
  labId?: number;

  @Column({ default: 'good' })
  deviceCleanliness: string;

  @Column({ default: 'good' })
  desktopCleanliness: string;

  @Column({ default: 'good' })
  roomCleanliness: string;

  @Column({ default: 'complete' })
  wiringStatus: string;

  @Column({ type: 'date', nullable: true })
  checkDate?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}


