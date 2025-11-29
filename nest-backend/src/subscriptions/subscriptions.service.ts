import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { SubscriptionPlan, PlanType } from './entities/subscription-plan.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly plansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // ========== Subscription Plans ==========

  async createPlan(createPlanDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    // Ensure price is properly converted to number
    const planData = {
      ...createPlanDto,
      price: Number(createPlanDto.price),
      durationMonths: Number(createPlanDto.durationMonths),
    };
    const plan = this.plansRepository.create(planData);
    return this.plansRepository.save(plan);
  }

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return this.plansRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActivePlans(): Promise<SubscriptionPlan[]> {
    return this.plansRepository.find({
      where: { isActive: true },
      order: { durationMonths: 'ASC' },
    });
  }

  async findPlanById(id: number): Promise<SubscriptionPlan> {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return plan;
  }

  async updatePlan(id: number, updatePlanDto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findPlanById(id);
    Object.assign(plan, updatePlanDto);
    return this.plansRepository.save(plan);
  }

  async deletePlan(id: number): Promise<void> {
    const plan = await this.findPlanById(id);
    // التحقق من وجود اشتراكات مرتبطة
    const subscriptionsCount = await this.subscriptionsRepository.count({
      where: { planId: id },
    });
    if (subscriptionsCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan with active subscriptions. Found ${subscriptionsCount} subscription(s).`,
      );
    }
    await this.plansRepository.remove(plan);
  }

  // ========== Subscriptions ==========

  async createSubscription(createDto: CreateSubscriptionDto): Promise<Subscription> {
    const user = await this.usersRepository.findOne({ where: { id: createDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${createDto.userId} not found`);
    }

    const plan = await this.findPlanById(createDto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('Cannot create subscription with inactive plan');
    }

    // إنشاء الاشتراك بحالة PENDING
    const subscription = this.subscriptionsRepository.create({
      userId: createDto.userId,
      planId: createDto.planId,
      status: SubscriptionStatus.PENDING,
      startDate: new Date(), // سيتم تحديثه عند التفعيل
      endDate: new Date(), // سيتم تحديثه عند التفعيل
      notes: createDto.notes,
    });

    return this.subscriptionsRepository.save(subscription);
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    try {
      return await this.subscriptionsRepository.find({
        relations: ['user', 'plan', 'payments'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error loading subscriptions: ${error.message}`, error.stack);
      // Fallback: try to load without relations
      return this.subscriptionsRepository.find({
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findSubscriptionsByUser(userId: number): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { userId },
      relations: ['plan', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSubscriptionById(id: number): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
      relations: ['user', 'plan', 'payments'],
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async findActiveSubscriptionByUser(userId: number): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: MoreThan(new Date()),
      },
      relations: ['plan'],
      order: { endDate: 'DESC' },
    });
  }

  async activateSubscription(
    id: number,
    activateDto: ActivateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findSubscriptionById(id);

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already active');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Cannot activate cancelled subscription');
    }

    const startDate = activateDto.startDate
      ? new Date(activateDto.startDate)
      : new Date();

    // حساب تاريخ الانتهاء بناءً على مدة الباقة
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + subscription.plan.durationMonths);

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.activatedAt = new Date();
    if (activateDto.notes) {
      subscription.notes = activateDto.notes;
    }

    // تفعيل حساب المستخدم
    await this.usersRepository.update(subscription.userId, { isActive: true });

    return this.subscriptionsRepository.save(subscription);
  }

  async cancelSubscription(id: number): Promise<Subscription> {
    const subscription = await this.findSubscriptionById(id);
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    return this.subscriptionsRepository.save(subscription);
  }

  // ========== Payments ==========

  async createPayment(createDto: CreatePaymentDto): Promise<Payment> {
    const subscription = await this.findSubscriptionById(createDto.subscriptionId);

    // Ensure amount is properly converted to number
    const payment = this.paymentsRepository.create({
      subscriptionId: Number(createDto.subscriptionId),
      amount: Number(createDto.amount),
      method: createDto.method,
      transactionId: createDto.transactionId,
      receiptNumber: createDto.receiptNumber,
      notes: createDto.notes,
      userId: subscription.userId,
      status: PaymentStatus.PENDING,
      paidAt: createDto.paidAt ? new Date(createDto.paidAt) : null,
    });

    return this.paymentsRepository.save(payment);
  }

  async findAllPayments(): Promise<Payment[]> {
    try {
      return await this.paymentsRepository.find({
        relations: ['user', 'subscription', 'subscription.plan'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error loading payments: ${error.message}`, error.stack);
      // Fallback: return payments without relations if relations fail
      return this.paymentsRepository.find({
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findPaymentsByUser(userId: number): Promise<Payment[]> {
    try {
      return await this.paymentsRepository.find({
        where: { userId },
        relations: ['subscription', 'subscription.plan'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error loading payments for user ${userId}: ${error.message}`, error.stack);
      // Fallback: return payments without relations if relations fail
      return this.paymentsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findPaymentById(id: number): Promise<Payment> {
    try {
      const payment = await this.paymentsRepository.findOne({
        where: { id },
        relations: ['user', 'subscription', 'subscription.plan'],
      });
      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
      return payment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error loading payment ${id}: ${error.message}`, error.stack);
      // Fallback: try without relations
      const payment = await this.paymentsRepository.findOne({
        where: { id },
      });
      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
      return payment;
    }
  }

  async updatePayment(id: number, updateDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findPaymentById(id);

    const wasPending = payment.status === PaymentStatus.PENDING;
    const isNowCompleted = updateDto.status === PaymentStatus.COMPLETED;

    Object.assign(payment, updateDto);
    if (updateDto.paidAt) {
      payment.paidAt = new Date(updateDto.paidAt);
    } else if (isNowCompleted && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    const updatedPayment = await this.paymentsRepository.save(payment);

    // إذا تم تأكيد الدفع، تفعيل الاشتراك تلقائياً
    if (wasPending && isNowCompleted) {
      try {
        await this.activateSubscription(payment.subscriptionId, {});
        this.logger.log(
          `Auto-activated subscription ${payment.subscriptionId} after payment completion`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to auto-activate subscription ${payment.subscriptionId}: ${error.message}`,
        );
      }
    }

    return updatedPayment;
  }

  // ========== Utility Methods ==========

  /**
   * التحقق من انتهاء الاشتراكات وتعطيلها تلقائياً
   * يجب استدعاء هذه الدالة بشكل دوري (مثلاً كل ساعة)
   */
  async checkAndExpireSubscriptions(): Promise<number> {
    const now = new Date();
    const expiredSubscriptions = await this.subscriptionsRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
      relations: ['user'],
    });

    let expiredCount = 0;
    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionsRepository.save(subscription);

      // تعطيل حساب المستخدم
      await this.usersRepository.update(subscription.userId, { isActive: false });
      expiredCount++;

      this.logger.log(
        `Expired subscription ${subscription.id} for user ${subscription.userId}`,
      );
    }

    return expiredCount;
  }

  /**
   * الحصول على إحصائيات الاشتراكات
   */
  async getSubscriptionStats() {
    try {
      const [
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        pendingSubscriptions,
        totalPayments,
        completedPayments,
        pendingPayments,
      ] = await Promise.all([
        this.subscriptionsRepository.count(),
        this.subscriptionsRepository.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
        this.subscriptionsRepository.count({
          where: { status: SubscriptionStatus.EXPIRED },
        }),
        this.subscriptionsRepository.count({
          where: { status: SubscriptionStatus.PENDING },
        }),
        this.paymentsRepository.count(),
        this.paymentsRepository.count({
          where: { status: PaymentStatus.COMPLETED },
        }),
        this.paymentsRepository.count({
          where: { status: PaymentStatus.PENDING },
        }),
      ]);

      // حساب إجمالي الإيرادات
      let totalRevenue = 0;
      try {
        const completedPaymentsData = await this.paymentsRepository.find({
          where: { status: PaymentStatus.COMPLETED },
        });
        totalRevenue = completedPaymentsData.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        );
      } catch (err) {
        this.logger.error(`Error calculating revenue: ${err.message}`);
      }

      return {
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          expired: expiredSubscriptions,
          pending: pendingSubscriptions,
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          pending: pendingPayments,
        },
        revenue: {
          total: totalRevenue,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`, error.stack);
      // Return empty stats instead of crashing
      return {
        subscriptions: { total: 0, active: 0, expired: 0, pending: 0 },
        payments: { total: 0, completed: 0, pending: 0 },
        revenue: { total: 0 },
      };
    }
  }

  /**
   * التحقق من صلاحية اشتراك المستخدم
   */
  async isUserSubscriptionActive(userId: number): Promise<boolean> {
    const activeSubscription = await this.findActiveSubscriptionByUser(userId);
    return activeSubscription !== null;
  }
}

