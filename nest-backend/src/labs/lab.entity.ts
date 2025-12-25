import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Class } from '../classes/class.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('labs')
export class Lab extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @OneToMany(() => Class, (classEntity) => classEntity.lab)
  classes: Class[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}


