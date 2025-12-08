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
import { ClassroomLayout } from './classroom-layout.entity';
import { DeskAssignment } from './desk-assignment.entity';

@Entity('desks')
export class Desk {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ClassroomLayout, (layout) => layout.desks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'layoutId' })
  layout: ClassroomLayout;

  @Column()
  layoutId: number;

  @Column({ type: 'int' })
  row: number; // رقم الصف (1, 2, 3, 4)

  @Column({ type: 'int' })
  column: number; // رقم العمود في الصف

  @Column({ type: 'int', default: 1 })
  capacity: number; // سعة الجلوس (1 للفردية، 2 للمزدوجة)

  @Column({ type: 'float', default: 0 })
  x: number; // الموضع الأفقي (نسبة مئوية)

  @Column({ type: 'float', default: 0 })
  y: number; // الموضع العمودي (نسبة مئوية)

  @Column({ type: 'varchar', length: 50, nullable: true })
  label: string; // تسمية الطاولة (مثل: "طاولة 1-1")

  @OneToMany(() => DeskAssignment, (assignment) => assignment.desk, {
    cascade: true,
  })
  assignments: DeskAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}





