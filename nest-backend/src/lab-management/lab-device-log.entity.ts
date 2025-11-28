import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lab } from '../labs/lab.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('lab_device_logs')
export class LabDeviceLog extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Lab, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab?: Lab;

  @Column({ nullable: true })
  labId?: number;

  @Column()
  teacherName: string;

  @Column()
  equipmentType: string;

  @Column()
  inventoryNumber: string;

  @Column({ type: 'date' })
  exitDate: string;

  @Column({ nullable: true })
  exitStatus?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  teacherSignatureOut?: string;

  @Column({ type: 'date', nullable: true })
  returnDate?: string;

  @Column({ nullable: true })
  returnStatus?: string;

  @Column({ nullable: true })
  teacherSignatureIn?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}


