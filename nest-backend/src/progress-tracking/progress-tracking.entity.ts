import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../classes/class.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('progress_tracking')
export class ProgressTracking extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Class, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: number;

  // يمكن ربطه لاحقاً بجدول أساتذة حقيقي
  @Column({ type: 'int', nullable: true })
  teacherId?: number;

  // رقم آخر درس تم إنجازه
  @Column({ type: 'int', default: 0 })
  lastLessonReached: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateDate: Date;
}


