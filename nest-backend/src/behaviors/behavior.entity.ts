import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('behaviors')
export class Behavior extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  nameAr: string;

  @Column({ type: 'enum', enum: ['positive', 'negative'] })
  type: 'positive' | 'negative';

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  points: number;

  @Column({ type: 'varchar', nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

