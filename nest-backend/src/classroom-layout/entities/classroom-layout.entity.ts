import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Class } from '../../classes/class.entity';
import { TenantOwnedEntity } from '../../common/entities/tenant-owned.entity';
import { Desk } from './desk.entity';

export enum TableType {
  SINGLE = 'single', // طاولة فردية
  DOUBLE = 'double', // طاولة مزدوجة
}

@Entity('classroom_layouts')
export class ClassroomLayout extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: number;

  @Column({ type: 'int' })
  rows: number; // عدد الصفوف (3 أو 4)

  @Column({
    type: 'enum',
    enum: TableType,
    default: TableType.SINGLE,
  })
  tableType: TableType; // نوع الطاولة

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    spacing?: number; // المسافة بين الطاولات
    margin?: number; // الهوامش
  };

  @OneToMany(() => Desk, (desk) => desk.layout, { cascade: true })
  desks: Desk[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



