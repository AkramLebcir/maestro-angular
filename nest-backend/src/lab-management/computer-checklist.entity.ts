import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lab } from '../labs/lab.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('computer_checklists')
export class ComputerChecklist extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Lab, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab?: Lab;

  @Column({ nullable: true })
  labId?: number;

  @Column({ type: 'int' })
  deviceNumber: number;

  // Hardware components
  @Column({ default: false })
  hasSystemUnit: boolean;

  @Column({ default: false })
  hasMonitor: boolean;

  @Column({ default: false })
  hasMouse: boolean;

  @Column({ default: false })
  hasKeyboard: boolean;

  @Column({ default: false })
  hasCabling: boolean;

  @Column({ default: false })
  isClean: boolean;

  // Software components
  @Column({ default: false })
  osInstalled: boolean;

  @Column({ default: false })
  officeInstalled: boolean;

  @Column({ default: false })
  netSupportInstalled: boolean;

  @Column({ default: false })
  desktopCleaned: boolean;

  @Column({ default: false })
  antivirusInstalled: boolean;

  @Column({ type: 'date', nullable: true })
  lastCheckDate?: string;

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


