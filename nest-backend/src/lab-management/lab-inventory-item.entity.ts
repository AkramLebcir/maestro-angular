import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lab } from '../labs/lab.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('lab_inventory_items')
export class LabInventoryItem extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Lab, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labId' })
  lab?: Lab;

  @Column({ nullable: true })
  labId?: number;

  @Column()
  category: string;

  @Column()
  label: string;

  @Column()
  inventoryNumber: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}


