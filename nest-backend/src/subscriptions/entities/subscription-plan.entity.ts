import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

export enum PlanType {
  SEMESTER = 'semester', // فصل دراسي (3 أشهر)
  ANNUAL = 'annual', // سنة دراسية (12 شهر)
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // اسم الباقة بالعربية

  @Column()
  nameEn: string; // اسم الباقة بالإنجليزية

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  type: PlanType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // السعر بالدينار الجزائري

  @Column({ type: 'int' })
  durationMonths: number; // المدة بالأشهر

  @Column({ default: true })
  isActive: boolean; // هل الباقة نشطة ومتاحة للشراء

  @Column({ type: 'text', nullable: true })
  description: string; // وصف الباقة

  @Column({ type: 'text', nullable: true })
  descriptionEn: string; // وصف الباقة بالإنجليزية

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}




