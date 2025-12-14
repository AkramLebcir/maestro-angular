import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subscription } from './subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending', // قيد الانتظار
  COMPLETED = 'completed', // مكتمل
  FAILED = 'failed', // فشل
  REFUNDED = 'refunded', // مسترد
}

export enum PaymentMethod {
  MANUAL = 'manual', // دفع يدوي/تحويل بنكي
  CARD = 'card', // بطاقة ذهبية
  OTHER = 'other', // أخرى
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Subscription, (subscription) => subscription.payments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column()
  subscriptionId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // المبلغ بالدينار الجزائري

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.MANUAL,
  })
  method: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  transactionId: string; // رقم المعاملة (من بوابة الدفع أو رقم التحويل)

  @Column({ type: 'text', nullable: true })
  receiptNumber: string; // رقم الإيصال

  @Column({ type: 'text', nullable: true })
  notes: string; // ملاحظات (مثل رقم الحساب البنكي للتحويل)

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date; // تاريخ الدفع الفعلي

  @Column({ type: 'jsonb', nullable: true })
  paymentGatewayData: Record<string, unknown>; // بيانات إضافية من بوابة الدفع

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}









